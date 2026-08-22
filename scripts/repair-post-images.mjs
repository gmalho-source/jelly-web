#!/usr/bin/env node
/**
 * Repõe as imagens que aparecem no meio dos artigos.
 *
 * A primeira migração perdeu as 155: o tema do site antigo carrega as imagens em
 * diferido e põe no `src` um SVG de 1x1 em base64, que foi o que ficou gravado.
 * O endereço verdadeiro está na API do WordPress, que devolve o corpo do artigo
 * sem esse truque de front-end.
 *
 * Como se acerta a posição: do corpo da API sai uma sequência de âncoras —
 * texto, imagem, texto, imagem — e cada imagem entra depois do parágrafo que a
 * precede, encontrado pelo início do texto. Contar não servia (o parser antigo
 * juntou e cortou parágrafos); o texto serve.
 *
 * O corpo inglês leva as mesmas imagens nas mesmas posições: nasceu do
 * português com o texto trocado, por isso a posição é a mesma ainda que o texto
 * não seja.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:images -- --dry-run
 *
 * Idempotente: um artigo que já tenha imagens no corpo fica como está.
 */
import path from "node:path";
import { parse } from "node-html-parser";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { uploadNode } from "./lexical-nodes.mjs";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const limit = Number(value("limit") ?? 0) || Infinity;
const onlySlug = value("slug");

const ORIGIN = "https://www.jelly.pt";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";

const normalize = (value = "") =>
  value
    .replace(/\[\/?[a-z0-9_]+[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** Endereço verdadeiro de uma imagem, ignorando o SVG de carregamento. */
function source(image) {
  const candidates = [
    image.getAttribute("data-src"),
    image.getAttribute("data-lazy-src"),
    image.getAttribute("data-large_image"),
    image.getAttribute("src"),
    (image.getAttribute("srcset") ?? "").split(",")[0]?.trim().split(" ")[0],
  ];
  return candidates.find((candidate) => candidate && !candidate.startsWith("data:")) ?? null;
}

/** Corpo do artigo na API do WordPress → sequência de âncoras. */
function anchors(html) {
  const root = parse(html ?? "", { blockTextElements: { script: false, style: false } });
  const out = [];

  const walk = (node) => {
    for (const child of node.childNodes) {
      const tag = child.rawTagName?.toLowerCase();
      if (!tag) continue;
      if (tag === "img") {
        const src = source(child);
        if (src) out.push({ kind: "image", src, alt: child.getAttribute("alt") ?? "" });
        continue;
      }
      const image = child.querySelector?.("img");
      const text = normalize(child.textContent);
      if (image && (tag === "figure" || tag === "p" || tag === "div" || tag === "span")) {
        const src = source(image);
        if (src) out.push({ kind: "image", src, alt: image.getAttribute("alt") ?? "" });
        if (text) out.push({ kind: "text", text });
        continue;
      }
      if (["p", "h1", "h2", "h3", "h4", "li", "blockquote"].includes(tag)) {
        if (text) out.push({ kind: "text", text });
        continue;
      }
      walk(child);
    }
  };

  walk(root);
  return out;
}

const payload = await getPayload({ config });

const where = onlySlug ? { slug: { equals: onlySlug } } : {};
const { docs } = await payload.find({ collection: "posts", where, limit: 0, depth: 0, sort: "-date" });

const vazio = (node) =>
  !node ||
  (node.type === "paragraph" &&
    !(node.children ?? []).some((child) => typeof child.text === "string" && child.text.trim()));

/** Carrega a imagem para o CMS, reaproveitando a que já lá esteja. */
async function media(src, alt) {
  const existing = await payload.find({ collection: "media", where: { legacyUrl: { equals: src } }, limit: 1, depth: 0 });
  if (existing.docs.length) return existing.docs[0].id;

  const response = await fetch(src, { headers: { "user-agent": UA, accept: "image/*,*/*" } });
  if (!response.ok) throw new Error(`${response.status} em ${src}`);
  const data = Buffer.from(await response.arrayBuffer());
  const name = decodeURIComponent(path.basename(new URL(src).pathname));
  const created = await payload.create({
    collection: "media",
    data: { alt: alt || name.replace(/[-_]/g, " ").replace(/\.\w+$/, ""), legacyUrl: src },
    file: { name, data, mimetype: `image/${path.extname(name).slice(1) || "jpeg"}`, size: data.byteLength },
  });
  return created.id;
}

let tocados = 0;
let imagens = 0;
let saltados = 0;
let semFonte = 0;

for (const doc of docs) {
  if (tocados >= limit) break;

  const children = doc.body?.root?.children;
  if (!Array.isArray(children)) continue;
  if (children.some((node) => node.type === "upload")) {
    saltados += 1;
    continue;
  }

  const response = await fetch(`${ORIGIN}/wp-json/wp/v2/posts?slug=${encodeURIComponent(doc.slug)}&_fields=content`, {
    headers: { "user-agent": UA },
  });
  if (!response.ok) {
    semFonte += 1;
    continue;
  }
  const json = await response.json();
  const sequencia = anchors(json?.[0]?.content?.rendered ?? "");
  const doArtigo = sequencia.filter((item) => item.kind === "image");
  if (!doArtigo.length) continue;

  // Cada imagem entra depois do parágrafo que a precede no artigo original.
  const plano = [];
  for (const [index, item] of sequencia.entries()) {
    if (item.kind !== "image") continue;
    const anterior = sequencia
      .slice(0, index)
      .reverse()
      .find((candidate) => candidate.kind === "text");
    const alvo = anterior
      ? children.findIndex((node) => {
          const texto = normalize((node.children ?? []).map((child) => child.text ?? "").join(" "));
          return texto && (texto.startsWith(anterior.text.slice(0, 40)) || anterior.text.startsWith(texto.slice(0, 40)));
        })
      : -1;
    plano.push({ src: item.src, alt: item.alt, at: alvo === -1 ? children.length : alvo + 1 });
  }

  console.log(`${dryRun ? "·" : "✓"} ${doc.slug}: ${plano.length} imagens`);
  imagens += plano.length;
  tocados += 1;
  if (dryRun) continue;

  const body = structuredClone(doc.body);
  const bodyEn = doc.bodyEn ? structuredClone(doc.bodyEn) : null;

  // De trás para a frente: inserir à frente não desloca o que falta inserir.
  for (const item of [...plano].sort((a, b) => b.at - a.at)) {
    let id;
    try {
      id = await media(item.src, item.alt);
    } catch (error) {
      console.log(`  ! ${error.message}`);
      continue;
    }
    for (const tree of [body, bodyEn]) {
      const list = tree?.root?.children;
      if (!list) continue;
      // Um nó por corpo: cada nó do Lexical tem o seu id.
      const node = uploadNode(id);
      // Onde a imagem estava, o parser antigo deixou um parágrafo vazio.
      if (vazio(list[item.at])) list[item.at] = node;
      else if (vazio(list[item.at - 1])) list[item.at - 1] = node;
      else list.splice(item.at, 0, node);
    }
  }

  await payload.update({ collection: "posts", id: doc.id, data: bodyEn ? { body, bodyEn } : { body } });
}

console.log(`${tocados} artigos, ${imagens} imagens${saltados ? `, ${saltados} já tinham` : ""}${semFonte ? `, ${semFonte} sem fonte` : ""}`);
if (imagens && !dryRun) await purgeSite();
process.exit(0);
