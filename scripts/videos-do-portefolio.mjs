#!/usr/bin/env node
/**
 * Os vídeos dos casos, do disco para o Blob da Vercel.
 *
 * Os 48 ficheiros que as histórias dos casos pedem viviam em
 * jelly.pt/video/portefolio/ e caíram com o alojamento antigo. Estão numa
 * pasta de 5 GB que ninguém quer no repositório nem a passar por um anexo de
 * conversa. Este guião faz o caminho curto: lê da pasta só o que as histórias
 * pedem, e leva-o directamente ao Blob.
 *
 * Por omissão só conta o que encontra e o que falta — não envia nada. É de
 * propósito: cinco gigabytes enviados por engano pagam-se.
 *
 *   node scripts/videos-do-portefolio.mjs <pasta>            # só o inventário
 *   node scripts/videos-do-portefolio.mjs <pasta> --enviar   # envia mesmo
 *
 * Precisa de BLOB_READ_WRITE_TOKEN no ambiente — o mesmo que o painel usa.
 * Está nas variáveis do projeto na Vercel; não o escrevas em lado nenhum que
 * fique guardado.
 */
import { readdir, stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import projetos from "../src/content/generated/projects.json" with { type: "json" };

const pasta = process.argv[2];
const enviar = process.argv.includes("--enviar");
if (!pasta) {
  console.error("uso: node scripts/videos-do-portefolio.mjs <pasta> [--enviar]");
  process.exit(2);
}

/** Os nomes que as histórias pedem, tal como estão escritos nos endereços. */
const pedidos = new Map();
const anda = (no, slug) => {
  if (Array.isArray(no)) return no.forEach((item) => anda(item, slug));
  if (!no || typeof no !== "object") return;
  for (const [chave, valor] of Object.entries(no)) {
    if ((chave === "mp4" || chave === "webm") && typeof valor === "string" && valor) {
      const nome = decodeURIComponent(valor.split("/").pop());
      if (!pedidos.has(nome)) pedidos.set(nome, []);
      pedidos.get(nome).push(slug);
    } else anda(valor, slug);
  }
};
for (const projeto of projetos) {
  anda(projeto.story, projeto.slug);
  anda(projeto.storyEn, projeto.slug);
}

// O disco não distingue maiúsculas da mesma maneira em todo o lado, e há
// endereços escritos com «.webM». Compara-se por minúsculas.
const naPasta = new Map();
for (const nome of await readdir(pasta)) naPasta.set(nome.toLowerCase(), nome);

const encontrados = [];
const emFalta = [];
for (const [nome, slugs] of pedidos) {
  const real = naPasta.get(nome.toLowerCase());
  if (real) encontrados.push({ pedido: nome, real, slugs });
  else emFalta.push({ nome, slugs });
}

let total = 0;
for (const item of encontrados) {
  item.bytes = (await stat(path.join(pasta, item.real))).size;
  total += item.bytes;
}
const mb = (n) => (n / 1024 / 1024).toFixed(1) + " MB";

console.log(`pedidos pelas histórias: ${pedidos.size}`);
console.log(`encontrados na pasta:    ${encontrados.length}  (${mb(total)})`);
console.log(`em falta:                ${emFalta.length}`);
for (const { nome, slugs } of emFalta) console.log(`  falta  ${nome}  — ${slugs.join(", ")}`);

const gordos = encontrados.filter((i) => i.bytes > 20 * 1024 * 1024).sort((a, b) => b.bytes - a.bytes);
if (gordos.length) {
  console.log(`\n${gordos.length} com mais de 20 MB — os maiores:`);
  for (const i of gordos.slice(0, 10)) console.log(`  ${mb(i.bytes).padStart(9)}  ${i.real}`);
  console.log("Um vídeo de caso não precisa de pesar isto. Vale a pena recomprimir antes de enviar.");
}

if (!enviar) {
  console.log("\nInventário apenas. Com --enviar, sobe os encontrados para o Blob.");
  process.exit(0);
}
if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("\nfalta BLOB_READ_WRITE_TOKEN no ambiente.");
  process.exit(2);
}

console.log("\na enviar…");
const enviados = [];
for (const item of encontrados) {
  const destino = `video/portefolio/${item.pedido}`;
  const { url } = await put(destino, createReadStream(path.join(pasta, item.real)), {
    access: "public",
    addRandomSuffix: false,
    contentType: item.pedido.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
  });
  enviados.push({ nome: item.pedido, url });
  console.log(`  ${mb(item.bytes).padStart(9)}  ${item.pedido}  →  ${url}`);
}
console.log(`\n${enviados.length} enviados. Guarda esta lista: é com ela que se reescrevem os endereços no painel.`);
