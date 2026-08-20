#!/usr/bin/env node
/**
 * Auditoria do site atual. Percorre o sitemap (ou uma lista de URLs), abre cada
 * página no Chromium e recolhe o que interessa para a migração: estado HTTP,
 * cadeia de redirects, títulos e descrições, hierarquia de headings, hreflang,
 * canónicos, pistas de CMS, peso da página e tempos de carregamento.
 *
 * Uso:
 *   node scripts/audit-site.mjs https://www.jelly.pt [--max 60] [--shots]
 *
 * Escreve docs/auditoria/relatorio.json e docs/auditoria/relatorio.md
 * (e screenshots em docs/auditoria/shots/ com --shots).
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith("http")) ?? "https://www.jelly.pt";
const max = Number(args[args.indexOf("--max") + 1]) || 40;
const withShots = args.includes("--shots");

const outDir = path.join(process.cwd(), "docs", "auditoria");
const origin = new URL(base).origin;

async function sitemapUrls(page) {
  const candidates = ["/sitemap_index.xml", "/sitemap.xml", "/wp-sitemap.xml"];
  const found = new Set();

  for (const candidate of candidates) {
    const response = await page
      .goto(origin + candidate, { waitUntil: "domcontentloaded", timeout: 15000 })
      .catch(() => null);
    if (!response || !response.ok()) continue;

    const xml = await page.content();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
    const nested = locs.filter((loc) => loc.endsWith(".xml"));

    for (const url of locs.filter((loc) => !loc.endsWith(".xml"))) found.add(url);

    for (const child of nested.slice(0, 12)) {
      const childResponse = await page
        .goto(child, { waitUntil: "domcontentloaded", timeout: 15000 })
        .catch(() => null);
      if (!childResponse?.ok()) continue;
      const childXml = await page.content();
      for (const m of childXml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const loc = m[1].trim();
        if (!loc.endsWith(".xml")) found.add(loc);
      }
    }
    if (found.size) break;
  }

  return [...found];
}

async function inspect(page, url) {
  const started = Date.now();
  const response = await page
    .goto(url, { waitUntil: "domcontentloaded", timeout: 30000 })
    .catch((error) => ({ error }));
  if (!response || "error" in response) {
    return { url, ok: false, error: String(response?.error ?? "sem resposta").split("\n")[0] };
  }

  // Não ficamos presos a recursos externos lentos ou bloqueados.
  await page.waitForLoadState("load", { timeout: 8000 }).catch(() => {});

  const chain = [];
  for (let hop = response.request().redirectedFrom(); hop; hop = hop.redirectedFrom()) chain.unshift(hop.url());

  const data = await page.evaluate(() => {
    const attr = (selector, name) => document.querySelector(selector)?.getAttribute(name) ?? null;
    const generator = attr('meta[name="generator"]', "content");
    const scripts = [...document.querySelectorAll("script[src], link[href]")].map(
      (node) => node.getAttribute("src") ?? node.getAttribute("href") ?? "",
    );

    return {
      title: document.title,
      description: attr('meta[name="description"]', "content"),
      canonical: attr('link[rel="canonical"]', "href"),
      robots: attr('meta[name="robots"]', "content"),
      lang: document.documentElement.lang || null,
      generator,
      hreflang: [...document.querySelectorAll('link[rel="alternate"][hreflang]')].map((node) => ({
        lang: node.getAttribute("hreflang"),
        href: node.getAttribute("href"),
      })),
      headings: [...document.querySelectorAll("h1, h2, h3")]
        .slice(0, 40)
        .map((node) => ({ level: node.tagName, text: node.textContent?.trim().slice(0, 120) ?? "" })),
      images: document.querySelectorAll("img").length,
      imagesWithoutAlt: [...document.querySelectorAll("img")].filter((img) => !img.getAttribute("alt")).length,
      words: (document.body.innerText.match(/\S+/g) ?? []).length,
      cms: {
        wordpress: scripts.some((src) => src.includes("/wp-content/") || src.includes("/wp-includes/")),
        elementor: scripts.some((src) => src.includes("elementor")),
        gtm: scripts.some((src) => src.includes("googletagmanager")),
        hubspot: scripts.some((src) => src.includes("hs-scripts") || src.includes("hubspot")),
      },
      assets: scripts.length,
    };
  });

  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByName("first-contentful-paint")[0];
    const transferred = performance
      .getEntriesByType("resource")
      .reduce((total, entry) => total + (entry.transferSize || 0), 0);
    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      loadComplete: nav ? Math.round(nav.loadEventEnd) : null,
      firstContentfulPaint: paint ? Math.round(paint.startTime) : null,
      transferredKb: Math.round(transferred / 1024),
    };
  });

  if (withShots) {
    const name = (new URL(url).pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "home") + ".png";
    await page.screenshot({ path: path.join(outDir, "shots", name), fullPage: true }).catch(() => {});
  }

  return {
    url,
    ok: response.ok(),
    status: response.status(),
    redirectChain: chain,
    elapsedMs: Date.now() - started,
    ...data,
    timing,
  };
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

await mkdir(outDir, { recursive: true });
if (withShots) await mkdir(path.join(outDir, "shots"), { recursive: true });

let urls = await sitemapUrls(page);
if (!urls.length) {
  console.warn("Sem sitemap legível — a recolher ligações da homepage.");
  await page.goto(base, { waitUntil: "domcontentloaded", timeout: 30000 }).catch(() => {});
  urls = await page.evaluate((origin) => {
    const hrefs = [...document.querySelectorAll("a[href]")].map((a) => a.href);
    return [...new Set(hrefs.filter((href) => href.startsWith(origin)))];
  }, origin);
  urls.unshift(base);
}

const selected = [...new Set(urls)].slice(0, max);
console.log(`${selected.length} URLs a auditar (de ${urls.length} encontrados).`);

const pages = [];
for (const [index, url] of selected.entries()) {
  const result = await inspect(page, url);
  pages.push(result);
  console.log(`${String(index + 1).padStart(3)}/${selected.length}  ${result.status ?? "erro"}  ${url}`);
}

await browser.close();

const report = { base, generatedAt: new Date().toISOString(), totalFound: urls.length, audited: pages.length, pages };
await writeFile(path.join(outDir, "relatorio.json"), JSON.stringify(report, null, 2));

const broken = pages.filter((p) => !p.ok);
const noDescription = pages.filter((p) => p.ok && !p.description);
const multipleH1 = pages.filter((p) => (p.headings ?? []).filter((h) => h.level === "H1").length > 1);
const heavy = [...pages].filter((p) => p.timing?.transferredKb).sort((a, b) => b.timing.transferredKb - a.timing.transferredKb);

const md = [
  `# Auditoria de ${base}`,
  ``,
  `Gerada em ${report.generatedAt} · ${pages.length} páginas auditadas de ${urls.length} encontradas.`,
  ``,
  `## Resumo`,
  ``,
  `| Indicador | Valor |`,
  `|---|---|`,
  `| Páginas com erro ou redirect final | ${broken.length} |`,
  `| Páginas sem meta description | ${noDescription.length} |`,
  `| Páginas com mais de um H1 | ${multipleH1.length} |`,
  `| Páginas com sinais de WordPress | ${pages.filter((p) => p.cms?.wordpress).length} |`,
  `| Peso mediano transferido | ${heavy.length ? heavy[Math.floor(heavy.length / 2)].timing.transferredKb + " KB" : "—"} |`,
  ``,
  `## Páginas mais pesadas`,
  ``,
  `| URL | KB | FCP (ms) | Load (ms) |`,
  `|---|---|---|---|`,
  ...heavy.slice(0, 12).map((p) => `| ${p.url} | ${p.timing.transferredKb} | ${p.timing.firstContentfulPaint ?? "—"} | ${p.timing.loadComplete ?? "—"} |`),
  ``,
  `## Inventário`,
  ``,
  `| URL | Estado | Título | H1 | Palavras |`,
  `|---|---|---|---|---|`,
  ...pages.map((p) => {
    const h1 = (p.headings ?? []).find((h) => h.level === "H1")?.text ?? "—";
    return `| ${p.url} | ${p.status ?? "erro"} | ${(p.title ?? "—").slice(0, 60)} | ${h1.slice(0, 60)} | ${p.words ?? "—"} |`;
  }),
  ``,
].join("\n");

await writeFile(path.join(outDir, "relatorio.md"), md);
console.log(`\nRelatório em docs/auditoria/relatorio.md e relatorio.json`);
