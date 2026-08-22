#!/usr/bin/env node
/**
 * Dá um título legível a cada imagem, para o painel deixar de mostrar nomes
 * como 256513_441780705844923_804263503_o-150x150.webp.
 *
 * Vai buscá-lo ao WordPress quando existe; senão limpa o nome do ficheiro; e em
 * último recurso usa o texto alternativo. Só toca nas que ainda não têm título.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run media:titles -- --dry-run
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run media:titles
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0 Safari/537.36";
const seco = process.argv.includes("--dry-run");

const payload = await getPayload({ config });
const { docs } = await payload.find({ collection: "media", limit: 0, depth: 0 });

/** Título a partir do nome do ficheiro: o último recurso, mas legível. */
function doNome(filename = "") {
  const base = filename
    .replace(/\.\w+$/, "")
    .replace(/-corte$/, "")
    .replace(/-\d+x\d+(-\d+)?$/, "")
    .replace(/^[0-9a-f]{30,}-?/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!base || /^\d[\d\s]*$/.test(base)) return "";
  return base.charAt(0).toUpperCase() + base.slice(1);
}

const cache = new Map();

/** Título que o WordPress deu à imagem, procurado pelo nome do ficheiro. */
async function doWordPress(legacyUrl) {
  if (!legacyUrl) return "";
  const nome = decodeURIComponent(legacyUrl.split("/").pop() ?? "").replace(/\.\w+$/, "").replace(/-\d+x\d+$/, "");
  if (!nome) return "";
  if (cache.has(nome)) return cache.get(nome);
  try {
    const r = await fetch(`https://www.jelly.pt/wp-json/wp/v2/media?search=${encodeURIComponent(nome)}&per_page=1&_fields=title,slug`, {
      headers: { "user-agent": UA },
    });
    const j = r.ok ? await r.json() : [];
    const titulo = (j?.[0]?.title?.rendered ?? "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    const bom = titulo && !/^\d[\d_\-]*$/.test(titulo) ? titulo : "";
    cache.set(nome, bom);
    return bom;
  } catch {
    return "";
  }
}

let doWp = 0;
let doFicheiro = 0;
let semTitulo = 0;

for (const doc of docs) {
  if (doc.title?.trim()) continue;
  let titulo = await doWordPress(doc.legacyUrl);
  if (titulo) doWp += 1;
  if (!titulo) {
    titulo = doNome(doc.filename);
    if (titulo) doFicheiro += 1;
  }
  if (!titulo) {
    titulo = doc.alt?.slice(0, 60) ?? "";
    if (!titulo) {
      semTitulo += 1;
      continue;
    }
  }
  if (!seco) await payload.update({ collection: "media", id: doc.id, data: { title: titulo } });
}

console.log(`${docs.length} imagens | ${doWp} títulos do WordPress | ${doFicheiro} do nome do ficheiro | ${semTitulo} sem título${seco ? " (ensaio)" : ""}`);
process.exit(0);
