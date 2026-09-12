#!/usr/bin/env node
/**
 * O artigo lido em voz alta.
 *
 * Gera a leitura de cada artigo com a ElevenLabs, junta os pedaços num MP3,
 * mede-o, envia-o para o Blob e escreve no artigo o endereço, a duração, a voz
 * e a impressão digital do texto lido.
 *
 * É a impressão digital que faz isto poder correr todos os dias: um artigo cujo
 * corpo não mudou não volta a ser falado. Sem ela, cada correção de vírgula
 * obrigava a escolher entre pagar tudo outra vez e nunca mais acertar nada.
 *
 * Porquê a ElevenLabs. O problema desta casa não é o preço da síntese, é o
 * português europeu: quase toda a síntese moderna assume o Brasil. A Cartesia
 * faz o português cair no sotaque brasileiro; as vozes novas da Google não
 * cobrem pt-PT; o Piper tem licenças por voz e diz-se para uso pessoal e
 * investigação, o que não serve num blog comercial. Ficavam a Azure, a Polly e
 * esta — e esta é a única que não é de uma hiperescala, distingue Portugal do
 * Brasil, e deixa um dia a casa ler os artigos com a voz de quem os escreve.
 *
 *   ELEVENLABS_API_KEY=… npm run audio -- --vozes     # que vozes há para pt-PT
 *   ELEVENLABS_API_KEY=… npm run audio -- --amostra --voz=<id>,<id>
 *   ELEVENLABS_API_KEY=… npm run audio -- --so=<slug>
 *   ELEVENLABS_API_KEY=… npm run audio               # tudo o que falta ou mudou
 *
 * Opções: --so= --lingua=pt|en --limite= --voz= --modelo= --formato= --forcar --dry
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const flag = (nome) => args.includes(`--${nome}`);
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=").slice(1).join("=");

const so = valor("so");
const limite = Number(valor("limite") ?? 0) || Infinity;
const dry = flag("dry");
const forcar = flag("forcar");
const amostra = flag("amostra");
const listar = flag("vozes");
const linguas = valor("lingua") ? [valor("lingua")] : ["pt", "en"];

/**
 * O modelo.
 *
 * `eleven_multilingual_v2` é o mais estável para texto longo e aceita dez mil
 * caracteres por pedido. O `eleven_flash_v2_5` custa metade e aceita quarenta
 * mil, mas troca nuance por velocidade — e aqui não há pressa nenhuma: isto
 * corre uma vez por artigo, de madrugada se for preciso.
 */
const MODELO = valor("modelo") ?? "eleven_multilingual_v2";
const TETO = MODELO.includes("flash") || MODELO.includes("turbo") ? 35_000 : 9_000;
// 64 kbps chega e sobra para voz. Os 192 e os formatos sem compressão pedem
// escalões pagos mais altos, e não trazem nada a um artigo falado.
const FORMATO = valor("formato") ?? "mp3_44100_64";

/**
 * As vozes escolhidas, por língua.
 *
 * Ficam no ambiente e não aqui: a voz da casa é uma decisão de marca, muda sem
 * o código mudar, e um identificador da ElevenLabs no repositório não diz nada
 * a quem o lê daqui a um ano. `--vozes` lista as que há; `--amostra` grava a
 * mesma frase em cada uma para se escolher de ouvido.
 */
const VOZES = {
  pt: process.env.ELEVENLABS_VOICE_PT?.trim(),
  en: process.env.ELEVENLABS_VOICE_EN?.trim(),
};
const vozDe = (lingua) => valor("voz")?.split(",")[0] ?? VOZES[lingua];

const chave = process.env.ELEVENLABS_API_KEY?.trim();
const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN?.trim();

if (!chave) {
  console.error("falta ELEVENLABS_API_KEY");
  process.exit(2);
}

// ── A ElevenLabs ────────────────────────────────────────────────────────────

const API = "https://api.elevenlabs.io/v1";
const cabecalho = { "xi-api-key": chave, "Content-Type": "application/json" };

/**
 * Fala um pedaço.
 *
 * `previous_text` e `next_text` são o que faz um artigo partido em cinco
 * pedidos soar a uma leitura só: o modelo vê o fim do pedaço anterior e o
 * princípio do seguinte, e por isso não recomeça do zero em cada corte, com
 * outro tom e outra respiração. Sem eles, ouve-se a emenda.
 */
async function fala({ texto, voz, antes, depois }) {
  const resposta = await fetch(`${API}/text-to-speech/${voz}?output_format=${FORMATO}`, {
    method: "POST",
    headers: cabecalho,
    body: JSON.stringify({
      text: texto,
      model_id: MODELO,
      ...(antes ? { previous_text: antes } : {}),
      ...(depois ? { next_text: depois } : {}),
      voice_settings: {
        // Estável, para um texto longo não derivar de tom a meio; a semelhança
        // alta mantém a mesma pessoa do princípio ao fim; um pouco mais devagar
        // do que a conversa, porque isto é para ouvir a fazer outra coisa.
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0,
        use_speaker_boost: true,
        speed: 0.95,
      },
    }),
  });
  if (!resposta.ok) {
    throw new Error(`a ElevenLabs respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 300)}`);
  }
  return Buffer.from(await resposta.arrayBuffer());
}

/**
 * Pergunta à ElevenLabs, e diz alto quando ela não responde.
 *
 * Uma lista vazia por a chave não ter permissão lê-se exatamente como uma lista
 * vazia por não haver vozes — e a primeira vez que isso aconteceu perdeu-se uma
 * tarde a procurar vozes de pt-PT que a conta nunca chegou a ver.
 */
async function pergunta(caminho) {
  try {
    const resposta = await fetch(`${API}/${caminho}`, { headers: cabecalho });
    if (resposta.ok) return await resposta.json();
    console.error(`  (${caminho}: a ElevenLabs respondeu ${resposta.status} — ${(await resposta.text()).slice(0, 200)})`);
  } catch (erro) {
    console.error(`  (${caminho}: ${erro.message})`);
  }
  return { voices: [] };
}

/**
 * As vozes da conta e as da biblioteca partilhada que falam a língua.
 *
 * A biblioteca em português tem quatrocentas vozes e nove em cada dez são
 * brasileiras: pedir a primeira página trazia trinta do Brasil e duas de
 * Portugal, quando há trinta e duas de Portugal para ouvir. Daí percorrerem-se
 * as páginas todas em português e ficar o que não é brasileiro — é essa a
 * escolha que esta casa tem para fazer. Em inglês uma página chega.
 */
async function vozesDisponiveis(lingua) {
  const minhas = await pergunta("voices");

  const codigo = lingua === "pt" ? "pt" : "en";
  const partilhadas = [];
  const [paginas, porPagina] = codigo === "pt" ? [4, 100] : [1, 30];
  for (let pagina = 0; pagina < paginas; pagina++) {
    const { voices } = await pergunta(`shared-voices?page_size=${porPagina}&page=${pagina}&language=${codigo}`);
    if (!voices?.length) break;
    partilhadas.push(...voices.filter((v) => codigo !== "pt" || !/brazil/i.test(v.accent ?? "")));
  }

  const ficha = (voz, origem) => ({
    id: voz.voice_id,
    nome: voz.name,
    origem,
    sotaque: voz.labels?.accent ?? voz.accent ?? "",
    quem: [voz.labels?.gender ?? voz.gender, voz.labels?.age ?? voz.age].filter(Boolean).join(" "),
    descricao: (voz.labels?.description ?? voz.description ?? "").slice(0, 60),
    lingua: voz.labels?.language ?? voz.language ?? "",
  });

  return [
    ...(minhas.voices ?? []).map((voz) => ficha(voz, "conta")),
    ...partilhadas.map((voz) => ficha(voz, "biblioteca")),
  ];
}

// ── O texto ─────────────────────────────────────────────────────────────────

/**
 * O corpo do artigo em parágrafos de texto limpo.
 *
 * Anda pelo lexical e tira o que se lê: parágrafos, títulos, listas e citações.
 * Fica de fora o que não se diz em voz alta — imagens, vídeos, blocos de
 * código, legendas. Uma legenda lida no meio de uma frase é ruído; a imagem que
 * ela descreve não está lá para ninguém ouvir.
 */
function paragrafosDe(no, fora = []) {
  if (!no || typeof no !== "object") return fora;
  const tipo = no.type;

  if (tipo === "upload" || tipo === "block" || tipo === "code" || tipo === "horizontalrule") return fora;

  if (tipo === "paragraph" || tipo === "heading" || tipo === "quote" || tipo === "listitem") {
    const texto = textoDe(no).replace(/\s+/g, " ").trim();
    if (texto) fora.push({ texto, titulo: tipo === "heading" });
    if (tipo !== "listitem") return fora;
  }

  for (const filho of no.children ?? []) paragrafosDe(filho, fora);
  return fora;
}

function textoDe(no) {
  if (!no || typeof no !== "object") return "";
  if (typeof no.text === "string") return no.text;
  if (no.type === "upload" || no.type === "block" || no.type === "code") return "";
  return (no.children ?? []).map(textoDe).join(" ");
}

/**
 * O que a voz diz mal, e como se lhe diz melhor.
 *
 * Fica curto de propósito: cada entrada é uma correção medida de ouvido, não um
 * palpite. Afina-se depois de ouvir o primeiro artigo — é para isso que a
 * `--amostra` existe.
 */
const LEITURAS = [
  [/\bJellyCARE\b/g, "Jelly Care"],
  [/\bJELLY\b/g, "Jelly"],
];

/** O que vai ser dito, do princípio ao fim, já com as correções de leitura. */
function guiao({ titulo, paragrafos }) {
  return [{ texto: titulo, titulo: true }, ...paragrafos].map((linha) => ({
    ...linha,
    texto: LEITURAS.reduce((texto, [de, para]) => texto.replace(de, para), linha.texto),
  }));
}

/**
 * As linhas em texto corrido, com as pausas marcadas.
 *
 * A ElevenLabs não lê SSML, mas entende a etiqueta de pausa — é a única, e o
 * limite dela são três segundos. As pausas são a diferença entre uma leitura e
 * um debitar: a voz não sabe onde acaba uma secção, isso está na marcação.
 */
function escrito(linhas) {
  return (
    linhas
      .map((linha) =>
        linha.titulo
          ? `<break time="1.0s" /> ${linha.texto} <break time="0.4s" />`
          : `${linha.texto} <break time="0.5s" />`,
      )
      .join("\n")
      // Uma pausa à cabeça é um silêncio no princípio do ficheiro: quem carrega
      // em tocar fica um segundo a pensar que não funcionou.
      .replace(/^(?:<break[^>]*\/>\s*)+/, "")
  );
}

/**
 * Os pedaços.
 *
 * O pedido tem tecto de caracteres e um artigo de vinte mil não passa de uma
 * vez. Parte-se por parágrafos, nunca a meio de um: um corte a meio de uma
 * frase ouve-se, mesmo com a costura do `previous_text`.
 */
function pedacos(linhas, maximo) {
  const fora = [[]];
  let conta = 0;
  for (const linha of linhas) {
    if (conta + linha.texto.length > maximo && fora[fora.length - 1].length) {
      fora.push([]);
      conta = 0;
    }
    fora[fora.length - 1].push(linha);
    conta += linha.texto.length;
  }
  return fora.filter((pedaco) => pedaco.length);
}

/** Junta os pedaços num ficheiro só, sem recodificar. */
function junta(ficheiros, destino) {
  if (ficheiros.length === 1) {
    fs.copyFileSync(ficheiros[0], destino);
    return;
  }
  const lista = `${destino}.txt`;
  fs.writeFileSync(lista, ficheiros.map((f) => `file '${f}'`).join("\n"));
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", destino]);
}

const segundosDe = (ficheiro) =>
  Math.round(
    Number(
      execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ficheiro])
        .toString()
        .trim(),
    ),
  );

/** Fala um texto inteiro, pedaço a pedaço, e devolve o ficheiro. */
async function grava({ linhas, voz, destino, pasta, nome }) {
  const partes = pedacos(linhas, TETO);
  const ficheiros = [];
  for (const [i, parte] of partes.entries()) {
    const texto = escrito(parte);
    const anterior = i > 0 ? escrito(partes[i - 1]).slice(-500) : "";
    const seguinte = i + 1 < partes.length ? escrito(partes[i + 1]).slice(0, 500) : "";
    const ficheiro = path.join(pasta, `${nome}-${i}.mp3`);
    fs.writeFileSync(ficheiro, await fala({ texto, voz, antes: anterior, depois: seguinte }));
    ficheiros.push(ficheiro);
  }
  junta(ficheiros, destino);
  return destino;
}

// ── As vozes, e a escolha ───────────────────────────────────────────────────

if (listar) {
  for (const lingua of linguas) {
    console.log(`\n── ${lingua} ────────────────────────────────────────────`);
    for (const voz of await vozesDisponiveis(lingua)) {
      console.log(
        `${voz.id}  ${voz.nome.padEnd(22)} ${voz.origem.padEnd(11)} ${(voz.sotaque || voz.lingua).padEnd(14)} ${voz.quem.padEnd(18)} ${voz.descricao}`,
      );
    }
  }
  console.log(`\nOuve-as com --amostra --voz=<id>,<id>, e a escolhida entra em ELEVENLABS_VOICE_PT.`);
  process.exit(0);
}

if (amostra) {
  const escolhidas = (valor("voz") ?? "").split(",").filter(Boolean);
  if (!escolhidas.length) {
    console.error("diz quais: --amostra --voz=<id>,<id>   (corre --vozes para as ver)");
    process.exit(2);
  }
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "vozes-"));
  const linhas = {
    pt: [
      { texto: "A Jelly ajuda empresas a comunicar e a desempenhar melhor.", titulo: true },
      {
        texto:
          "Ligamos os pontos entre branding, marketing, comunicação e tecnologia. É o que fazemos todos os dias com os nossos clientes: dar qualidade de agência, com a ambição de quem leva uma marca mais longe.",
        titulo: false,
      },
    ],
    en: [
      { texto: "Jelly helps companies communicate and perform better.", titulo: true },
      {
        texto:
          "We connect the dots between branding, marketing, communication and technology. That is what we do every day with our clients: agency quality, with the ambition of someone taking a brand further.",
        titulo: false,
      },
    ],
  };
  for (const voz of escolhidas) {
    const destino = path.join(pasta, `${voz}.mp3`);
    await grava({ linhas: linhas[linguas[0]], voz, destino, pasta, nome: voz });
    console.log(`${voz}  ${destino}  ${segundosDe(destino)}s`);
  }
  console.log(`\nOuve-os e escolhe: a voz entra em ELEVENLABS_VOICE_PT (ou ELEVENLABS_VOICE_EN).`);
  process.exit(0);
}

// ── O trabalho ──────────────────────────────────────────────────────────────

if (!tokenBlob && !dry) {
  console.error("falta BLOB_READ_WRITE_TOKEN");
  process.exit(2);
}
for (const lingua of linguas) {
  if (!vozDe(lingua) && !dry) {
    console.error(`falta a voz de ${lingua}: corre --vozes, ouve com --amostra, e põe o id em ELEVENLABS_VOICE_${lingua.toUpperCase()}`);
    process.exit(2);
  }
}

const payload = await getPayload({ config });
const { docs } = await payload.find({
  collection: "posts",
  limit: 0,
  depth: 0,
  sort: "-date",
  ...(so ? { where: { or: [{ slug: { equals: so } }, { slugEn: { equals: so } }] } } : {}),
});

console.log(`${docs.length} artigo(s) a considerar\n`);

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "audio-"));
let feitos = 0;
let caracteres = 0;

for (const doc of docs) {
  if (feitos >= limite) break;

  for (const lingua of linguas) {
    const corpo = lingua === "pt" ? doc.body : doc.bodyEn;
    const titulo = lingua === "pt" ? doc.titlePt : doc.titleEn || doc.titlePt;
    const paragrafos = paragrafosDe(corpo?.root);
    if (!paragrafos.length) continue;

    const linhas = guiao({ titulo, paragrafos });
    const texto = linhas.map((linha) => linha.texto).join("\n");
    const impressao = createHash("sha1").update(texto).digest("hex").slice(0, 16);
    const campo = lingua === "pt" ? "audioPt" : "audioEn";
    const campoHash = lingua === "pt" ? "audioPtHash" : "audioEnHash";

    if (!forcar && doc[campo] && doc[campoHash] === impressao) continue;

    const voz = vozDe(lingua);
    console.log(`${doc.slug} [${lingua}] ${texto.length} caracteres, ${pedacos(linhas, TETO).length} pedaço(s)`);
    caracteres += texto.length;
    if (dry) continue;

    const inteiro = path.join(pasta, `${doc.slug}-${lingua}.mp3`);
    await grava({ linhas, voz, destino: inteiro, pasta, nome: `${doc.slug}-${lingua}` });
    const segundos = segundosDe(inteiro);

    const enviado = await put(`audio/${doc.slug}-${lingua}.mp3`, fs.readFileSync(inteiro), {
      access: "public",
      token: tokenBlob,
      contentType: "audio/mpeg",
      addRandomSuffix: false,
      // Muda com o artigo, e o endereço é o mesmo: um ano de cache seria uma
      // gravação velha a tocar durante um ano.
      cacheControlMaxAge: 60 * 60 * 24,
      allowOverwrite: true,
    });

    await payload.update({
      collection: "posts",
      id: doc.id,
      data: {
        [campo]: enviado.url,
        [lingua === "pt" ? "audioPtSegundos" : "audioEnSegundos"]: segundos,
        [lingua === "pt" ? "audioPtVoz" : "audioEnVoz"]: voz,
        [campoHash]: impressao,
      },
    });

    const minutos = `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
    console.log(`  ✓ ${minutos}  ${(fs.statSync(inteiro).size / 1048576).toFixed(1)} MB`);
    feitos += 1;
    if (feitos >= limite) break;
  }
}

// A conta, porque isto gasta dinheiro de verdade: 0,10 dólares por mil
// caracteres no multilingual v2, metade no flash.
const porMil = MODELO.includes("flash") || MODELO.includes("turbo") ? 0.05 : 0.1;
console.log(
  `\n${feitos} gravação(ões), ${caracteres.toLocaleString("pt-PT")} caracteres (~${((caracteres / 1000) * porMil).toFixed(2)} USD)`,
);

if (feitos && !dry) await purgeSite();
process.exit(0);
