#!/usr/bin/env node
/**
 * Prepara um vídeo para o site: converte, encolhe, guarda o primeiro fotograma,
 * e envia os dois para o armazenamento.
 *
 * Dois modos, porque um fundo e um filme não são a mesma coisa.
 *
 * **Fundo** (por omissão) é o que corre sozinho por trás de um texto. Não
 * precisa de som, mas precisa de 1080p: um fundo abre em cheio, e num monitor
 * de 2560 px um ficheiro de 1600 é esticado antes de se ver. Fica em 1920 px
 * com CRF 26.
 *
 * A régua era 1600 px e CRF 30, e era drástica de mais. Os fundos que saíram
 * assim ficaram entre 100 e 780 kbps, e a perda via-se em movimento e nos
 * gradientes. O peso a mais é de três a cinco vezes — na ordem de 1,5 a 2,5 MB
 * por fundo — e num ficheiro que abre a página em cheio é dinheiro bem gasto.
 *
 * **Filme** (`--filme`) é uma peça que alguém se senta a ver: um spot, um
 * making-of. Fica em 1920 px, **com som**, e com uma régua mais alta ainda.
 * Tirar o som a um spot de televisão era o que este script fazia antes, e não
 * havia como pedir o contrário.
 *
 * Em qualquer dos modos a saída é **H.264**, e isso é metade da razão de ser
 * deste script. O spot do Slide & Splash foi carregado à mão em HEVC (H.265):
 * o Safari toca-o, o Chrome e o Firefox não, e na página aparecia parado. O
 * libx264 resolve isso de graça, seja qual for o codec de entrada.
 *
 *   node scripts/video-prep.mjs <ficheiro-ou-endereço> --nome=ia-hero
 *   node scripts/video-prep.mjs spot.mov --nome=slide-splash-spot --filme
 *
 * Opções: --largura --crf --fotograma --filme
 *
 * Precisa do ffmpeg no sistema e do BLOB_READ_WRITE_TOKEN no ambiente.
 * Imprime o endereço do MP4 para colar no painel.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { put } from "@vercel/blob";

const args = process.argv.slice(2);
const origem = args.find((a) => !a.startsWith("--"));
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];
const nome = valor("nome");
const filme = args.includes("--filme");
// 1080p nos dois modos: um fundo full-height ocupa o ecrã todo como um filme
// ocupa, e a diferença entre os dois é o som e a régua. CRF 26 no fundo, 23 no
// filme — a régua antiga (30 e 25) foi medida quando o peso mandava, e no
// ecrã lia-se.
const largura = Number(valor("largura") ?? 1920);
const crf = Number(valor("crf") ?? (filme ? 23 : 26));
const segundo = Number(valor("fotograma") ?? 1);

if (!origem || !nome) {
  console.error("uso: node scripts/video-prep.mjs <ficheiro|endereço> --nome=ia-hero");
  process.exit(2);
}

const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!token) {
  console.error("falta BLOB_READ_WRITE_TOKEN");
  process.exit(2);
}

const pasta = fs.mkdtempSync(path.join(os.tmpdir(), "video-"));
const entrada = path.join(pasta, "origem.mp4");

if (/^https?:\/\//.test(origem)) {
  const resposta = await fetch(origem, { headers: { "user-agent": "Mozilla/5.0 Chrome/141.0 Safari/537.36" } });
  if (!resposta.ok) throw new Error(`a origem respondeu ${resposta.status}`);
  fs.writeFileSync(entrada, Buffer.from(await resposta.arrayBuffer()));
} else {
  fs.copyFileSync(origem, entrada);
}

const mp4 = path.join(pasta, `${nome}.mp4`);
const cartaz = path.join(pasta, `${nome}-cartaz.jpg`);

// O que entrou, para quem estiver a ver o script a correr saber de onde veio.
try {
  const entrou = execFileSync("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=codec_name,width,height", "-of", "csv=p=0", entrada,
  ]).toString().trim();
  console.log(`entrada:  ${entrou}${/hevc|h265/i.test(entrou) ? "  ← HEVC: não toca no Chrome nem no Firefox" : ""}`);
} catch {
  // O ffprobe é informação, não é o trabalho. Se faltar, segue.
}

// Índice à cabeça (faststart) para começar a tocar antes de estar todo
// carregado. Um fundo perde o som; um filme guarda-o.
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", entrada,
  ...(filme ? ["-c:a", "aac", "-b:a", "128k", "-ac", "2"] : ["-an"]),
  "-c:v", "libx264", "-crf", String(crf), "-preset", filme ? "veryslow" : "slow",
  "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-vf", `scale=${largura}:-2`, mp4,
]);
// O cartaz é o que se vê antes de o vídeo tocar, e com `preload="metadata"`
// pode ser o que se vê durante um segundo inteiro: sai na melhor régua do JPEG.
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(segundo), "-i", entrada, "-frames:v", "1", "-q:v", "2", "-vf", `scale=${largura}:-2`, cartaz]);

const antes = fs.statSync(entrada).size;
const depois = fs.statSync(mp4).size;
const mb = (b) => `${(b / 1048576).toFixed(1).replace(".", ",")} MB`;
console.log(`${nome} (${filme ? "filme, com som" : "fundo, sem som"}): ${mb(antes)} → ${mb(depois)} em H.264`);

const enviado = await put(`video/${nome}.mp4`, fs.readFileSync(mp4), {
  access: "public",
  token,
  contentType: "video/mp4",
  addRandomSuffix: false,
  // Um vídeo de fundo não muda; se mudar, muda de nome.
  cacheControlMaxAge: 60 * 60 * 24 * 365,
  allowOverwrite: true,
});

console.log(`\nvídeo:    ${enviado.url}`);
console.log(`cartaz:   ${cartaz}  (carrega-o no painel como imagem e liga-o em "Primeiro fotograma")`);
if (filme) console.log(`\nNo painel, põe o bloco de vídeo em "Filme" — senão não mostra controlos.`);
