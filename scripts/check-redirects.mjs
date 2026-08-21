#!/usr/bin/env node
/**
 * Prova que os endereços do site antigo aterram no novo.
 *
 * Vai aos sitemaps do jelly.pt, junta as duas formas que o WordPress serve para
 * cada artigo (com e sem a categoria a seguir ao slug), acrescenta as famílias
 * que não estão em sitemap nenhum — feeds, paginação, autor — e pede cada uma ao
 * site novo. Passa quando responde 3xx ou 200; falha quando dá 404.
 *
 *   BASE=https://jelly-web-pi.vercel.app node scripts/check-redirects.mjs
 *   BASE=… node scripts/check-redirects.mjs --all      # tudo, não uma amostra
 */
const BASE = (process.env.BASE ?? "https://www.jelly.pt").replace(/\/$/, "");
const ORIGIN = "https://www.jelly.pt";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/141.0.0.0 Safari/537.36";
const args = process.argv.slice(2);
const all = args.includes("--all");
const amostra = Number(args.find((a) => a.startsWith("--sample="))?.split("=")[1] ?? 40);

async function locs(sitemap) {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const response = await fetch(`${ORIGIN}/${sitemap}.xml`, { headers: { "user-agent": UA } });
    const xml = response.ok ? await response.text() : "";
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    if (found.length) return found;
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
  }
  return [];
}

const posts = await locs("post-sitemap");
const pages = await locs("page-sitemap");
const portfolio = await locs("portfolio-sitemap");
const categories = await locs("category-sitemap");
const tags = await locs("post_tag-sitemap");

const alvos = new Set();
for (const pathname of posts) {
  const slug = pathname.split("/").filter(Boolean)[0];
  alvos.add(pathname);
  if (slug) {
    alvos.add(`/${slug}`);
    alvos.add(`/${slug}/feed`);
  }
}
for (const pathname of [...pages, ...portfolio, ...categories, ...tags]) alvos.add(pathname);
for (const extra of ["/feed", "/comments/feed", "/blog/page/2", "/page/2", "/author/jelly", "/portfolio/page/2", "/sitemap_index.xml"]) {
  alvos.add(extra);
}

const lista = [...alvos];
const escolhidos = all ? lista : lista.filter((_, index) => index % Math.ceil(lista.length / amostra) === 0);

console.log(`${escolhidos.length} de ${lista.length} endereços antigos, contra ${BASE}`);

const falhas = [];
let ok = 0;

// Em série e com paciência: é uma verificação, não uma corrida.
for (const pathname of escolhidos) {
  try {
    const response = await fetch(`${BASE}${pathname}`, { redirect: "manual", headers: { "user-agent": UA } });
    if (response.status >= 300 && response.status < 400) {
      ok += 1;
    } else if (response.status === 200) {
      ok += 1;
    } else {
      falhas.push(`${response.status} ${pathname}`);
    }
  } catch (error) {
    falhas.push(`erro ${pathname}: ${error.message}`);
  }
}

console.log(`${ok} aterram, ${falhas.length} perdidos`);
for (const linha of falhas.slice(0, 30)) console.log("  ", linha);
process.exit(falhas.length ? 1 : 0);
