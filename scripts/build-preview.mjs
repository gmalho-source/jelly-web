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

const BASE = process.env.PREVIEW_BASE ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "docs", "preview");

const pages = [
  { key: "home", path: "/", label: "Homepage" },
  { key: "sobre", path: "/sobre", label: "Sobre" },
  { key: "servicos", path: "/servicos", label: "Serviços" },
  { key: "servico", path: "/servicos/inteligencia-artificial", label: "Serviço · IA" },
  { key: "projetos", path: "/projetos", label: "Projetos" },
  { key: "caso", path: "/projetos/adegamae", label: "Caso" },
  { key: "clientes", path: "/clientes", label: "Clientes" },
  { key: "blog", path: "/blog", label: "Blog" },
  { key: "artigo", path: "/blog/ia-no-marketing-digital", label: "Artigo" },
  { key: "newsroom", path: "/newsroom", label: "Newsroom" },
  { key: "contactos", path: "/contactos", label: "Contactos" },
  { key: "en", path: "/en", label: "Homepage EN" },
  { key: "billing", path: "/billing", label: "billing.jelly.pt" },
];

const routes = {
  "/": "#home",
  "/sobre": "#sobre",
  "/servicos": "#servicos",
  "/servicos/inteligencia-artificial": "#servico",
  "/projetos": "#projetos",
  "/projetos/adegamae": "#caso",
  "/clientes": "#clientes",
  "/blog": "#blog",
  "/blog/ia-no-marketing-digital": "#artigo",
  "/newsroom": "#newsroom",
  "/contactos": "#contactos",
  "/en": "#en",
  "/billing": "#billing",
};

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

css = await inlineAssets(css);

const nav = pages.map((p) => `<a href="#${p.key}" data-p="${p.key}">${p.label}</a>`).join("");
const bodies = sections.map((s) => `<section class="pv-page" data-p="${s.key}" id="${s.key}">${s.body}</section>`).join("");

const out = `<meta charset="utf-8">
<title>Novo jelly.pt</title>
<style>
${css}
/* chrome do instantâneo */
.pv-bar{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:14px;padding:10px 16px;
  background:#151719;color:#f4f6f8;font-family:"Poppins",system-ui,sans-serif;font-size:13px;flex-wrap:wrap}
.pv-bar strong{font-family:"Jubilat","Bree Serif",Georgia,serif;font-weight:400;font-size:16px}
.pv-bar nav{display:flex;gap:4px;flex-wrap:wrap}
.pv-bar nav a{color:rgba(244,246,248,.72);text-decoration:none;padding:5px 11px;border-radius:8px;font-size:12.5px;font-weight:500}
.pv-bar nav a:hover{color:#fff;background:rgba(255,255,255,.08)}
.pv-bar nav a.on{background:#dd364a;color:#fff}
.pv-bar em{margin-left:auto;font-style:normal;color:#8a93a0;font-size:11.5px}
.pv-shift{height:46px}
.pv-page{display:none}
.pv-page.on{display:block}
@media (max-width:640px){.pv-bar em{display:none}}
</style>
<div class="pv-bar"><strong>Novo jelly.pt</strong><nav>${nav}</nav><em>Instantâneo estático do código — os formulários não submetem</em></div>
<div class="pv-shift"></div>
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
})();
</script>
`;

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "index.html"), out, "utf8");
console.log(`docs/preview/index.html · ${Math.round(out.length / 1024)} KB · ${pages.length} páginas`);
