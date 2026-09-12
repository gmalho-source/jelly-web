#!/usr/bin/env node
/**
 * O artigo lido em voz alta.
 *
 * Gera a leitura de cada artigo com a síntese da Azure, junta os pedaços num
 * MP3, mede-o, envia-o para o Blob e escreve no artigo o endereço, a duração, a
 * voz e a impressão digital do texto lido.
 *
 * É a impressão digital que faz isto poder correr todos os dias: um artigo cujo
 * corpo não mudou não volta a ser falado. Sem ela, cada correção de vírgula
 * obrigava a escolher entre pagar tudo outra vez e nunca mais acertar nada.
 *
 * Porquê a Azure e não outra: o português europeu é uma língua de primeira
 * classe lá — Raquel, Duarte e Fernanda são vozes nativas de pt-PT. As vozes
 * novas da Google não cobrem pt-PT, e a ElevenLabs soa melhor mas o sotaque
 * europeu é menos previsível e custa cinco vezes mais.
 *
 *   AZURE_SPEECH_KEY=… npm run audio -- --amostra
 *   AZURE_SPEECH_KEY=… npm run audio -- --so=o-que-e-geo-motores-de-ia
 *   AZURE_SPEECH_KEY=… npm run audio -- --limite=5
 *   AZURE_SPEECH_KEY=… npm run audio            # tudo o que falta ou mudou
 *
 * Opções: --so= --lingua=pt|en --limite= --voz= --forcar --dry --amostra
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
const linguas = valor("lingua") ? [valor("lingua")] : ["pt", "en"];

/**
 * As vozes.
 *
 * pt-PT tem três, e a escolha é de ouvido: `--amostra` grava o mesmo parágrafo
 * nas três para se decidir com os ouvidos e não com uma tabela. Em inglês fica
 * uma voz britânica — esta casa escreve inglês europeu, e um sotaque americano
 * a ler «Jelly, Lisbon» soa a outra agência.
 */
const VOZES = {
  pt: { padrao: "pt-PT-RaquelNeural", todas: ["pt-PT-RaquelNeural", "pt-PT-DuarteNeural", "pt-PT-FernandaNeural"] },
  en: { padrao: "en-GB-SoniaNeural", todas: ["en-GB-SoniaNeural", "en-GB-RyanNeural"] },
};
const vozDe = (lingua) => valor("voz") ?? VOZES[lingua].padrao;

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

const chave = process.env.AZURE_SPEECH_KEY?.trim();
const regiao = process.env.AZURE_SPEECH_REGION?.trim() || "westeurope";
const tokenBlob = process.env.BLOB_READ_WRITE_TOKEN?.trim();

if (!chave) {
  console.error("falta AZURE_SPEECH_KEY (e AZURE_SPEECH_REGION, se não for westeurope)");
  process.exit(2);
}

// ── O texto ─────────────────────────────────────────────────────────────────

/** Escapa o que o XML não deixa passar. Um «&» numa frase parte o pedido todo. */
const escapa = (texto) => texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

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
    // Um título é uma entrada nova: marca-se para a voz respirar antes dele.
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

/** O que vai ser dito, do princípio ao fim, já com as correções de leitura. */
function guiao({ titulo, autor, paragrafos, lingua }) {
  const abertura = [{ texto: titulo, titulo: true }];
  if (autor) abertura.push({ texto: lingua === "pt" ? `Por ${autor}.` : `By ${autor}.`, titulo: false });
  return [...abertura, ...paragrafos].map((linha) => ({
    ...linha,
    texto: LEITURAS.reduce((texto, [de, para]) => texto.replace(de, para), linha.texto),
  }));
}

/**
 * O SSML de um pedaço.
 *
 * As pausas são a diferença entre uma leitura e um debitar: meio segundo entre
 * parágrafos, quase um antes de cada título. A voz não sabe onde acaba uma
 * secção — isso está na marcação, não no texto.
 */
function ssml(linhas, lingua, voz) {
  const corpo = linhas
    .map((linha) =>
      linha.titulo
        ? `<break time="800ms"/><p>${escapa(linha.texto)}</p><break time="400ms"/>`
        : `<p>${escapa(linha.texto)}</p><break time="500ms"/>`,
    )
    .join("\n");
  return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lingua === "pt" ? "pt-PT" : "en-GB"}">
  <voice name="${voz}"><prosody rate="-4%">${corpo}</prosody></voice>
</speak>`;
}

/**
 * Os pedaços.
 *
 * O pedido à Azure tem tecto — de caracteres e de minutos de áudio — e um
 * artigo de vinte mil caracteres não passa de uma vez. Parte-se por parágrafos,
 * nunca a meio de um: um corte a meio de uma frase ouve-se.
 */
function pedacos(linhas, maximo = 3000) {
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

// ── A Azure ─────────────────────────────────────────────────────────────────

async function fala(texto, lingua, voz) {
  const resposta = await fetch(`https://${regiao}.tts.speech.microsoft.com/cognitiveservices/v1`, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": chave,
      "Content-Type": "application/ssml+xml",
      // 48 kbps mono chega e sobra para voz, e é o que faz um artigo de nove
      // minutos pesar três megabytes em vez de dez.
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "jelly-web",
    },
    body: ssml(texto, lingua, voz),
  });
  if (!resposta.ok) throw new Error(`a Azure respondeu ${resposta.status}: ${(await resposta.text()).slice(0, 200)}`);
  return Buffer.from(await resposta.arrayBuffer());
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

// ── A amostra ───────────────────────────────────────────────────────────────

if (amostra) {
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "vozes-"));
  const linhas = [
    { texto: "A Jelly ajuda empresas a comunicar e a desempenhar melhor.", titulo: true },
    {
      texto:
        "Ligamos os pontos entre branding, marketing, comunicação e tecnologia. É o que fazemos todos os dias com os nossos clientes: dar qualidade de agência, com a ambição de quem leva uma marca mais longe.",
      titulo: false,
    },
  ];
  const emIngles = [
    { texto: "Jelly helps companies communicate and perform better.", titulo: true },
    {
      texto:
        "We connect the dots between branding, marketing, communication and technology. That is what we do every day with our clients: agency quality, with the ambition of someone taking a brand further.",
      titulo: false,
    },
  ];
  for (const lingua of linguas) {
    for (const voz of VOZES[lingua].todas) {
      const ficheiro = path.join(pasta, `${voz}.mp3`);
      fs.writeFileSync(ficheiro, await fala(lingua === "pt" ? linhas : emIngles, lingua, voz));
      console.log(`${voz}  ${ficheiro}  ${segundosDe(ficheiro)}s`);
    }
  }
  console.log(`\nOuve-os e escolhe: a voz entra em --voz=, ou passa a ser o padrão no guião.`);
  process.exit(0);
}

// ── O trabalho ──────────────────────────────────────────────────────────────

if (!tokenBlob && !dry) {
  console.error("falta BLOB_READ_WRITE_TOKEN");
  process.exit(2);
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

    const linhas = guiao({ titulo, autor: "", paragrafos, lingua });
    const texto = linhas.map((linha) => linha.texto).join("\n");
    const impressao = createHash("sha1").update(texto).digest("hex").slice(0, 16);
    const campo = lingua === "pt" ? "audioPt" : "audioEn";
    const campoHash = lingua === "pt" ? "audioPtHash" : "audioEnHash";

    if (!forcar && doc[campo] && doc[campoHash] === impressao) continue;

    const voz = vozDe(lingua);
    const partes = pedacos(linhas);
    console.log(`${doc.slug} [${lingua}] ${texto.length} caracteres, ${partes.length} pedaço(s), ${voz}`);
    caracteres += texto.length;
    if (dry) continue;

    const ficheiros = [];
    for (const [i, parte] of partes.entries()) {
      const ficheiro = path.join(pasta, `${doc.slug}-${lingua}-${i}.mp3`);
      fs.writeFileSync(ficheiro, await fala(parte, lingua, voz));
      ficheiros.push(ficheiro);
    }

    const inteiro = path.join(pasta, `${doc.slug}-${lingua}.mp3`);
    junta(ficheiros, inteiro);
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

// A conta, porque isto gasta dinheiro de verdade: 16 dólares por milhão de
// caracteres no escalão neural, com o primeiro meio milhão de cada mês de graça.
const dolares = ((caracteres / 1_000_000) * 16).toFixed(2);
console.log(`\n${feitos} gravação(ões), ${caracteres.toLocaleString("pt-PT")} caracteres (~${dolares} USD)`);

if (feitos && !dry) await purgeSite();
process.exit(0);
