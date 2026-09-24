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
      // Decifra-se até parar de mudar: os vídeos do Louis Bourgon estão
      // guardados com a cifra feita duas vezes — «%2520» em vez de «%20» — e
      // uma decifra só deixava-os com os «%20» à vista, sem casar com nada.
      let nome = valor.split("/").pop();
      for (let volta = 0; volta < 3; volta += 1) {
        const decifrado = decodeURIComponent(nome);
        if (decifrado === nome) break;
        nome = decifrado;
      }
      if (!pedidos.has(nome)) pedidos.set(nome, []);
      pedidos.get(nome).push(slug);
    } else anda(valor, slug);
  }
};
for (const projeto of projetos) {
  anda(projeto.story, projeto.slug);
  anda(projeto.storyEn, projeto.slug);
}

/*
 * Os nomes não batem certo à letra, e não é por acaso: são ficheiros de 2019 a
 * 2025, carregados à mão para um WordPress que lhes mexeu no nome. Há «.webM»
 * com M grande, há acentos guardados de duas maneiras diferentes, e há um
 * «kompetenza-projects .webm» com um espaço a mais que o endereço não tem.
 *
 * Compara-se por uma chave sem maiúsculas, sem espaços e com os acentos
 * normalizados. O que se envia é sempre o nome que a história pede, e não o que
 * está no disco — assim o endereço resolve sem se mexer no painel.
 */
const chave = (nome) => nome.normalize("NFC").toLowerCase().replace(/\s+/g, "");

/*
 * E um caso que nenhuma regra apanha: a história pede o ficheiro com o sufixo
 * do conversor e a pasta tem-no sem ele. É o mesmo vídeo — o «Video 3» da NUK.
 */
const APELIDOS = new Map([["video3-nukestratégia(video-converter.com).mp4", "video3-nukestratégia.mp4"]]);

const naPasta = new Map();
for (const nome of await readdir(pasta)) naPasta.set(chave(nome), nome);

const encontrados = [];
const emFalta = [];
for (const [nome, slugs] of pedidos) {
  const k = chave(nome);
  const real = naPasta.get(k) ?? naPasta.get(APELIDOS.get(k) ?? "");
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
