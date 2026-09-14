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
 *   GEMINI_API_KEY=… node scripts/voz-gemini.mjs --vozes
 *   GEMINI_API_KEY=… node scripts/voz-gemini.mjs --voz=Kore,Charon
 *
 * Opções: --voz= --modelo= --instrucao= --saida=
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

const TEXTO =
  "A Jelly ajuda empresas a comunicar e a desempenhar melhor. " +
  "Ligamos os pontos entre branding, marketing, comunicação e tecnologia. " +
  "É o que fazemos todos os dias com os nossos clientes: dar qualidade de agência, " +
  "com a ambição de quem leva uma marca mais longe.";

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
  const destino = path.join(pasta, `gemini-${voz}.wav`);
  fs.writeFileSync(destino, wav(Buffer.from(dados, "base64")));
  console.log(`${voz.padEnd(14)} ${destino}`);
}

console.log(`\nOuve-as contra a Beatriz. O que se julga é uma coisa só: se soa a Portugal.`);
