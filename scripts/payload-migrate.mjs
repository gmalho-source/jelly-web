#!/usr/bin/env node
/**
 * Migra o conteúdo para o Payload: as páginas, os artigos, os projetos com a
 * narrativa, os serviços, os clientes, a equipa, os marcos e a newsroom.
 *
 * As imagens entram como ficheiros do Payload, buscadas onde estiverem — no CDN
 * do Sanity, se já lá passaram, senão no jelly.pt. É o que corta o último fio
 * ao site antigo.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/payload-migrate.mjs --dry-run
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/payload-migrate.mjs --only=pages
 *
 * Idempotente: procura por slug antes de criar, e as imagens já carregadas
 * ficam registadas em content-import/payload-media.<base>.json.
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPayload } from "payload";
import config from "../payload.config.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const dryRun = flag("dry-run");
const skipImages = flag("skip-images");
const only = (value("only") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
const limit = Number(value("limit") ?? 0) || Infinity;
const wants = (name) => only.length === 0 || only.includes(name);

const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const BROWSER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

// ── imagens ────────────────────────────────────────────────────────────────
/**
 * O registo de imagens guarda ids da base de dados, que são de cada base: um
 * ficheiro por ligação, senão a corrida contra a Neon reaproveitava os ids do
 * Postgres local e apontava o conteúdo para media que não existe lá.
 */
const dbKey = createHash("sha1").update(process.env.DATABASE_URL ?? "sem-base").digest("hex").slice(0, 8);
const cachePath = path.join(root, `content-import/payload-media.${dbKey}.json`);
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};
const skipped = [];
let uploaded = 0;

/** endereço de origem → nome do ficheiro em media/, de uma corrida anterior. */
const indexPath = path.join(root, "content-import/payload-files.json");
const fileIndex = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, "utf8")) : {};
const saveIndex = () => fs.writeFileSync(indexPath, `${JSON.stringify(fileIndex, null, 2)}\n`);

const saveCache = () => {
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`);
};

/** O Sanity serve as imagens já migradas; o resto vem do site antigo. */
const sanityMap = fs.existsSync(path.join(root, "content-import/sanity-assets.json"))
  ? JSON.parse(fs.readFileSync(path.join(root, "content-import/sanity-assets.json"), "utf8"))
  : {};
const sanityProject = process.env.SANITY_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "ov3ljxah";

function preferredSource(url) {
  const assetId = sanityMap[url];
  if (!assetId) return url;
  // image-<id>-<w>x<h>-<ext> → endereço do CDN, que responde sem limites.
  const match = /^image-([0-9a-f]+)-(\d+x\d+)-(\w+)$/.exec(assetId);
  return match ? `https://cdn.sanity.io/images/${sanityProject}/production/${match[1]}-${match[2]}.${match[3]}` : url;
}

async function upload(payload, url, alt) {
  if (!url || skipImages || dryRun) return undefined;
  if (cache[url]) return cache[url];

  const source = preferredSource(url);
  const name = decodeURIComponent(path.basename(new URL(source).pathname)) || "imagem.jpg";

  let buffer;
  let reason = "";
  // Uma corrida anterior deixou os ficheiros em media/, e o índice diz qual é o
  // de cada endereço — dois endereços diferentes podem dar o mesmo nome, e o
  // Payload guarda o segundo como "-1". Ler do disco poupa a rede e deixa a
  // migração de pé mesmo que o jelly.pt ou o CDN antigo caiam.
  const stored = fileIndex[url];
  if (stored) {
    const onDisk = path.join(root, "media", stored);
    if (fs.existsSync(onDisk)) {
      const body = fs.readFileSync(onDisk);
      if (body.byteLength >= 1024) buffer = body;
    }
  }
  for (const wait of buffer ? [] : [0, 2000, 6000]) {
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    const response = await fetch(source, { headers: { "user-agent": BROWSER_AGENT, accept: "image/*,*/*" } });
    if (!response.ok) {
      reason = String(response.status);
      continue;
    }
    const type = response.headers.get("content-type") ?? "";
    const body = Buffer.from(await response.arrayBuffer());
    // O site antigo devolve páginas de erro com estado 200: confirma-se o tipo.
    if (type.startsWith("image/") && body.byteLength >= 1024) {
      buffer = body;
      break;
    }
    reason = `${type || "sem tipo"} (${body.byteLength} bytes)`;
  }
  if (!buffer) {
    skipped.push(`${reason} ${url}`);
    return undefined;
  }

  const created = await payload.create({
    collection: "media",
    data: { alt: alt || name.replace(/[-_]/g, " ").replace(/\.\w+$/, ""), legacyUrl: url },
    file: { name, data: buffer, mimetype: `image/${path.extname(name).slice(1) || "jpeg"}`, size: buffer.byteLength },
  });
  cache[url] = created.id;
  // O índice guarda o nome do ficheiro tal como ficou em media/ na primeira
  // corrida: é esse que se lê do disco. Corridas seguintes não o reescrevem,
  // senão o nome passava a ser o do armazenamento remoto e perdia-se a cópia
  // local.
  if (created.filename && !fileIndex[url]) fileIndex[url] = created.filename;
  uploaded += 1;
  if (uploaded % 10 === 0) {
    saveCache();
    saveIndex();
  }
  return created.id;
}

// ── ajudantes ──────────────────────────────────────────────────────────────
const counts = {};
const note = (collection, n) => {
  counts[collection] = (counts[collection] ?? 0) + n;
};

/** Cria ou atualiza por slug: correr duas vezes não duplica nada. */
async function upsert(payload, collection, where, data) {
  if (dryRun) return { id: "dry-run" };
  const existing = await payload.find({ collection, where, limit: 1, depth: 0 });
  if (existing.docs.length) {
    return payload.update({ collection, id: existing.docs[0].id, data });
  }
  return payload.create({ collection, data });
}

const localized = (pt, en) => ({ pt: pt ?? "", en: en ?? "" });

/** Texto simples → Lexical, que é o formato do editor. */
function lexical(paragraphs) {
  const children = paragraphs.map((block) => {
    if (block.type === "h2" || block.type === "h3") {
      return {
        type: "heading",
        tag: block.type,
        version: 1,
        children: [{ type: "text", text: block.text, version: 1, format: 0, detail: 0, mode: "normal", style: "" }],
      };
    }
    if (block.type === "list") {
      return {
        type: "list",
        listType: block.ordered ? "number" : "bullet",
        tag: block.ordered ? "ol" : "ul",
        version: 1,
        children: block.items.map((item, index) => ({
          type: "listitem",
          value: index + 1,
          version: 1,
          children: [{ type: "text", text: item, version: 1, format: 0, detail: 0, mode: "normal", style: "" }],
        })),
      };
    }
    if (block.type === "quote") {
      return {
        type: "quote",
        version: 1,
        children: [{ type: "text", text: block.text, version: 1, format: 0, detail: 0, mode: "normal", style: "" }],
      };
    }
    return {
      type: "paragraph",
      version: 1,
      children: [{ type: "text", text: block.text ?? "", version: 1, format: 0, detail: 0, mode: "normal", style: "" }],
    };
  });
  return { root: { type: "root", version: 1, format: "", indent: 0, direction: "ltr", children } };
}

/** Blocos da narrativa de um caso, no formato do Payload. */
async function storyBlocks(payload, story) {
  const blocks = [];
  let pending = null;

  const flush = () => {
    if (pending && (pending.heading || pending.body)) blocks.push({ blockType: "text", ...pending });
    pending = null;
  };

  for (const block of story ?? []) {
    if (block.type === "h2" || block.type === "h3") {
      flush();
      pending = { heading: block.text, level: block.type, body: "" };
      continue;
    }
    if (block.type === "p") {
      if (!pending) pending = { heading: "", level: "h2", body: "" };
      pending.body = pending.body ? `${pending.body}\n\n${block.text}` : block.text;
      continue;
    }
    flush();
    if (block.type === "image") {
      const image = await upload(payload, block.src, block.alt);
      if (image) blocks.push({ blockType: "image", image });
    } else if (block.type === "gallery") {
      const images = [];
      for (const item of block.images) {
        const image = await upload(payload, item.src, item.alt);
        if (image) images.push(image);
      }
      if (images.length) blocks.push({ blockType: "gallery", images });
    } else if (block.type === "video") {
      blocks.push({
        blockType: "video",
        mp4: block.mp4 ?? "",
        webm: block.webm ?? "",
        poster: block.poster ? await upload(payload, block.poster) : undefined,
        portrait: Boolean(block.portrait),
      });
    } else if (block.type === "embed") {
      blocks.push({ blockType: "embed", url: block.url });
    } else if (block.type === "link") {
      blocks.push({ blockType: "link", label: block.label, href: block.href });
    }
  }
  flush();
  return blocks;
}

/** O conteúdo escrito à mão vive em TypeScript: compila-se e importa-se. */
async function writtenContent() {
  execFileSync("npx", ["tsc", "-p", "scripts/tsconfig.content.json"], { cwd: root, stdio: "inherit" });
  const at = (file) => `file://${path.join(root, ".cache/content/src/content", file)}`;
  const [site, projects, editorial] = await Promise.all([
    import(at("site.js")),
    import(at("projects.js")),
    import(at("editorial.js")),
  ]);
  return { ...site, ...projects, ...editorial };
}

// ── migração ───────────────────────────────────────────────────────────────
const PAGE_LABELS = {
  home: "Homepage",
  about: "Sobre",
  services: "Serviços",
  work: "Projetos",
  clients: "Clientes",
  blog: "Blog",
  newsroom: "Newsroom",
  contact: "Contactos",
};
const SKIP_KEYS = new Set([
  "home.headlineStrike", "home.headlineEm", "home.headlineRest", "home.headlineLead", "home.signature",
  "work.briefing", "services.ctaLead", "blog.featured", "newsroom.all", "contact.providers", "contact.providersBody",
]);

const flatten = (node, prefix = "") =>
  Object.entries(node).flatMap(([key, value]) =>
    value && typeof value === "object" ? flatten(value, `${prefix}${key}.`) : [[`${prefix}${key}`, value]],
  );

async function migratePages(payload) {
  const pt = readJson("src/messages/pt.json");
  const en = readJson("src/messages/en.json");
  for (const [key, title] of Object.entries(PAGE_LABELS)) {
    const english = new Map(flatten(en[key] ?? {}));
    const entries = flatten(pt[key] ?? {})
      .filter(([entry]) => !SKIP_KEYS.has(`${key}.${entry}`))
      .map(([entry, text]) => ({ key: entry, pt: text, en: english.get(entry) ?? "" }));
    await upsert(payload, "pages", { key: { equals: key } }, { key, title, entries });
    note("pages", 1);
  }
}

async function migratePosts(payload) {
  const posts = readJson("src/content/generated/posts.json").slice(0, limit);
  const categories = new Map();
  for (const post of posts) {
    if (!categories.has(post.categorySlug)) {
      const doc = await upsert(
        payload,
        "categories",
        { slug: { equals: post.categorySlug } },
        { slug: post.categorySlug, titlePt: post.category },
      );
      categories.set(post.categorySlug, doc.id);
      note("categories", 1);
    }
    await upsert(
      payload,
      "posts",
      { slug: { equals: post.slug } },
      {
        slug: post.slug,
        titlePt: post.title,
        date: post.date,
        author: post.author,
        readingMinutes: post.readingMinutes,
        lang: post.lang,
        legacyPath: post.legacyPath,
        category: categories.get(post.categorySlug),
        excerpt: localized(post.excerpt, ""),
        cover: await upload(payload, post.cover?.src, post.cover?.alt),
        body: lexical(post.body ?? []),
        _status: "published",
      },
    );
    note("posts", 1);
  }
}

async function migrateProjects(payload, written) {
  const archive = readJson("src/content/generated/projects.json").slice(0, limit);
  const curated = new Map((written?.projects ?? []).map((project) => [project.slug, project]));

  for (const project of archive) {
    const hand = curated.get(project.slug);
    await upsert(
      payload,
      "projects",
      { slug: { equals: project.slug } },
      {
        slug: project.slug,
        client: project.client,
        year: project.year,
        date: project.date || undefined,
        order: hand?.order ?? 100,
        written: Boolean(hand),
        subtitle: project.subtitle || "",
        disciplines: project.disciplines ?? [],
        title: hand ? hand.title : localized(project.client, project.client),
        summary: hand ? hand.summary : localized(project.summary, ""),
        team: hand ? hand.team : localized("", ""),
        legacyPath: project.legacyPath ?? undefined,
        cover: await upload(payload, project.cover?.src, project.cover?.alt || project.client),
        story: await storyBlocks(payload, project.story),
        numbersValidated: false,
        headline: hand ? { value: hand.headline.value, label: hand.headline.label } : undefined,
        kpis: hand ? hand.kpis.map((kpi) => ({ value: kpi.value, label: kpi.label })) : [],
        quote: hand?.quote ? { text: hand.quote.text, author: hand.quote.author, role: hand.quote.role } : undefined,
        _status: "published",
      },
    );
    note("projects", 1);
  }
}

async function migrateHouse(payload, written) {
  for (const [index, service] of (written.services ?? []).entries()) {
    await upsert(
      payload,
      "services",
      { slug: { equals: service.slug } },
      {
        slug: service.slug,
        namePt: service.name.pt,
        nameEn: service.name.en,
        order: index + 1,
        claim: service.claim,
        link: service.link,
        promise: service.promise,
        includes: (service.includes ?? []).map((item) => ({ item })),
        phases: (service.phases ?? []).map((phase) => ({ name: phase.name, body: phase.body })),
        accent: service.accent,
      },
    );
    note("services", 1);
  }

  for (const [index, client] of (written.clients ?? []).entries()) {
    await upsert(
      payload,
      "clients",
      { name: { equals: client.name } },
      { name: client.name, sector: client.sector, order: index + 1 },
    );
    note("clients", 1);
  }

  // A parede de logos vem do Smart Logo do site antigo, sem nomes: fica como
  // coleção própria, e quem quiser ligá-la aos clientes fá-lo no painel.
  for (const gallery of readJson("src/content/generated/client-logos.json")) {
    for (const [index, logo] of gallery.logos.entries()) {
      const image = await upload(payload, logo.src, logo.name || gallery.gallery);
      if (!image) continue;
      await upsert(
        payload,
        "logos",
        { image: { equals: image } },
        { name: logo.name || "", gallery: gallery.gallery, image, link: logo.link ?? undefined, order: index + 1 },
      );
      note("logos", 1);
    }
  }

  for (const [index, member] of (written.team ?? []).entries()) {
    await upsert(payload, "team", { name: { equals: member.name } }, { name: member.name, order: index + 1, role: member.role });
    note("team", 1);
  }

  for (const milestone of written.milestones ?? []) {
    await upsert(
      payload,
      "milestones",
      { year: { equals: milestone.year } },
      { year: milestone.year, body: localized(milestone.pt, milestone.en) },
    );
    note("milestones", 1);
  }

  for (const item of written.news ?? []) {
    await upsert(
      payload,
      "news",
      { slug: { equals: item.slug } },
      {
        slug: item.slug,
        titlePt: item.title.pt,
        titleEn: item.title.en,
        date: item.date,
        kind: item.kind,
        outlet: item.outlet,
        summary: item.summary ?? localized("", ""),
      },
    );
    note("news", 1);
  }
}

async function main() {
  const payload = dryRun ? null : await getPayload({ config });
  console.log(dryRun ? "Ensaio: nada é escrito." : `Payload ligado a ${process.env.DATABASE_URL?.replace(/:[^:@]+@/, ":***@")}`);

  const needsWritten = ["projects", "house"].some(wants);
  const written = needsWritten ? await writtenContent() : {};

  if (wants("pages")) await migratePages(payload);
  if (wants("posts")) await migratePosts(payload);
  if (wants("projects")) await migrateProjects(payload, written);
  if (wants("house")) await migrateHouse(payload, written);

  if (!skipImages) {
    saveCache();
    saveIndex();
  }
  console.log("\n" + Object.entries(counts).map(([k, v]) => `${v} ${k}`).join(", "));
  console.log(`${uploaded} imagens novas`);
  if (skipped.length) {
    console.log(`${skipped.length} imagens ignoradas:`);
    for (const line of skipped.slice(0, 12)) console.log(`  ${line}`);
  }
  process.exit(0);
}

main().catch((error) => {
  if (!skipImages) {
    saveCache();
    saveIndex();
  }
  console.error(error);
  process.exit(1);
});
