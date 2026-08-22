#!/usr/bin/env node
/**
 * Levantamento das imagens que aparecem no meio dos artigos, comparando o site
 * antigo com o novo — e, com `--fix`, reposição das que faltam.
 *
 * Porque é que isto foi preciso três vezes: o tema do site antigo esconde o
 * endereço da imagem em três sítios diferentes. No `src` põe um SVG de 1x1 em
 * base64; nas imagens do construtor de páginas põe o endereço em
 * `data-nectar-img-src`; e a API do WordPress devolve esses blocos como
 * shortcodes, sem imagem nenhuma. Quem lê só o `src`, ou só a API, encontra
 * zero. A página desenhada é a única fonte que tem tudo.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:audit
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:audit -- --fix
 *
 * Opções: --fix (repõe), --slug=um-artigo, --limit=N.
 */
import path from "node:path";
import { parse } from "node-html-parser";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { uploadNode } from "./lexical-nodes.mjs";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const fix = args.includes("--fix");
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const limit = Number(value("limit") ?? 0) || Infinity;
const onlySlug = value("slug");

const ORIGIN = "https://www.jelly.pt";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";

const normaliza = (valor = "") =>
  valor
    .replace(/\[\/?[a-z0-9_]+[^\]]*\]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

/** O endereço real de uma imagem, onde quer que o tema o tenha escondido. */
function endereco(img) {
  const candidatos = [
    img.getAttribute("data-nectar-img-src"),
    img.getAttribute("data-src"),
    img.getAttribute("data-lazy-src"),
    img.getAttribute("src"),
    (img.getAttribute("srcset") ?? "").split(",")[0]?.trim().split(" ")[0],
  ];
  return candidatos.find((valor) => valor && !valor.startsWith("data:")) ?? null;
}

const decorativa = (url) => /logo|jelly-cor|jelly-branco|avatar|placeholder|icon/i.test(url);

/**
 * Sequência do artigo desenhado: texto e imagem pela ordem em que aparecem.
 * Fora ficam o cabeçalho da página (que é a capa, já mostrada à parte) e tudo
 * o que vem depois dos artigos relacionados.
 */
function sequencia(html) {
  const inicio = html.indexOf("</header>") + 1 || 0;
  const fimCandidatos = ["related-post", "post-area-related", "id=\"footer-outer\"", "comments-section"];
  let fim = html.length;
  for (const marca of fimCandidatos) {
    const onde = html.indexOf(marca, inicio);
    if (onde > inicio) fim = Math.min(fim, onde);
  }

  const root = parse(html.slice(inicio, fim), { blockTextElements: { script: false, style: false } });
  const out = [];

  const anda = (node) => {
    for (const filho of node.childNodes) {
      const tag = filho.rawTagName?.toLowerCase();
      if (!tag || tag === "script" || tag === "style" || tag === "noscript") continue;

      const classe = filho.getAttribute?.("class") ?? "";
      if (/page-header|nectar-slider|portfolio-items|widget/.test(classe)) continue;

      if (tag === "img") {
        const src = endereco(filho);
        if (src && src.includes("/wp-content/uploads/") && !decorativa(src)) {
          out.push({ kind: "image", src, alt: filho.getAttribute("alt") ?? "" });
        }
        continue;
      }

      if (["p", "h1", "h2", "h3", "h4", "li", "blockquote"].includes(tag) && !filho.querySelector?.("img")) {
        const texto = normaliza(filho.textContent);
        if (texto.length > 12) out.push({ kind: "text", text: texto });
        continue;
      }

      anda(filho);
    }
  };

  anda(root);

  // A mesma imagem repetida em versões de ecrã diferentes conta uma vez.
  const vistos = new Set();
  return out.filter((item) => {
    if (item.kind !== "image") return true;
    const chave = item.src.replace(/-\d+x\d+(?=\.\w+$)/, "");
    if (vistos.has(chave)) return false;
    vistos.add(chave);
    return true;
  });
}

const payload = await getPayload({ config });

const where = onlySlug ? { slug: { equals: onlySlug } } : {};
const { docs } = await payload.find({ collection: "posts", where, limit: 0, depth: 0, sort: "-date" });

const vazio = (node) =>
  !node ||
  (node.type === "paragraph" &&
    !(node.children ?? []).some((filho) => typeof filho.text === "string" && filho.text.trim()));

async function media(src, alt, titulo) {
  const existente = await payload.find({ collection: "media", where: { legacyUrl: { equals: src } }, limit: 1, depth: 0 });
  if (existente.docs.length) return existente.docs[0].id;

  const resposta = await fetch(src, { headers: { "user-agent": UA, accept: "image/*,*/*" } });
  if (!resposta.ok) throw new Error(`${resposta.status} em ${src.split("/uploads/")[1] ?? src}`);
  const data = Buffer.from(await resposta.arrayBuffer());
  const nome = decodeURIComponent(path.basename(new URL(src).pathname));
  const criado = await payload.create({
    collection: "media",
    data: { alt: alt || titulo, legacyUrl: src },
    file: { name: nome, data, mimetype: `image/${path.extname(nome).slice(1) || "jpeg"}`, size: data.byteLength },
  });
  return criado.id;
}

const relatorio = [];
let tocados = 0;
let inseridas = 0;
let falhadas = 0;

for (const doc of docs.slice(0, limit)) {
  const caminho = doc.legacyPath || `/${doc.slug}/`;
  let html;
  try {
    const resposta = await fetch(`${ORIGIN}${caminho}`, { headers: { "user-agent": UA } });
    if (!resposta.ok) throw new Error(String(resposta.status));
    html = await resposta.text();
  } catch (error) {
    relatorio.push({ slug: doc.slug, antigas: "?", novas: "?", nota: `página antiga: ${error.message}` });
    continue;
  }

  const itens = sequencia(html);
  const antigas = itens.filter((item) => item.kind === "image");
  const children = doc.body?.root?.children ?? [];
  const novas = children.filter((node) => node.type === "upload").length;

  if (!antigas.length || novas >= antigas.length) {
    relatorio.push({ slug: doc.slug, antigas: antigas.length, novas, nota: novas >= antigas.length && antigas.length ? "ok" : "sem imagens" });
    continue;
  }

  relatorio.push({ slug: doc.slug, antigas: antigas.length, novas, nota: "em falta" });
  if (!fix) continue;

  // Cada imagem entra depois do parágrafo que a precede no artigo original.
  const body = structuredClone(doc.body);
  const bodyEn = doc.bodyEn ? structuredClone(doc.bodyEn) : null;
  const lista = body.root.children;
  const jaLa = new Set(
    await Promise.all(
      lista.filter((node) => node.type === "upload").map(async (node) => String(node.value?.id ?? node.value)),
    ),
  );

  const plano = [];
  for (const [index, item] of itens.entries()) {
    if (item.kind !== "image") continue;
    const anterior = itens.slice(0, index).reverse().find((candidato) => candidato.kind === "text");
    const alvo = anterior
      ? lista.findIndex((node) => {
          const texto = normaliza((node.children ?? []).map((filho) => filho.text ?? "").join(" "));
          return texto && (texto.startsWith(anterior.text.slice(0, 40)) || anterior.text.startsWith(texto.slice(0, 40)));
        })
      : -1;
    plano.push({ ...item, at: alvo === -1 ? lista.length : alvo + 1 });
  }

  let mexidas = 0;
  for (const item of [...plano].sort((a, b) => b.at - a.at)) {
    let id;
    try {
      id = await media(item.src, item.alt, doc.titlePt);
    } catch (error) {
      falhadas += 1;
      console.log(`  ! ${doc.slug}: ${error.message}`);
      continue;
    }
    if (jaLa.has(String(id))) continue;
    for (const arvore of [body, bodyEn]) {
      const filhos = arvore?.root?.children;
      if (!filhos) continue;
      // Um nó por corpo: cada nó do Lexical tem o seu id, e as duas versões do
      // artigo são documentos diferentes.
      const node = uploadNode(id);
      if (vazio(filhos[item.at])) filhos[item.at] = node;
      else if (vazio(filhos[item.at - 1])) filhos[item.at - 1] = node;
      else filhos.splice(item.at, 0, node);
    }
    mexidas += 1;
  }

  if (!mexidas) continue;
  await payload.update({ collection: "posts", id: doc.id, data: bodyEn ? { body, bodyEn } : { body } });
  inseridas += mexidas;
  tocados += 1;
  console.log(`✓ ${doc.slug}: +${mexidas}`);
}

const emFalta = relatorio.filter((linha) => linha.nota === "em falta");
const semFonte = relatorio.filter((linha) => String(linha.nota).startsWith("página antiga"));

console.log("");
console.log(`${relatorio.length} artigos verificados`);
console.log(`  com imagens e completos: ${relatorio.filter((l) => l.nota === "ok").length}`);
console.log(`  sem imagens no original: ${relatorio.filter((l) => l.nota === "sem imagens").length}`);
console.log(`  em falta: ${emFalta.length}`);
if (semFonte.length) console.log(`  sem página antiga: ${semFonte.length}`);
for (const linha of emFalta.slice(0, 40)) console.log(`    ${linha.slug}: ${linha.novas} de ${linha.antigas}`);
if (fix) console.log(`\n${inseridas} imagens repostas em ${tocados} artigos, ${falhadas} falhadas`);

if (inseridas) await purgeSite();
process.exit(0);
