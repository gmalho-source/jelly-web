#!/usr/bin/env node
/**
 * Carrega o conteúdo do repositório para o Sanity: os 179 artigos e os 64
 * projetos de arquivo migrados do WordPress, as galerias de logos, e o conteúdo
 * escrito à mão (casos, serviços, clientes, equipa, marcos, newsroom).
 *
 * Idempotente: cada documento tem _id derivado do slug e é escrito com
 * createOrReplace, e as imagens já enviadas ficam registadas em
 * content-import/sanity-assets.json para não subirem duas vezes.
 *
 *   SANITY_API_WRITE_TOKEN=... node scripts/sanity-seed.mjs --dry-run
 *   SANITY_API_WRITE_TOKEN=... node scripts/sanity-seed.mjs --only=posts
 *
 * Opções: --dry-run, --skip-images, --only=a,b, --limit=N
 */
import { execFileSync } from "node:child_process";
import { createClient } from "@sanity/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const dryRun = flag("dry-run");
const skipImages = flag("skip-images") || dryRun;
const only = (value("only") ?? "").split(",").map((part) => part.trim()).filter(Boolean);
const limit = Number(value("limit") ?? 0) || Infinity;
const wants = (name) => only.length === 0 || only.includes(name);

const projectId = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
const token = process.env.SANITY_API_WRITE_TOKEN;

// Só corre a partir da linha de comandos: os testes importam-no como módulo.
const invoked = process.argv[1] ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url) : false;

if (invoked && !dryRun && (!projectId || !token)) {
  console.error("Falta SANITY_PROJECT_ID e/ou SANITY_API_WRITE_TOKEN. Com --dry-run corre sem eles.");
  process.exit(1);
}

const client = projectId && token
  ? createClient({ projectId, dataset, apiVersion: "2026-08-01", token, useCdn: false })
  : null;

/** O jelly.pt responde melhor a um pedido que se parece com um browser. */
const BROWSER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));

/** O conteúdo escrito à mão vive em TypeScript: compila-se para JS e importa-se. */
/** O conteúdo e a lista de páginas vivem em TypeScript: compila-se para JS. */
function compileTypeScriptContent() {
  execFileSync("npx", ["tsc", "-p", "scripts/tsconfig.content.json"], { cwd: root, stdio: "inherit" });
}

async function loadWrittenContent() {
  compileTypeScriptContent();
  const at = (file) => `file://${path.join(root, ".cache/content/src/content", file)}`;
  const [site, projects, editorial] = await Promise.all([
    import(at("site.js")),
    import(at("projects.js")),
    import(at("editorial.js")),
  ]);
  return { ...site, ...projects, ...editorial };
}

const slugify = (input) =>
  String(input)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// ── imagens ────────────────────────────────────────────────────────────────
const assetCachePath = path.join(root, "content-import/sanity-assets.json");
const assetCache = fs.existsSync(assetCachePath) ? readJson("content-import/sanity-assets.json") : {};
let uploaded = 0;

function saveAssetCache() {
  fs.mkdirSync(path.dirname(assetCachePath), { recursive: true });
  fs.writeFileSync(assetCachePath, `${JSON.stringify(assetCache, null, 2)}\n`);
}

const skippedImages = [];

async function uploadImage(url, { alt, caption } = {}) {
  if (!url || skipImages || !client) return undefined;
  let assetId = assetCache[url];
  if (!assetId) {
    /**
     * O site antigo devolve páginas de erro com estado 200 quando lhe pedimos
     * muitas imagens de seguida — é a proteção a limitar o ritmo, não a imagem
     * a faltar. Confirma-se sempre o tipo antes de enviar (uma página HTML já
     * derrubou a migração a meio) e espera-se entre tentativas.
     */
    let buffer;
    let lastReason = "";
    for (const wait of [0, 2000, 6000, 15000]) {
      if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
      const response = await fetch(url, { headers: { "user-agent": BROWSER_AGENT, accept: "image/*,*/*" } });
      if (!response.ok) {
        lastReason = String(response.status);
        continue;
      }
      const contentType = response.headers.get("content-type") ?? "";
      const body = Buffer.from(await response.arrayBuffer());
      if (contentType.startsWith("image/") && body.byteLength >= 1024) {
        buffer = body;
        break;
      }
      lastReason = `${contentType || "sem tipo"} (${body.byteLength} bytes)`;
    }
    if (!buffer) {
      skippedImages.push(`${lastReason} ${url}`);
      return undefined;
    }
    try {
      const asset = await client.assets.upload("image", buffer, { filename: path.basename(new URL(url).pathname) });
      assetId = asset._id;
    } catch (error) {
      skippedImages.push(`recusada pelo Sanity: ${url} — ${error.message?.split("\n")[0] ?? error}`);
      return undefined;
    }
    assetCache[url] = assetId;
    uploaded += 1;
    if (uploaded % 10 === 0) saveAssetCache();
  }
  return {
    _type: "coverImage",
    asset: { _type: "reference", _ref: assetId },
    alt: alt || "",
    ...(caption ? { caption } : {}),
  };
}

// ── Portable Text ──────────────────────────────────────────────────────────
function span(text, key, marks = []) {
  return { _type: "span", _key: key, text, marks };
}

function paragraph(block, key) {
  if (!block.spans?.length) {
    return { _type: "block", _key: key, style: "normal", markDefs: [], children: [span(block.text, `${key}s0`)] };
  }
  const markDefs = [];
  const children = block.spans.map((item, index) => {
    const marks = [];
    if (item.bold) marks.push("strong");
    if (item.italic) marks.push("em");
    if (item.href) {
      const defKey = `${key}l${index}`;
      markDefs.push({ _type: "link", _key: defKey, href: item.href });
      marks.push(defKey);
    }
    return span(item.text, `${key}s${index}`, marks);
  });
  return { _type: "block", _key: key, style: "normal", markDefs, children };
}

async function toPortableText(blocks = []) {
  const out = [];
  for (const [index, block] of blocks.entries()) {
    const key = `b${index}`;
    if (block.type === "p") out.push(paragraph(block, key));
    else if (block.type === "h2" || block.type === "h3")
      out.push({ _type: "block", _key: key, style: block.type, markDefs: [], children: [span(block.text, `${key}s0`)] });
    else if (block.type === "quote")
      out.push({ _type: "block", _key: key, style: "blockquote", markDefs: [], children: [span(block.text, `${key}s0`)] });
    else if (block.type === "list")
      block.items.forEach((item, itemIndex) =>
        out.push({
          _type: "block",
          _key: `${key}i${itemIndex}`,
          style: "normal",
          level: 1,
          listItem: block.ordered ? "number" : "bullet",
          markDefs: [],
          children: [span(item, `${key}i${itemIndex}s0`)],
        }),
      );
    else if (block.type === "image") {
      const image = await uploadImage(block.src, { alt: block.alt, caption: block.caption });
      if (image) out.push({ ...image, _key: key });
    } else if (block.type === "gallery") {
      const images = [];
      for (const [imageIndex, item] of block.images.entries()) {
        const image = await uploadImage(item.src, { alt: item.alt });
        if (image) images.push({ ...image, _key: `${key}g${imageIndex}` });
      }
      if (images.length) out.push({ _type: "galleryBlock", _key: key, images });
    } else if (block.type === "video") {
      const poster = await uploadImage(block.poster);
      out.push({
        _type: "videoBlock",
        _key: key,
        ...(block.mp4 ? { mp4: block.mp4 } : {}),
        ...(block.webm ? { webm: block.webm } : {}),
        ...(poster ? { poster } : {}),
        portrait: Boolean(block.portrait),
      });
    } else if (block.type === "embed") {
      out.push({ _type: "embedBlock", _key: key, url: block.url });
    } else if (block.type === "link") {
      out.push({ _type: "linkBlock", _key: key, label: block.label, href: block.href });
    }
  }
  return out;
}

// ── documentos ─────────────────────────────────────────────────────────────
const docs = [];
const push = (doc) => docs.push(doc);
/**
 * Conteúdo migrado só existe em português. Deixa-se o EN vazio de propósito: o
 * site cai no PT e no Studio vê-se logo o que falta traduzir.
 */
const pt = (text) => ({ pt: text });

async function buildPosts() {
  const posts = readJson("src/content/generated/posts.json").slice(0, limit);

  // As categorias entram antes dos artigos: o Sanity valida as referências no
  // momento da escrita, e um artigo escrito antes da sua categoria faz falhar a
  // transação inteira.
  const categories = new Map(posts.map((post) => [post.categorySlug, post.category]));
  for (const [slug, title] of categories) {
    push({ _id: `category-${slug}`, _type: "category", title: pt(title), slug: { _type: "slug", current: slug } });
  }

  for (const post of posts) {
    const cover = await uploadImage(post.cover?.src, { alt: post.cover?.alt });
    push({
      _id: `post-${post.slug}`,
      _type: "post",
      slug: { _type: "slug", current: post.slug },
      title: pt(post.title),
      excerpt: pt(post.excerpt),
      date: post.date,
      lang: post.lang,
      author: post.author,
      readingMinutes: post.readingMinutes,
      legacyPath: post.legacyPath,
      category: { _type: "reference", _ref: `category-${post.categorySlug}` },
      ...(cover ? { cover } : {}),
      body: await toPortableText(post.body),
      draft: false,
    });
  }
  console.log(`  ${posts.length} artigos, ${categories.size} categorias`);
}

async function buildArchive() {
  const archive = readJson("src/content/generated/projects.json").slice(0, limit);
  for (const project of archive) {
    const cover = await uploadImage(project.cover?.src, { alt: project.cover?.alt || project.client });
    const images = [];
    for (const [index, src] of (project.images ?? []).entries()) {
      const image = await uploadImage(src, { alt: project.client });
      if (image) images.push({ ...image, _key: `i${index}` });
    }
    push({
      _id: `archived-${project.slug}`,
      _type: "archivedProject",
      slug: { _type: "slug", current: project.slug },
      client: project.client,
      date: project.date || undefined,
      year: project.year,
      disciplines: project.disciplines ?? [],
      ...(project.subtitle ? { subtitle: project.subtitle } : {}),
      summary: project.summary || undefined,
      story: await toPortableText(project.story ?? []),
      legacyPath: project.legacyPath ?? undefined,
      ...(cover ? { cover } : {}),
      ...(images.length ? { images } : {}),
    });
  }
  console.log(`  ${archive.length} projetos de arquivo`);
}

async function buildLogos() {
  const galleries = readJson("src/content/generated/client-logos.json");
  for (const gallery of galleries) {
    const logos = [];
    for (const [index, logo] of gallery.logos.entries()) {
      const image = await uploadImage(logo.src, { alt: logo.name });
      logos.push({
        _type: "logo",
        _key: `l${index}`,
        name: logo.name,
        ...(logo.link ? { link: logo.link } : {}),
        ...(image ? { image: { _type: "image", asset: image.asset } } : {}),
      });
    }
    push({
      _id: `gallery-${gallery.slug}`,
      _type: "logoGallery",
      gallery: gallery.gallery,
      slug: { _type: "slug", current: gallery.slug },
      logos,
    });
  }
  console.log(`  ${galleries.length} galerias de logos`);
}

/**
 * Páginas: os textos de `src/messages/pt.json` que o site desenha, chave a
 * chave. A lista de páginas vem de `sanity/schemas/page.ts` — a mesma que o
 * Studio mostra e que a fusão no site aceita, para não haver duas verdades. Fica de fora a navegação, o footer e a faturação (interface, não
 * conteúdo), a headline do herói (composta no JSX, porque a palavra riscada é
 * desenho) e as chaves que já não são usadas por nenhuma página.
 */
const SKIP_KEYS = new Set([
  // headline do herói: fica em código
  "home.headlineStrike",
  "home.headlineEm",
  "home.headlineRest",
  "home.headlineLead",
  "home.signature",
  // restos sem página que os desenhe
  "work.briefing",
  "services.ctaLead",
  "blog.featured",
  "newsroom.all",
  "contact.providers",
  "contact.providersBody",
]);

function flatten(node, prefix = "") {
  return Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );
}

async function buildPages() {
  const { PAGE_KEYS } = await import(`file://${path.join(root, ".cache/content/sanity/schemas/page.js")}`);
  const pt = readJson("src/messages/pt.json");
  const en = readJson("src/messages/en.json");

  for (const { slug, title } of PAGE_KEYS) {
    const entries = flatten(pt[slug] ?? {})
      .filter(([key]) => !SKIP_KEYS.has(`${slug}.${key}`))
      .map(([key, value], index) => {
        const englishValue = flatten(en[slug] ?? {}).find(([enKey]) => enKey === key)?.[1];
        return {
          _type: "entry",
          _key: `e${index}`,
          key,
          pt: value,
          ...(englishValue ? { en: englishValue } : {}),
        };
      });
    push({ _id: `page-${slug}`, _type: "page", title, slug: { _type: "slug", current: slug }, entries });
  }
  console.log(`  ${PAGE_KEYS.length} páginas, ${docs.filter((doc) => doc._type === "page").reduce((total, doc) => total + doc.entries.length, 0)} textos`);
}

function buildWritten(content) {
  if (wants("cases")) {
    for (const project of content.projects) {
      push({
        _id: `project-${project.slug}`,
        _type: "project",
        slug: { _type: "slug", current: project.slug },
        client: project.client,
        year: project.year,
        order: project.order,
        title: project.title,
        summary: project.summary,
        disciplines: project.disciplines,
        team: project.team,
        headline: { _type: "kpi", ...project.headline },
        kpis: (project.kpis ?? []).map((item, index) => ({ _type: "kpi", _key: `k${index}`, ...item })),
        ...(project.quote ? { quote: project.quote } : {}),
      });
    }
    console.log(`  ${content.projects.length} casos escritos`);
  }

  if (wants("services")) {
    content.services.forEach((service, index) => {
      push({
        _id: `service-${service.slug}`,
        _type: "service",
        slug: { _type: "slug", current: service.slug },
        order: index + 1,
        name: service.name,
        claim: service.claim,
        link: service.link,
        ...(service.promise ? { promise: service.promise } : {}),
        includes: (service.includes ?? []).map((item, itemIndex) => ({ _type: "localeString", _key: `i${itemIndex}`, ...item })),
        phases: (service.phases ?? []).map((phase, phaseIndex) => ({ _type: "phase", _key: `p${phaseIndex}`, ...phase })),
        cases: (service.caseSlugs ?? []).map((slug) => ({ _type: "reference", _key: `c-${slug}`, _ref: `project-${slug}` })),
        ...(service.accent ? { accent: service.accent } : {}),
      });
    });
    console.log(`  ${content.services.length} serviços`);
  }

  if (wants("clients")) {
    content.clients.forEach((item, index) => {
      push({ _id: `client-${slugify(item.name)}`, _type: "client", name: item.name, sector: item.sector, order: index + 1 });
    });
    console.log(`  ${content.clients.length} clientes`);
  }

  if (wants("team")) {
    content.team.forEach((member, index) => {
      push({ _id: `team-${slugify(member.name)}`, _type: "teamMember", name: member.name, order: index + 1, ...(member.role ? { role: member.role } : {}) });
    });
    console.log(`  ${content.team.length} pessoas`);
  }

  if (wants("milestones")) {
    for (const milestone of content.milestones) {
      push({ _id: `milestone-${milestone.year}`, _type: "milestone", year: milestone.year, body: { pt: milestone.pt, en: milestone.en } });
    }
    console.log(`  ${content.milestones.length} marcos`);
  }

  if (wants("news")) {
    for (const item of content.news) {
      push({
        _id: `news-${item.slug}`,
        _type: "newsItem",
        slug: { _type: "slug", current: item.slug },
        date: item.date,
        kind: item.kind,
        title: item.title,
        ...(item.summary ? { summary: item.summary } : {}),
        ...(item.outlet ? { outlet: item.outlet } : {}),
      });
    }
    console.log(`  ${content.news.length} entradas de newsroom`);
  }
}

async function main() {
  console.log(`Sanity: ${projectId ?? "(sem projeto)"} / ${dataset}${dryRun ? " — dry run" : ""}`);

  if (wants("pages")) {
    compileTypeScriptContent();
    await buildPages();
  }
  if (wants("posts")) await buildPosts();
  if (wants("archive")) await buildArchive();
  if (wants("logos")) await buildLogos();
  if (["cases", "services", "clients", "team", "milestones", "news"].some(wants)) {
    buildWritten(await loadWrittenContent());
  }

  if (!skipImages) saveAssetCache();
  console.log(`\n${docs.length} documentos, ${uploaded} imagens novas`);
  if (skippedImages.length) {
    console.log(`${skippedImages.length} imagens ignoradas:`);
    for (const line of skippedImages) console.log(`  ${line}`);
  }

  if (dryRun || !client) {
    const sample = docs[0];
    console.log("Exemplo:\n", JSON.stringify(sample, null, 2).slice(0, 900));
    return;
  }

  // Lotes pequenos: a API de mutações trava com transações muito grandes.
  const batchSize = 40;
  for (let index = 0; index < docs.length; index += batchSize) {
    const batch = docs.slice(index, index + batchSize);
    const transaction = batch.reduce((tx, doc) => tx.createOrReplace(doc), client.transaction());
    await transaction.commit({ visibility: "async" });
    console.log(`  escritos ${Math.min(index + batchSize, docs.length)}/${docs.length}`);
  }
  console.log("Feito.");
}

export { toPortableText };

if (invoked) main().catch((error) => {
  if (!skipImages) saveAssetCache();
  console.error(error);
  process.exit(1);
});

