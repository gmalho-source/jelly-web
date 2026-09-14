#!/usr/bin/env node
/**
 * Uma amostra de voz com o Gemini TTS, para comparar com a ElevenLabs.
 *
 * Isto não é um guião de produção: é a prova de que falta fazer antes de se
 * decidir trocar de fornecedor. Lê o mesmo texto da casa que o `npm run audio
 * -- --amostra` lê, para se poderem ouvir as duas seguidas sem margem para
 * dúvida.
 *
 * Porque é que vale a pena tentar, quando a documentação não promete pt-PT.
 * O Cloud Text-to-Speech da Google é um banco de vozes por locale, e ali o
 * `pt-PT` não existe nas gerações boas — o Chirp 3 HD cobre 29 locales e o
 * português que lá está é o do Brasil. O Gemini TTS é outra coisa: a língua e
 * o sotaque dizem-se por instrução, como se diz a um actor. A lista oficial
 * diz `pt` com o Brasil como variante, mas quem manda na leitura é o guião de
 * realização — e é isso que se está aqui a testar.
 *
 * O risco conhecido é o sotaque cair no Brasil, que foi exactamente o que
 * afastou a Cartesia. Ouve-se e vê-se.
 *
 * O que se ouviu, em Setembro de 2026, com doze amostras do mesmo artigo.
 * O sotaque aguenta: com a instrução abaixo, o `gemini-2.5-flash-preview-tts`
 * deu português de Portugal em todas as vozes que se tentaram — vogais átonas
 * fechadas, «s» final chiado, o «de» sem africação. A Vindemiatrix foi a mais
 * limpa; a Charon é a voz de homem que se aguenta. Curiosamente o
 * `gemini-3.1-flash-tts-preview`, que é mais novo, é aqui pior: a mesma Kore
 * que no 2.5 sai de Lisboa, no 3.1 perde o «s» chiado e fica a meio do
 * Atlântico. Quem trocar de modelo volta a ouvir tudo.
 *
 * O que ainda falha é o inglês no meio do português: «Ads Manager» sai com
 * pronúncia inglesa a sério em vez da que um locutor português lhe daria, e
 * houve vozes a ler «media» como «mídia», que é do Brasil. Num artigo de
 * marketing isso aparece em cada parágrafo, e é o que falta resolver na
 * instrução antes de isto substituir a ElevenLabs.
 *
 *   GEMINI_API_KEY=… node scripts/voz-gemini.mjs --vozes
 *   GEMINI_API_KEY=… node scripts/voz-gemini.mjs --voz=Kore,Charon
 *   GEMINI_API_KEY=… node scripts/voz-gemini.mjs --voz=Kore --artigo=<slug>
 *
 * Opções: --voz= --modelo= --instrucao= --texto= --artigo= --saida=
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (nome) => args.includes(`--${nome}`);
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=").slice(1).join("=");

const chave = (process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY)?.trim();
if (!chave) {
  console.error("Falta a GEMINI_API_KEY. Cria-se de graça em aistudio.google.com/apikey.");
  process.exit(1);
}

const API = "https://generativelanguage.googleapis.com/v1beta";
const MODELO = valor("modelo") ?? "gemini-2.5-flash-preview-tts";

/**
 * O guião de realização.
 *
 * É aqui que se ganha ou perde o sotaque, e por isso é explícito até ao
 * exagero: a documentação da Google diz que vale mais nomear a cidade do que a
 * língua. «Português europeu» sozinho tem tendência a sair do Brasil.
 */
const INSTRUCAO =
  valor("instrucao") ??
  "Lê isto em português europeu de Portugal, com sotaque de Lisboa, como quem narra um artigo " +
    "de uma agência para clientes: calmo, claro, sem pressa e sem entusiasmo comercial. " +
    "Nunca português do Brasil: as vogais átonas são fechadas, o «s» final é chiado, e o " +
    "tratamento é o de Portugal.";

const APRESENTACAO =
  "A Jelly ajuda empresas a comunicar e a desempenhar melhor. " +
  "Ligamos os pontos entre branding, marketing, comunicação e tecnologia. " +
  "É o que fazemos todos os dias com os nossos clientes: dar qualidade de agência, " +
  "com a ambição de quem leva uma marca mais longe.";

/**
 * O princípio de um artigo verdadeiro, quando se lhe dá o slug.
 *
 * O parágrafo de apresentação chega para ouvir o sotaque, mas não chega para
 * decidir: quatro frases curtas e escritas para serem ditas não põem à prova o
 * que um artigo tem — números, siglas, nomes de produto em inglês no meio de
 * uma frase portuguesa, e frases longas onde a entoação se perde. É aí que
 * estas vozes se separam, e é por isso que vale mais julgá-las com o que elas
 * vão mesmo ler.
 *
 * Lê o catálogo gerado e não o CMS: isto tem de correr sem base de dados.
 */
function artigo(slug) {
  const catalogo = new URL("../src/content/generated/posts.json", import.meta.url);
  const posts = JSON.parse(fs.readFileSync(catalogo, "utf8"));
  const post = posts.find((p) => p.slug === slug);
  if (!post) {
    const alguns = posts.slice(0, 5).map((p) => p.slug).join("\n  ");
    throw new Error(`Não há artigo com o slug «${slug}». Alguns que há:\n  ${alguns}`);
  }
  // Os títulos das secções vão com o resto: quem ouve não vê os cabeçalhos, e
  // uma voz que os atira sem pausa é um defeito que se quer ouvir agora.
  const corpo = post.body.map((bloco) => bloco.text ?? "").filter(Boolean);
  const leitura = [post.title, ...corpo].join("\n\n");
  // Um minuto de leitura chega para julgar e não gasta a quota a dobrar.
  return leitura.length > 1200 ? `${leitura.slice(0, 1200).replace(/\s+\S*$/, "")}…` : leitura;
}

const TEXTO = valor("texto") ?? (valor("artigo") ? artigo(valor("artigo")) : APRESENTACAO);

async function api(caminho, corpo) {
  const resposta = await fetch(`${API}/${caminho}?key=${chave}`, {
    method: corpo ? "POST" : "GET",
    headers: corpo ? { "content-type": "application/json" } : undefined,
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (!resposta.ok) throw new Error(`${caminho} → ${resposta.status} ${(await resposta.text()).slice(0, 300)}`);
  return resposta.json();
}

if (flag("vozes")) {
  // Os modelos primeiro: os nomes destes previews mudam, e um 404 aqui explica
  // mais depressa do que um 404 na geração.
  const { models } = await api("models");
  const tts = models.filter((m) => /tts/i.test(m.name));
  console.log("modelos de voz:");
  for (const m of tts) console.log(" ", m.name.replace("models/", ""), "—", m.displayName ?? "");
  console.log(
    "\nvozes conhecidas do Gemini TTS (nomes próprios, não locales):\n" +
      "  Zephyr Puck Charon Kore Fenrir Leda Orus Aoede Callirrhoe Autonoe\n" +
      "  Enceladus Iapetus Umbriel Algieba Despina Erinome Algenib Rasalgethi\n" +
      "  Laomedeia Achernar Alnilam Schedar Gacrux Pulcherrima Achird\n" +
      "  Zubenelgenubi Vindemiatrix Sadachbia Sadaltager Sulafat\n" +
      "\nOuve duas ou três: --voz=Kore,Charon,Sulafat",
  );
  process.exit(0);
}

/** PCM cru (16 bits, mono) embrulhado num WAV que qualquer leitor abre. */
function wav(pcm, taxa = 24000) {
  const cabecalho = Buffer.alloc(44);
  cabecalho.write("RIFF", 0);
  cabecalho.writeUInt32LE(36 + pcm.length, 4);
  cabecalho.write("WAVE", 8);
  cabecalho.write("fmt ", 12);
  cabecalho.writeUInt32LE(16, 16);
  cabecalho.writeUInt16LE(1, 20);
  cabecalho.writeUInt16LE(1, 22);
  cabecalho.writeUInt32LE(taxa, 24);
  cabecalho.writeUInt32LE(taxa * 2, 28);
  cabecalho.writeUInt16LE(2, 32);
  cabecalho.writeUInt16LE(16, 34);
  cabecalho.write("data", 36);
  cabecalho.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([cabecalho, pcm]);
}

const vozes = (valor("voz") ?? "Kore").split(",").filter(Boolean);
const pasta = valor("saida") ?? fs.mkdtempSync(path.join(os.tmpdir(), "gemini-voz-"));
fs.mkdirSync(pasta, { recursive: true });

for (const voz of vozes) {
  const resposta = await api(`models/${MODELO}:generateContent`, {
    contents: [{ parts: [{ text: `${INSTRUCAO}\n\n${TEXTO}` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voz } } },
    },
  });
  const dados = resposta.candidates?.[0]?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (!dados) {
    console.error(`${voz}: veio sem áudio — ${JSON.stringify(resposta).slice(0, 300)}`);
    continue;
  }
  const destino = path.join(pasta, `gemini-${MODELO.replace(/[^a-z0-9.]+/gi, "-")}-${voz}.wav`);
  fs.writeFileSync(destino, wav(Buffer.from(dados, "base64")));
  console.log(`${voz.padEnd(14)} ${destino}`);
}

console.log(`\nOuve-as contra a Beatriz. O que se julga é uma coisa só: se soa a Portugal.`);
