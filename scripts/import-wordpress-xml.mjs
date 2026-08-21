#!/usr/bin/env node
/**
 * Importa exports WXR do WordPress para JSON versionado.
 *
 *   node scripts/import-wordpress-xml.mjs content-import/*.xml
 *
 * Reconhece `portfolio` (projetos) e `smartlogo` (logos de clientes). Os artigos
 * vêm pela API em scripts/migrate-wordpress.mjs, com melhor estrutura.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "node-html-parser";

const OUT = path.join(process.cwd(), "src", "content", "generated");
const files = process.argv.slice(2).filter((arg) => arg.endsWith(".xml"));
if (!files.length) {
  console.error("uso: node scripts/import-wordpress-xml.mjs content-import/*.xml");
  process.exit(1);
}

const cdata = (value = "") => value.replace(/^<!\[CDATA\[/, "").replace(/\]\]>$/, "").trim();
const tag = (item, name) => {
  const match = item.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return match ? cdata(match[1]) : "";
};
const metas = (item) =>
  new Map(
    [...item.matchAll(/<wp:meta_key>([\s\S]*?)<\/wp:meta_key>\s*<wp:meta_value>([\s\S]*?)<\/wp:meta_value>/g)].map((match) => [
      cdata(match[1]),
      cdata(match[2]),
    ]),
  );

/** Nomes de cliente vêm em caixa alta no export. Grafias conhecidas primeiro. */
const BRANDS = {
  WORWERK: "Vorwerk",
  VORWERK: "Vorwerk",
  AUDIT2MEASURE: "Audit2Measure",
  "SLIDE & SPLASH": "Slide & Splash",
  "M.F. PINTO": "M.F. Pinto",
  "MF PINTO": "M.F. Pinto",
  "INFORMA D&B": "Informa D&B",
  "MORE THAN BEAUTY": "More than Beauty",
  "TOP BRANDS ONLINE": "Top Brands Online",
  "CENTRAL DE CERVEJAS E BEBIDAS": "Central de Cervejas e Bebidas",
  "OBSERVATÓRIO DE ENFERMEIROS NOS AÇORES": "Observatório de Enfermeiros dos Açores",
  "ARNEIRO 1969": "Arneiro 1969",
  "LOUIS BOURGON": "Louis Bourgon",
  "AUCHAN JUMBO MODA": "Auchan · Jumbo Moda",
  "PLAY PLANET": "Playplanet",
  "FLY HORUS": "Fly Horus",
  "MY CHANGE": "MyChange",
  "TAKE 1": "Take1",
};

/** Partículas que ficam em minúscula no meio de um nome: Clínica da Farma&Cia. */
const PARTICLES = new Set(["da", "de", "do", "das", "dos", "e", "em", "na", "no", "com", "para"]);

/** Capitaliza a letra inicial e a que vem depois de &, . ou -: Farma&Cia, M.F. */
const capitalize = (word) => word.replace(/(^|[&.\-\/])(\p{Ll})/gu, (_, separator, letter) => separator + letter.toUpperCase());

function brandName(raw) {
  const value = raw.trim();
  if (BRANDS[value.toUpperCase()]) return BRANDS[value.toUpperCase()];
  if (value !== value.toUpperCase()) return value;
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && PARTICLES.has(word)) return word;
      // Palavras curtas são siglas (NUK, SPA); com & ou ponto não são.
      if (word.length <= 3 && !/[&.]/.test(word)) return word.toUpperCase();
      return capitalize(word);
    })
    .join(" ");
}

/**
 * O portfolio antigo tinha cada projeto duas vezes, em PT e em EN, com a mesma
 * ficha e os mesmos URLs — só a taxonomia das disciplinas mudava de língua.
 * Normaliza-se para português e fica um registo por projeto.
 */
const DISCIPLINES = {
  Development: "Desenvolvimento",
  Multimedia: "Multimédia",
  Audiovisuals: "Audiovisuais",
  Photography: "Fotografia",
  "Digital Marketing": "Marketing",
};

const normalizeDisciplines = (list) => [...new Set(list.map((item) => DISCIPLINES[item] ?? item))];

/** De duas fichas do mesmo projeto fica a mais completa. */
function dedupeBySlug(entries) {
  const score = (entry) => [entry.disciplines.length, entry.summary.length, entry.body.length];
  const bySlug = new Map();
  for (const entry of entries) {
    const current = bySlug.get(entry.slug);
    if (!current) {
      bySlug.set(entry.slug, entry);
      continue;
    }
    const [a, b] = [score(entry), score(current)];
    if (a.some((value, index) => value > b[index]) && a.every((value, index) => value >= b[index])) {
      bySlug.set(entry.slug, entry);
    }
  }
  return [...bySlug.values()];
}

const clean = (html) =>
  parse(html ?? "")
    .textContent.replace(/\[\/?[a-z0-9_]+[^\]]*\]/gi, " ")
    .replace(/&#8217;|&#039;/g, "’")
    .replace(/&#8220;|&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Blocos de texto do corpo do projeto, sem o ruído do construtor. */
function paragraphs(html, max = 6) {
  const root = parse(html ?? "");
  const out = [];
  for (const node of root.querySelectorAll("p, h2, h3, li")) {
    const text = clean(node.innerHTML);
    if (text.length > 60 && !out.includes(text)) out.push(text);
    if (out.length >= max) break;
  }
  if (!out.length) {
    const whole = clean(html);
    if (whole.length > 60) out.push(whole.slice(0, 600));
  }
  return out;
}

await mkdir(OUT, { recursive: true });

let projects = [];
const logoGalleries = [];
let ignoredPosts = 0;

for (const file of files) {
  const xml = await readFile(file, "utf8");
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];

  // Anexos primeiro: os projetos referem-nos por id.
  const attachments = new Map();
  for (const item of items) {
    if (tag(item, "wp:post_type") !== "attachment") continue;
    attachments.set(tag(item, "wp:post_id"), {
      src: tag(item, "wp:attachment_url"),
      alt: metas(item).get("_wp_attachment_image_alt") ?? "",
      title: clean(tag(item, "title")),
    });
  }

  for (const item of items) {
    const type = tag(item, "wp:post_type");
    const status = tag(item, "wp:status");

    if (type === "post") {
      ignoredPosts++;
      continue;
    }

    if (type === "portfolio" && status === "publish") {
      const meta = metas(item);
      const link = tag(item, "link");
      const content = item.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/)?.[1] ?? "";
      const excerpt = item.match(/<excerpt:encoded>([\s\S]*?)<\/excerpt:encoded>/)?.[1] ?? "";
      const disciplines = [...item.matchAll(/<category domain="project-type"[^>]*>([\s\S]*?)<\/category>/g)].map((match) =>
        clean(cdata(match[1])),
      );
      const cover = attachments.get(meta.get("_thumbnail_id") ?? "");
      const gallery = [...(content.match(/https:\/\/www\.jelly\.pt\/wp-content\/uploads\/[^\s"')]+\.(?:jpg|jpeg|png|webp)/gi) ?? [])];

      projects.push({
        slug: tag(item, "wp:post_name"),
        legacyPath: link ? new URL(link).pathname : null,
        client: brandName(clean(tag(item, "title"))),
        date: tag(item, "wp:post_date").slice(0, 10),
        year: tag(item, "wp:post_date").slice(0, 4),
        disciplines: normalizeDisciplines(disciplines),
        summary: clean(cdata(excerpt)) || paragraphs(cdata(content), 1)[0] || "",
        body: paragraphs(cdata(content)),
        cover: cover ?? null,
        images: [...new Set(gallery)].slice(0, 8),
      });
      continue;
    }

    if (type === "smartlogo" && status === "publish") {
      const serialized = metas(item).get("smls_option") ?? "";
      // Meta serializado do PHP: cada logo é um bloco com URL e título.
      const chunks = serialized.split(/s:20:"logo_[A-Za-z0-9]+"/).slice(1);
      const logos = [];
      for (const chunk of chunks) {
        const src = chunk.match(/s:14:"logo_image_url";s:\d+:"([^"]+)"/)?.[1];
        const title = chunk.match(/s:10:"logo_title";s:\d+:"([^"]*)"/)?.[1] ?? "";
        const link = chunk.match(/s:9:"logo_link";s:\d+:"([^"]*)"/)?.[1] ?? "";
        if (src) logos.push({ src: src.replace(/\\\//g, "/"), name: clean(title), link: link.replace(/\\\//g, "/") || null });
      }
      if (logos.length) logoGalleries.push({ gallery: clean(tag(item, "title")), slug: tag(item, "wp:post_name"), logos });
    }
  }
}

if (projects.length) {
  const unique = dedupeBySlug(projects);
  const collapsed = projects.length - unique.length;
  projects = unique;
  projects.sort((a, b) => b.date.localeCompare(a.date));
  if (collapsed) console.log(`${collapsed} fichas duplicadas (PT/EN) fundidas`);
  await writeFile(path.join(OUT, "projects.json"), JSON.stringify(projects, null, 1));
  const withCover = projects.filter((project) => project.cover).length;
  console.log(`${projects.length} projetos (${withCover} com capa, ${projects.filter((p) => p.body.length).length} com texto) → projects.json`);
}

if (logoGalleries.length) {
  await writeFile(path.join(OUT, "client-logos.json"), JSON.stringify(logoGalleries, null, 1));
  for (const gallery of logoGalleries) console.log(`galeria "${gallery.gallery}": ${gallery.logos.length} logos`);
  console.log(`→ client-logos.json`);
}

if (ignoredPosts) console.log(`${ignoredPosts} artigos ignorados (vêm pela API)`);
