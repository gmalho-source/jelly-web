#!/usr/bin/env node
/**
 * Gera docs/preview/index.html: um instantâneo estático e navegável do site,
 * com CSS, fontes e media embutidos, para partilhar sem correr o projeto.
 *
 *   npm run build && npm start &        # servidor em http://localhost:3000
 *   node scripts/build-preview.mjs      # ou PREVIEW_BASE=http://localhost:3210 node ...
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const BASE = process.env.PREVIEW_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs", "preview");

const pages = [
  { key: "home", path: "/", label: "Homepage" },
  { key: "sobre", path: "/sobre", label: "Sobre" },
  { key: "servicos", path: "/servicos", label: "Serviços" },
  { key: "servico", path: "/servicos/inteligencia-artificial", label: "Serviço · IA" },
  { key: "projetos", path: "/projetos", label: "Projetos" },
  { key: "caso", path: "/projetos/agriloja", label: "Caso" },
  { key: "clientes", path: "/clientes", label: "Clientes" },
  { key: "blog", path: "/blog", label: "Blog" },
  { key: "artigo", path: "/blog/ia-no-marketing-digital", label: "Artigo" },
  { key: "newsroom", path: "/newsroom", label: "Newsroom" },
  { key: "contactos", path: "/contactos", label: "Contactos" },
  { key: "en", path: "/en", label: "Homepage EN" },
  { key: "billing", path: "/billing", label: "billing.jelly.pt" },
];

/**
 * Estados interativos capturados com o browser: o instantâneo não corre o JS do
 * Next, por isso o índice em ecrã inteiro e a paleta de comandos entram como
 * páginas próprias, já abertas.
 */
const captures = [
  {
    key: "indice",
    label: "Tudo (ecrã inteiro)",
    path: "/",
    async act(page) {
      const buttons = await page.$$("nav[aria-label] button");
      await buttons[2].click();
      await page.waitForTimeout(500);
      const links = await page.$$("[role=dialog] a");
      if (links[2]) await links[2].hover();
      await page.waitForTimeout(300);
    },
  },
  {
    key: "servicos-panel",
    label: "Submenu Serviços",
    path: "/",
    async act(page) {
      const buttons = await page.$$("nav[aria-label] button");
      await buttons[0].click();
      await page.waitForTimeout(500);
      const links = await page.$$("[role=dialog] a");
      if (links[2]) await links[2].hover();
      await page.waitForTimeout(300);
    },
  },
  {
    key: "projetos-panel",
    label: "Submenu Projetos",
    path: "/",
    async act(page) {
      const buttons = await page.$$("nav[aria-label] button");
      await buttons[1].click();
      await page.waitForTimeout(500);
      const links = await page.$$("[role=dialog] a");
      if (links[1]) await links[1].hover();
      await page.waitForTimeout(300);
    },
  },
  {
    key: "procura",
    label: "Procura ⌘K",
    path: "/",
    async act(page) {
      await page.keyboard.press("Control+k");
      await page.waitForTimeout(400);
      await page.keyboard.type("marketing");
      await page.waitForTimeout(400);
    },
  },
];

const routes = {
  "/": "#home",
  "/sobre": "#sobre",
  "/servicos": "#servicos",
  "/servicos/inteligencia-artificial": "#servico",
  "/projetos": "#projetos",
  "/projetos/agriloja": "#caso",
  "/clientes": "#clientes",
  "/blog": "#blog",
  "/blog/ia-no-marketing-digital": "#artigo",
  "/newsroom": "#newsroom",
  "/contactos": "#contactos",
  "/en": "#en",
  "/billing": "#billing",
};

/**
 * Candidatas a substituir a Poppins nos títulos e na interface.
 *
 * - `google` e `fontshare`: licença aberta (OFL / Fontshare), self-hostáveis e
 *   embutíveis neste instantâneo.
 * - `local`: fontes comerciais que só entram se os ficheiros de teste estiverem
 *   em public/fonts/trials/ (ver LEIA-ME.md). Não vão para o repositório nem são
 *   publicadas — a licença de teste não o permite.
 */
const FONTS = [
  { key: "poppins", label: "Poppins (atual)", family: "Poppins", source: "google", spec: "Poppins:wght@400;600" },
  { key: "general", label: "General Sans ≈ PP Neue Montreal", family: "General Sans", source: "fontshare", spec: "general-sans@400,600" },
  { key: "switzer", label: "Switzer ≈ Söhne", family: "Switzer", source: "fontshare", spec: "switzer@400,600" },
  { key: "neue-montreal", label: "PP Neue Montreal (teste)", family: "PP Neue Montreal", source: "local", files: { 400: "neue-montreal-400.woff2", 600: "neue-montreal-600.woff2" } },
  { key: "sohne", label: "Söhne (teste)", family: "Sohne", source: "local", files: { 400: "sohne-400.woff2", 600: "sohne-600.woff2" } },
];

const UA_MODERN =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

async function embed(url) {
  const absolute = url.startsWith("//") ? `https:${url}` : url;
  const buffer = Buffer.from(await (await fetch(absolute, { headers: { "user-agent": UA_MODERN } })).arrayBuffer());
  return `data:font/woff2;base64,${buffer.toString("base64")}`;
}

/** Só o subconjunto latino, embutido em data URI. */
async function googleFaces(spec) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${spec}&display=swap`, { headers: { "user-agent": UA_MODERN } })
  ).text();
  const blocks = css.split("@font-face").slice(1).map((block) => "@font-face" + block.split("}")[0] + "}");
  const latin = blocks.filter((block) => /U\+0000-00FF/.test(block));
  let out = "";
  for (const block of (latin.length ? latin : blocks.slice(0, 2))) {
    const url = block.match(/url\((https:[^)]+)\)/)?.[1];
    if (url) out += block.replace(url, await embed(url)) + "\n";
  }
  return out;
}

/** Fontshare (Indian Type Foundry): licença livre, inclusive comercial. */
async function fontshareFaces(spec) {
  const css = await (
    await fetch(`https://api.fontshare.com/v2/css?f%5B%5D=${encodeURIComponent(spec)}&display=swap`, {
      headers: { "user-agent": UA_MODERN },
    })
  ).text();
  const blocks = css.split("@font-face").slice(1).map((block) => "@font-face" + block.split("}")[0] + "}");
  let out = "";
  for (const block of blocks) {
    const url = block.match(/url\('([^']+\.woff2)'\)/)?.[1];
    if (!url) continue;
    const weight = block.match(/font-weight:\s*(\d+)/)?.[1] ?? "400";
    out += `@font-face{font-family:'${block.match(/font-family:\s*'([^']+)'/)?.[1]}';font-weight:${weight};font-display:swap;src:url(${await embed(url)}) format('woff2')}\n`;
  }
  return out;
}

/** Ficheiros de teste locais, quando existirem. */
async function localFaces(font) {
  let out = "";
  for (const [weight, file] of Object.entries(font.files)) {
    const full = path.join(process.cwd(), "public", "fonts", "trials", file);
    try {
      const buffer = await readFile(full);
      out += `@font-face{font-family:'${font.family}';font-weight:${weight};font-display:swap;src:url(data:font/woff2;base64,${buffer.toString("base64")}) format('woff2')}\n`;
    } catch {
      return null;
    }
  }
  return out;
}

const mime = { ".woff2": "font/woff2", ".webm": "video/webm", ".mp4": "video/mp4", ".jpg": "image/jpeg", ".png": "image/png", ".svg": "image/svg+xml" };

async function asDataUri(publicPath) {
  const file = path.join(process.cwd(), "public", publicPath);
  const buffer = await readFile(file);
  const type = mime[path.extname(publicPath)] ?? "application/octet-stream";
  return `data:${type};base64,${buffer.toString("base64")}`;
}

async function inlineAssets(text) {
  const references = [...new Set([...text.matchAll(/["'(](\/(?:fonts|media|brand)\/[^"')]+)["')]/g)].map((m) => m[1]))];
  for (const reference of references) {
    try {
      text = text.replaceAll(reference, await asDataUri(reference));
    } catch {
      // ficheiro inexistente: fica o caminho original
    }
  }
  return text;
}

const seenCss = new Set();
let css = "";
const sections = [];

for (const page of pages) {
  const html = await (await fetch(BASE + page.path)).text();

  for (const href of [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((m) => m[1])) {
    const url = href.startsWith("http") ? href : BASE + href;
    if (seenCss.has(url)) continue;
    seenCss.add(url);
    css += await (await fetch(url)).text();
  }

  let body = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
  body = body.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<template[\s\S]*?<\/template>/g, "");
  body = body.replace(/href="(\/[^"]*)"/g, (match, href) => `href="${routes[href] ?? "#" + page.key}"`);
  sections.push({ ...page, body: await inlineAssets(body) });
}

// Estados interativos: abre-os no browser e guarda o DOM resultante.
const browser = await chromium.launch();
for (const capture of captures) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + capture.path, { waitUntil: "networkidle" });
  await capture.act(page);
  // Guardamos só o diálogo, e passamo-lo a estático: num instantâneo não há JS
  // para o manter em fixed por cima do resto.
  let body = await page.evaluate(() => document.querySelector("[role=dialog]")?.outerHTML ?? document.body.innerHTML);
  await page.close();
  body = body.replace(/<script[\s\S]*?<\/script>/g, "");
  body = body.replace(/class="fixed inset-0 z-50/g, 'class="relative z-0 min-h-[86vh]');
  body = body.replace(/href="(\/[^"]*)"/g, (match, href) => `href="${routes[href] ?? "#" + capture.key}"`);
  sections.push({ ...capture, body: await inlineAssets(body) });
}
await browser.close();

// Tipografia candidata: faces embutidas + override por data-font.
let fontCss = "";
const available = [];
for (const font of FONTS) {
  let faces = null;
  if (font.source === "google") faces = await googleFaces(font.spec);
  if (font.source === "fontshare") faces = await fontshareFaces(font.spec);
  if (font.source === "local") faces = await localFaces(font);
  if (!faces) {
    console.warn(`· ${font.label}: sem ficheiros em public/fonts/trials/ — fica de fora`);
    continue;
  }
  fontCss += faces;
  fontCss += `:root[data-font="${font.key}"]{--font-display:"${font.family}",system-ui,sans-serif;--font-sans:"${font.family}",system-ui,sans-serif}\n`;
  available.push(font);
}

css = await inlineAssets(css);

const nav = [...pages, ...captures].map((p) => `<a href="#${p.key}" data-p="${p.key}">${p.label}</a>`).join("");
const bodies = sections.map((s) => `<section class="pv-page" data-p="${s.key}" id="${s.key}">${s.body}</section>`).join("");

const out = `<meta charset="utf-8">
<title>Novo jelly.pt</title>
<style>
${css}
${fontCss}
/* chrome do instantâneo */
.pv-chrome{position:sticky;top:0;z-index:9999}
.pv-bar{display:flex;align-items:center;gap:14px;padding:10px 16px;
  background:#151719;color:#f4f6f8;font-family:"Poppins",system-ui,sans-serif;font-size:13px;flex-wrap:wrap}
.pv-bar strong{font-family:"Jubilat","Bree Serif",Georgia,serif;font-weight:400;font-size:16px}
.pv-bar nav{display:flex;gap:4px;flex-wrap:wrap}
.pv-bar nav a{color:rgba(244,246,248,.72);text-decoration:none;padding:5px 11px;border-radius:8px;font-size:12.5px;font-weight:500}
.pv-bar nav a:hover{color:#fff;background:rgba(255,255,255,.08)}
.pv-bar nav a.on{background:#dd364a;color:#fff}
.pv-bar em{margin-left:auto;font-style:normal;color:#8a93a0;font-size:11.5px}
.pv-fonts{display:flex;align-items:center;gap:6px;flex-wrap:wrap;
  padding:8px 16px;background:#2a384a;color:#f4f6f8;font-family:"Poppins",system-ui,sans-serif;font-size:12px}
.pv-fonts span{opacity:.6;margin-right:6px}
.pv-fonts button{font:inherit;cursor:pointer;border:0;border-radius:8px;padding:5px 10px;background:rgba(255,255,255,.1);color:inherit}
.pv-fonts button:hover{background:rgba(255,255,255,.2)}
.pv-fonts button.on{background:#dd364a;color:#fff}
.pv-fonts em{margin-left:auto;font-style:normal;opacity:.5}
.pv-page{display:none}
.pv-page.on{display:block}
@media (max-width:640px){.pv-bar em{display:none}}
</style>
<div class="pv-chrome">
<div class="pv-bar"><strong>Novo jelly.pt</strong><nav>${nav}</nav><em>Instantâneo estático do código — os formulários não submetem</em></div>
<div class="pv-fonts"><span>Tipografia dos títulos e da interface</span>${available.map((f, i) => `<button type="button" data-f="${f.key}"${i === 0 ? ' class="on"' : ""}>${f.label}</button>`).join("")}<em>A Jubilat mantém-se no editorial</em></div>
</div>
${bodies}
<script>
(function(){
  var pages=[].slice.call(document.querySelectorAll('.pv-page'));
  var links=[].slice.call(document.querySelectorAll('.pv-bar nav a'));
  function show(key){
    pages.forEach(function(p){ p.classList.toggle('on', p.dataset.p===key); });
    links.forEach(function(a){ a.classList.toggle('on', a.dataset.p===key); });
    var video=document.querySelector('.pv-page.on video');
    if(video && !window.matchMedia('(prefers-reduced-motion: reduce)').matches){ video.play().catch(function(){}); }
    window.scrollTo(0,0);
  }
  links.forEach(function(a){ a.addEventListener('click', function(e){ e.preventDefault(); show(a.dataset.p); history.replaceState(null,'','#'+a.dataset.p); }); });
  document.addEventListener('click', function(e){
    var a=e.target.closest('a[href^="#"]'); if(!a) return;
    var key=a.getAttribute('href').slice(1);
    if(pages.some(function(p){return p.dataset.p===key;})){ e.preventDefault(); show(key); }
  });
  show((location.hash||'#home').slice(1));

  var fontButtons=[].slice.call(document.querySelectorAll('.pv-fonts button'));
  document.documentElement.dataset.font='poppins';
  fontButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      document.documentElement.dataset.font=btn.dataset.f;
      fontButtons.forEach(function(other){ other.classList.toggle('on', other===btn); });
    });
  });
})();
</script>
`;

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "index.html"), out, "utf8");
console.log(`docs/preview/index.html · ${Math.round(out.length / 1024)} KB · ${pages.length} páginas`);
