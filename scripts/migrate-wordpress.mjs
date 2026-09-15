#!/usr/bin/env node
/**
 * Migra o conteúdo do jelly.pt (WordPress) para JSON versionado.
 *
 *   NODE_USE_ENV_PROXY=1 node scripts/migrate-wordpress.mjs [--limit 200]
 *
 * Escreve src/content/generated/{posts,pages}.json. As imagens ficam com o URL
 * de origem: sobem para o CDN do CMS na fase do Sanity, não agora.
 *
 * O tipo `portfolio` não está exposto na API do site, por isso os 64 casos
 * entram por scripts/import-portfolio-xml.mjs a partir de um export do WordPress.
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "node-html-parser";

const BASE = "https://www.jelly.pt/wp-json/wp/v2";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";
const OUT = path.join(process.cwd(), "src", "content", "generated");
const limitArg = process.argv.indexOf("--limit");
const LIMIT = limitArg > -1 ? Number(process.argv[limitArg + 1]) : Infinity;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function api(pathname, params = {}) {
  const url = new URL(BASE + pathname);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url, { headers: { "user-agent": UA } });
  if (!response.ok) throw new Error(`${url.pathname} → ${response.status}`);
  return { data: await response.json(), total: Number(response.headers.get("x-wp-total") ?? 0) };
}

async function all(pathname, params = {}) {
  const out = [];
  for (let page = 1; ; page++) {
    const { data } = await api(pathname, { ...params, per_page: 25, page });
    out.push(...data);
    if (data.length < 25 || out.length >= LIMIT) break;
    await sleep(400);
  }
  return out.slice(0, LIMIT);
}

/** HTML do WordPress → blocos simples que as páginas sabem desenhar. */
function toBlocks(html) {
  const root = parse(html ?? "", { blockTextElements: { script: false, style: false } });
  const blocks = [];

  // O site atual é construído com WPBakery: os shortcodes vêm no meio do texto.
  const clean = (value) =>
    value
      .replace(/\[\/?[a-z0-9_]+[^\]]*\]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
  const text = (node) => clean(node.textContent);

  /**
   * O endereço verdadeiro da imagem. O tema carrega as imagens em diferido e
   * põe no `src` um SVG de 1x1 em base64 — foi assim que 155 imagens do corpo
   * dos artigos se perderam na primeira migração.
   */
  /** O maior recorte de um `srcset`, com a largura que ele declara. */
  const maiorDo = (srcset) =>
    (srcset ?? "")
      .split(",")
      .map((entrada) => {
        const [endereco, medida] = entrada.trim().split(/\s+/);
        return { endereco, largura: Number((medida ?? "").replace("w", "")) || 0 };
      })
      .filter(({ endereco }) => endereco && !endereco.startsWith("data:"))
      .sort((a, b) => b.largura - a.largura)[0];

  /**
   * O endereço verdadeiro da imagem, e o maior que houver.
   *
   * Duas coisas correm mal aqui, e só uma era conhecida.
   *
   * A primeira: o tema carrega as imagens em diferido e põe no `src` um SVG de
   * 1x1 em base64 — foi assim que 155 imagens do corpo dos artigos se perderam
   * na primeira migração. Por isso os `data-*` vêm à frente.
   *
   * A segunda passou despercebida até setembro de 2026: do `srcset` lia-se o
   * **primeiro** recorte e não o maior. Os artigos que migraram até aí tiveram
   * sorte — o WordPress da casa lista por ordem decrescente e o primeiro era o
   * maior. Num tema que liste por ordem crescente, o guião escolhia a
   * miniatura, e ninguém dava por isso até alguém abrir o artigo num ecrã
   * grande. Agora ordena-se pela largura declarada e fica-se com a maior.
   *
   * O `srcset` ganha ao `src` quando é mais largo: o `src` é o recorte que o
   * tema escolheu para aquele sítio, e o site novo desenha estas imagens até
   * aos 1040px. Numa migração quer-se o maior que exista, não o que servia
   * numa página com outra medida.
   */
  const source = (image) => {
    const doSrcset = maiorDo(image.getAttribute("srcset") ?? image.getAttribute("data-srcset"));
    const diretos = [
      image.getAttribute("data-src"),
      image.getAttribute("data-lazy-src"),
      image.getAttribute("data-large_image"),
      image.getAttribute("src"),
    ].find((value) => value && !value.startsWith("data:"));

    // Sem larguras declaradas não há como comparar: fica o directo, como antes.
    if (!doSrcset?.largura) return diretos ?? doSrcset?.endereco ?? null;
    if (!diretos) return doSrcset.endereco;

    // O `width` do próprio `<img>` diz o que o directo mede. Sem ele, o srcset
    // maior ganha à mesma: uma largura declarada vale mais do que um palpite.
    const larguraDireta = Number(image.getAttribute("width")) || 0;
    return doSrcset.largura > larguraDireta ? doSrcset.endereco : diretos;
  };

  /**
   * O cartão de quem escreveu, que o tema põe no topo do artigo.
   *
   * São duas coisas e não uma: a fotografia de perfil, dentro de um
   * `wp-block-media-text__media`, e a linha «Nome / Cargo» no parágrafo logo a
   * seguir. Ambas caem — o site novo tem ficha de autor própria, e sem isto o
   * artigo abria com um avatar de 600px e com o nome da autora a meio do texto.
   *
   * O que fica é o texto do cartão, que neste tema é o parágrafo de entrada do
   * artigo. Apagar o bloco inteiro, que foi o que tentei primeiro, levava o
   * lead com ele.
   */
  const retratoDoAutor = (node) => (node.getAttribute?.("class") ?? "").includes("wp-block-media-text__media");

  /** «Nome<br>Cargo»: um parágrafo curto com uma quebra de linha lá dentro. */
  const assinatura = (node) =>
    Boolean(node.querySelector?.("br")) && Boolean(node.querySelector?.("strong")) && text(node).length <= 60;

  /**
   * Um parágrafo que é só negrito e é curto é um título.
   *
   * Quem escreve no WordPress marca as secções a negrito em vez de usar os
   * títulos do editor, e o artigo chegava aqui com quarenta e sete parágrafos
   * seguidos e um único `h3`. As duas condições contam: o parágrafo de entrada
   * também vem todo a negrito, e é um parágrafo — por isso o corte pelo
   * comprimento, e por acabar em ponto final.
   */
  const tituloDisfarcado = (node) => {
    const fortes = node.querySelectorAll("strong");
    if (fortes.length !== 1) return false;
    const valor = text(node);
    if (!valor || valor !== text(fortes[0])) return false;
    return valor.length <= 80 && !/[.:;!?]$/.test(valor);
  };

  for (const node of root.childNodes) {
    const tag = node.rawTagName?.toLowerCase();
    if (retratoDoAutor(node)) continue;
    if (!tag) {
      const loose = text(node);
      if (loose) blocks.push({ type: "p", text: loose });
      continue;
    }
    if (tag === "p") {
      if (assinatura(node)) continue;
      const image = node.querySelector("img");
      const value = text(node);
      if (image) {
        // Com texto à volta, saem os dois: primeiro a imagem, depois a legenda.
        blocks.push({ type: "image", src: source(image), alt: image.getAttribute("alt") ?? "" });
        if (value) blocks.push({ type: "p", text: value });
        continue;
      }
      if (value) blocks.push({ type: tituloDisfarcado(node) ? "h3" : "p", text: value });
      continue;
    }
    if (tag === "h2" || tag === "h3" || tag === "h4") {
      const value = text(node);
      if (value) blocks.push({ type: tag === "h2" ? "h2" : "h3", text: value });
      continue;
    }
    if (tag === "ul" || tag === "ol") {
      const items = node.querySelectorAll("li").map((li) => text(li)).filter(Boolean);
      if (items.length) blocks.push({ type: "list", ordered: tag === "ol", items });
      continue;
    }
    if (tag === "blockquote") {
      const value = text(node);
      if (value) blocks.push({ type: "quote", text: value });
      continue;
    }
    if (tag === "figure" || tag === "img") {
      const image = tag === "img" ? node : node.querySelector("img");
      if (image) {
        blocks.push({
          type: "image",
          src: source(image),
          alt: image.getAttribute("alt") ?? "",
          caption: text(node.querySelector?.("figcaption") ?? { textContent: "" }) || undefined,
        });
      }
      continue;
    }
    // Divs de construtor: descemos um nível em vez de perder o texto.
    if (tag === "div" || tag === "section" || tag === "article") {
      blocks.push(...toBlocks(node.innerHTML));
      continue;
    }
    const value = text(node);
    if (value) blocks.push({ type: "p", text: value });
  }

  // Muitos artigos abrem com um h3 que é, na verdade, o lead. Fica parágrafo.
  while (blocks.length && (blocks[0].type === "h2" || blocks[0].type === "h3")) {
    const hasMoreHeadings = blocks.slice(1).some((block) => block.type === "h2" || block.type === "h3");
    if (!hasMoreHeadings) break;
    blocks[0] = { type: "p", text: blocks[0].text };
    break;
  }

  // Junta parágrafos vazios e limita repetições do construtor.
  return blocks.filter((block, index, list) => {
    if (block.type === "image" && !block.src) return false;
    if (block.type === "p" && block.text.length < 3) return false;
    if (index && block.type === "p" && list[index - 1].type === "p" && list[index - 1].text === block.text) return false;
    return true;
  });
}

const decode = (value = "") =>
  value
    .replace(/&#8217;|&#039;|&#39;/g, "’")
    .replace(/&#8220;|&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

const slugify = (url) => {
  const parts = new URL(url).pathname.split("/").filter(Boolean);
  return parts[0] ?? "";
};

await mkdir(OUT, { recursive: true });

console.log("· utilizadores e categorias");
const [users, categories] = await Promise.all([all("/users", { _fields: "id,name" }), all("/categories", { _fields: "id,name,slug" })]);
const userById = new Map(users.map((user) => [user.id, user.name]));
const categoryById = new Map(categories.map((category) => [category.id, category]));

console.log("· artigos");
/**
 * Resumo de um artigo. O `excerpt.rendered` do WordPress vem com os shortcodes
 * do construtor lá dentro na maioria dos artigos antigos — o que ia direto para
 * o índice do blog. Limpa-se, e se sobrar ruído usa-se o primeiro parágrafo do
 * corpo, cortado numa fronteira de palavra.
 */
function summarize(raw, body) {
  const clean = (value = "") =>
    value
      .replace(/\[\/?[a-z0-9_]+[^\]]*\]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

  const candidate = clean(raw);
  const usable = candidate.length >= 60 && !/^[”"'\s]*$/.test(candidate) ? candidate : "";
  const fallback = clean(body.find((block) => block.type === "p")?.text ?? "");
  const text = usable || fallback;
  if (text.length <= 220) return text;
  const cut = text.slice(0, 220);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}

const rawPosts = await all("/posts", { _fields: "id,slug,link,date,modified,title,excerpt,content,author,categories,featured_media" });
console.log(`  ${rawPosts.length} artigos`);

const mediaCache = new Map();
async function media(id) {
  if (!id) return null;
  if (mediaCache.has(id)) return mediaCache.get(id);
  try {
    const { data } = await api(`/media/${id}`, { _fields: "source_url,alt_text,media_details" });
    const value = { src: data.source_url, alt: data.alt_text ?? "", width: data.media_details?.width, height: data.media_details?.height };
    mediaCache.set(id, value);
    return value;
  } catch {
    return null;
  }
}

const posts = [];
for (const post of rawPosts) {
  const body = toBlocks(post.content?.rendered);
  const words = body.reduce((total, block) => total + (block.text?.split(/\s+/).length ?? 0), 0);
  posts.push({
    slug: post.slug,
    legacyPath: new URL(post.link).pathname,
    date: post.date.slice(0, 10),
    updated: post.modified?.slice(0, 10),
    lang: "pt",
    title: decode(post.title?.rendered),
    excerpt: summarize(decode(post.excerpt?.rendered), body),
    author: userById.get(post.author) ?? "Equipa Jelly",
    category: categoryById.get(post.categories?.[0])?.name ?? "Jelly",
    categorySlug: categoryById.get(post.categories?.[0])?.slug ?? "jelly",
    readingMinutes: Math.max(2, Math.round(words / 200)),
    cover: await media(post.featured_media),
    body,
  });
  if (posts.length % 25 === 0) console.log(`  ${posts.length}/${rawPosts.length}`);
  await sleep(120);
}

console.log("· páginas");
const rawPages = await all("/pages", { _fields: "id,slug,link,date,modified,title,excerpt,content,parent" });
const pages = rawPages.map((page) => ({
  slug: page.slug,
  legacyPath: new URL(page.link).pathname,
  title: decode(page.title?.rendered),
  updated: page.modified?.slice(0, 10),
  words: toBlocks(page.content?.rendered).reduce((total, block) => total + (block.text?.split(/\s+/).length ?? 0), 0),
  body: toBlocks(page.content?.rendered),
}));

await writeFile(path.join(OUT, "posts.json"), JSON.stringify(posts, null, 1));
await writeFile(path.join(OUT, "pages.json"), JSON.stringify(pages, null, 1));

const withBody = posts.filter((post) => post.body.length > 2).length;
console.log(`\n${posts.length} artigos (${withBody} com corpo utilizável) e ${pages.length} páginas`);
console.log(`imagens de capa: ${posts.filter((post) => post.cover).length}`);
console.log("→ src/content/generated/posts.json e pages.json");
