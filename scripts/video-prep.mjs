#!/usr/bin/env node
/**
 * Prepara um vídeo de fundo: encolhe, tira-lhe o som, guarda o primeiro
 * fotograma, e envia os dois para o armazenamento.
 *
 * Os vídeos do site antigo vêm em 1080p a 7 Mbps — 6 MB para sete segundos de
 * fundo em ciclo. Um fundo não precisa de 1080p nem de som, e a 1600 px com
 * CRF 30 o mesmo plano fica em 400 KB: quinze vezes menos, sem diferença
 * visível num fundo escurecido. O fotograma serve de cartaz, e é ele que fica
 * para quem pediu menos movimento.
 *
 *   node scripts/video-prep.mjs <ficheiro-ou-endereço> --nome=ia-hero [--largura=1600] [--crf=30]
 *
 * Precisa do ffmpeg no sistema e do BLOB_READ_WRITE_TOKEN no ambiente.
 * Imprime o endereço do MP4 para colar no campo "Vídeo de topo" do painel.
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
const largura = Number(valor("largura") ?? 1600);
const crf = Number(valor("crf") ?? 30);
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

// Sem som, com o índice à cabeça (faststart) para começar a tocar antes de
// estar todo carregado.
execFileSync("ffmpeg", [
  "-v", "error", "-y", "-i", entrada,
  "-an", "-c:v", "libx264", "-crf", String(crf), "-preset", "slow",
  "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-vf", `scale=${largura}:-2`, mp4,
]);
execFileSync("ffmpeg", ["-v", "error", "-y", "-ss", String(segundo), "-i", entrada, "-frames:v", "1", "-vf", `scale=${largura}:-2`, cartaz]);

const antes = fs.statSync(entrada).size;
const depois = fs.statSync(mp4).size;
console.log(`${nome}: ${Math.round(antes / 1024)} KB → ${Math.round(depois / 1024)} KB`);

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
