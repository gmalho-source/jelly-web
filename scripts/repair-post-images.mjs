#!/usr/bin/env node
/**
 * Repõe as imagens que aparecem no meio dos artigos.
 *
 * O export do WordPress trouxe-as — 155 imagens em 56 artigos — mas o conversor
 * para Lexical não tinha ramo para elas e cada uma virou um parágrafo vazio.
 * Este script carrega a imagem, troca o parágrafo vazio por um nó de upload, e
 * faz o mesmo no corpo em inglês, na mesma posição: as duas árvores nasceram da
 * mesma lista de blocos, por isso o índice serve as duas.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:images -- --dry-run
 *
 * Idempotente: um artigo cujo corpo já tenha o nó de upload fica como está.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const limit = Number(value("limit") ?? 0) || Infinity;

const posts = JSON.parse(fs.readFileSync(path.join(root, "src/content/generated/posts.json"), "utf8"));
const comImagens = posts.filter((post) => (post.body ?? []).some((block) => block.type === "image")).slice(0, limit);

console.log(`${comImagens.length} artigos com imagens no corpo${dryRun ? " (ensaio)" : ""}`);

const payload = await getPayload({ config });

const uploadNode = (mediaId) => ({
  type: "upload",
  version: 3,
  relationTo: "media",
  value: mediaId,
  fields: null,
  format: "",
});

const vazio = (node) =>
  !node ||
  (node.type === "paragraph" &&
    !(node.children ?? []).some((child) => typeof child.text === "string" && child.text.trim()));

let reparados = 0;
let imagens = 0;
let saltados = 0;

for (const local of comImagens) {
  const { docs } = await payload.find({
    collection: "posts",
    where: { slug: { equals: local.slug } },
    limit: 1,
    depth: 0,
  });
  const doc = docs[0];
  if (!doc) {
    console.log(`? ${local.slug}: não está na base`);
    continue;
  }

  const body = structuredClone(doc.body);
  const bodyEn = doc.bodyEn ? structuredClone(doc.bodyEn) : null;
  const children = body?.root?.children;
  if (!Array.isArray(children)) {
    console.log(`? ${local.slug}: corpo sem estrutura`);
    continue;
  }

  if (children.some((node) => node.type === "upload")) {
    saltados += 1;
    continue;
  }

  let mexidos = 0;
  for (const [index, block] of (local.body ?? []).entries()) {
    if (block.type !== "image" || !block.src) continue;

    let mediaId;
    if (!dryRun) {
      const existente = await payload.find({
        collection: "media",
        where: { legacyUrl: { equals: block.src } },
        limit: 1,
        depth: 0,
      });
      if (existente.docs.length) {
        mediaId = existente.docs[0].id;
      } else {
        const response = await fetch(block.src, { headers: { "user-agent": "Mozilla/5.0", accept: "image/*,*/*" } });
        if (!response.ok) {
          console.log(`! ${local.slug}: ${response.status} em ${block.src}`);
          continue;
        }
        const data = Buffer.from(await response.arrayBuffer());
        const name = decodeURIComponent(path.basename(new URL(block.src).pathname));
        const criado = await payload.create({
          collection: "media",
          data: { alt: block.alt || local.title, legacyUrl: block.src },
          file: { name, data, mimetype: `image/${path.extname(name).slice(1) || "jpeg"}`, size: data.byteLength },
        });
        mediaId = criado.id;
      }
    }

    // O parágrafo vazio no lugar da imagem dá lugar ao nó de upload; se não
    // houver parágrafo vazio ali, insere-se sem apagar nada.
    const node = dryRun ? { type: "upload" } : uploadNode(mediaId);
    if (vazio(children[index])) children[index] = node;
    else children.splice(index, 0, node);
    if (bodyEn?.root?.children) {
      const enChildren = bodyEn.root.children;
      if (vazio(enChildren[index])) enChildren[index] = node;
      else enChildren.splice(index, 0, node);
    }
    mexidos += 1;
  }

  if (!mexidos) continue;
  imagens += mexidos;
  reparados += 1;

  if (!dryRun) {
    await payload.update({
      collection: "posts",
      id: doc.id,
      data: bodyEn ? { body, bodyEn } : { body },
    });
  }
  console.log(`✓ ${local.slug}: ${mexidos} imagens${bodyEn ? " (PT e EN)" : ""}`);
}

console.log(`${reparados} artigos, ${imagens} imagens${saltados ? `, ${saltados} já tinham` : ""}`);
if (imagens && !dryRun) await purgeSite();
process.exit(0);
