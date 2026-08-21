#!/usr/bin/env node
/**
 * Constrói o mapa de 301 a partir dos sitemaps do site atual.
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/build-redirects.mjs
 *
 * Escreve src/lib/redirects.generated.json, que o next.config.ts serve.
 * Nada é inventado: o que não tiver destino óbvio fica listado no relatório
 * para decisão manual, e não entra no ficheiro.
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const ORIGIN = "https://www.jelly.pt";

/** Páginas de serviço do site antigo → os quatro pilares. */
const SERVICES = {
  "/branding/": "/servicos/branding",
  "/ui-ux-design/": "/servicos/branding",
  "/servicos/design-ui-ux/": "/servicos/branding",
  "/servicos/web-marketing-digital/": "/servicos/marketing",
  "/sem-search-engine-marketing/": "/servicos/marketing",
  "/servicos/web-marketing-digital/seo-search-everywhere-optimization/": "/servicos/marketing",
  "/servicos/web-marketing-digital/live-video-shopping/": "/servicos/marketing",
  "/servicos/audiovisuais-producao-video/": "/servicos/marketing",
  "/servicos/producoes-3d/": "/servicos/marketing",
  "/inteligencia-artificial/": "/servicos/inteligencia-artificial",
  "/inteligencia-artificial/pre-qualificacao-leads-agentes-ia/": "/servicos/inteligencia-artificial",
  "/imunidade-algoritmica/": "/servicos/inteligencia-artificial",
  "/servicos/web-design-criacao-de-sites/": "/servicos/tecnologia",
  "/servicos/aplicacoes-web-e-mobile/": "/servicos/tecnologia",
  "/servicos/consultoria-e-sistemas-crm-erp-cdp/": "/servicos/tecnologia",
  "/servicos/estrategia-digital-e-crescimento-das-vendas-powered-by-informa-db/": "/servicos/tecnologia",
  "/jellycare/": "/servicos/tecnologia",
};

/** Páginas institucionais e utilitárias. */
const PAGES = {
  "/": "/",
  "/empresa/": "/sobre",
  "/equipa-jelly/": "/sobre",
  "/recrutamento/": "/sobre",
  "/portfolio/": "/projetos",
  "/contactos-jelly/": "/contactos",
  "/noticias-eventos/": "/newsroom",
  "/blog/": "/blog",
  "/termos-e-condicoes/": "/legal/termos-e-condicoes",
  "/politica-de-privacidade-2/": "/legal/politica-de-privacidade",
  "/politica-de-utilizacao-responsavel-pur/": "/legal/utilizacao-responsavel",
  "/entidades-resolucao-alternativa-litigios/": "/legal/resolucao-de-litigios",
  "/servicos/rgpd-regulamento-geral-protecao-dados/": "/legal/politica-de-privacidade",
  "/subscrever-newsletter-jellycode/": "/blog",
  "/confirmacao-consulta-marketing-digital/": "/contactos",
  "/404-pt/": "/",
  "/impacto-do-comercio-eletronico-no-setor-de-i-gaming/": "/blog",
};

async function locs(sitemap) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(`${ORIGIN}/${sitemap}.xml`, { headers: { "user-agent": UA } });
    const xml = response.ok ? await response.text() : "";
    const found = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    if (found.length) return found;
    console.warn(`  ${sitemap}: vazio (tentativa ${attempt})`);
    await new Promise((resolve) => setTimeout(resolve, 800 * attempt));
  }
  return [];
}

// Sequencial: em paralelo o site devolvia sitemaps vazios.
const posts = await locs("post-sitemap");
const pages = await locs("page-sitemap");
const portfolio = await locs("portfolio-sitemap");
const recrutamento = await locs("recrutamento-sitemap");
const categories = await locs("category-sitemap");
const tags = await locs("post_tag-sitemap");

const redirects = [];
const unmapped = [];
const seen = new Set();

const add = (source, destination, permanent = true) => {
  const from = source.replace(/\/$/, "") || "/";
  if (from === destination || seen.has(from)) return;
  seen.add(from);
  redirects.push({ source: from, destination, permanent });
};

// Artigos: o URL antigo leva a categoria depois do slug (/slug/categoria/), mas
// o WordPress serve o mesmo artigo em /slug/ — as duas formas respondem 200 no
// site antigo, e as duas andam por aí em links e no índice do Google.
for (const pathname of posts) {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) continue;
  add(pathname, `/blog/${parts[0]}`);
  add(`/${parts[0]}`, `/blog/${parts[0]}`);
}

// Portfolio: /portfolio/{slug}/ → /projetos/{slug}
for (const pathname of portfolio) {
  const slug = pathname.split("/").filter(Boolean).pop();
  if (slug) add(pathname, `/projetos/${slug}`);
}

// Recrutamento
for (const pathname of recrutamento) {
  if (pathname.replace(/\/$/, "") === "/recrutamento") continue;
  add(pathname, "/sobre");
}

// Categorias e tags: o índice do blog absorve-as (as tags saem do índice).
for (const pathname of [...categories, ...tags]) add(pathname, "/blog");

/**
 * O que o WordPress publica sem estar em sitemap nenhum. As famílias com número
 * de página e os feeds ficam para o middleware, que as resolve com duas regras
 * em vez de uma entrada por arquivo.
 */
for (const [source, destination] of [
  ["/feed", "/blog"],
  ["/comments/feed", "/blog"],
  ["/author", "/blog"],
  ["/wp-sitemap.xml", "/sitemap.xml"],
  ["/sitemap_index.xml", "/sitemap.xml"],
]) {
  add(source, destination);
}

// Páginas e serviços, com mapeamento explícito.
for (const pathname of pages) {
  const key = pathname.endsWith("/") ? pathname : `${pathname}/`;
  const target = PAGES[key] ?? SERVICES[key];
  if (target) add(pathname, target);
  else unmapped.push(pathname);
}

const out = path.join(process.cwd(), "src", "lib", "redirects.generated.json");
await writeFile(out, JSON.stringify(redirects, null, 1));

console.log(`${redirects.length} redirecionamentos`);
console.log(`  artigos ${posts.length} · portfolio ${portfolio.length} · categorias ${categories.length} · tags ${tags.length} · páginas ${pages.length}`);
if (unmapped.length) {
  console.log(`\n${unmapped.length} páginas sem destino definido — decidir à mão:`);
  unmapped.forEach((pathname) => console.log("  ", pathname));
}
console.log(`\n→ src/lib/redirects.generated.json`);
