import { getPosts, getPostsDa } from "@/lib/cms";
import { seccaoDe } from "@/lib/seccao";
import type { Post } from "@/content/types";
import { resumoPublicavel } from "@/lib/resumo";
import { capaDe, slugFor } from "@/lib/slugs";
import { SITE_URL } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

/**
 * Os feeds RSS, nas duas línguas.
 *
 * O site antigo tinha feeds e havia quem os lesse; ao migrar, esses endereços
 * passaram a mandar toda a gente para o índice do blog, o que é uma forma
 * educada de os perder. Isto devolve-lhes o que liam.
 *
 * Serve também o outro lado: com um feed, o resumo dos artigos novos para a
 * newsletter passa a poder ser uma campanha RSS no Brevo, sem eu escrever um
 * agendador nem um segundo sítio onde a lista de artigos vive.
 */
const escapa = (valor: string) =>
  valor.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const QUANTOS = 20;

/**
 * O tipo de uma imagem pela terminação do endereço.
 *
 * O `<enclosure>` exige-o, e quem lê o feed usa-o para decidir se mostra a
 * capa. Não vale a pena ir buscar cabeçalhos ao Blob por causa disto: os
 * ficheiros da casa são estes quatro.
 */
function tipoDaImagem(src: string): string | undefined {
  const fim = src.split("?")[0].toLowerCase();
  if (fim.endsWith(".webp")) return "image/webp";
  if (fim.endsWith(".png")) return "image/png";
  if (fim.endsWith(".avif")) return "image/avif";
  if (fim.endsWith(".jpg") || fim.endsWith(".jpeg")) return "image/jpeg";
  return undefined;
}

/**
 * A capa do artigo, escrita das duas maneiras que os leitores conhecem.
 *
 * O `<enclosure>` é o que o Brevo procura quando monta uma campanha RSS, e o
 * `media:content` é o que a maior parte dos leitores de feeds prefere. São a
 * mesma imagem duas vezes, de propósito: escrever só uma delas é escolher
 * qual dos dois lados fica sem capa.
 *
 * O `length` vai a zero porque não conhecemos o tamanho do ficheiro sem o ir
 * buscar — a norma pede o atributo, não que ele seja exato, e nenhum leitor
 * descarrega uma capa por causa dele.
 */
function capaDoItem(post: Post, locale: Locale): string[] {
  const capa = capaDe(post, locale);
  if (!capa?.src) return [];
  const endereco = capa.src.startsWith("http") ? capa.src : `${SITE_URL.replace(/\/$/, "")}${capa.src}`;
  const tipo = tipoDaImagem(endereco);
  if (!tipo) return [];
  const medidas = [
    capa.width ? ` width="${capa.width}"` : "",
    capa.height ? ` height="${capa.height}"` : "",
  ].join("");
  return [
    `      <enclosure url="${escapa(endereco)}" type="${tipo}" length="0" />`,
    `      <media:content url="${escapa(endereco)}" type="${tipo}" medium="image"${medidas} />`,
  ];
}

/**
 * Os dois feeds.
 *
 * `/rss.xml` é o do blog, como sempre foi: há quem o leia num leitor de feeds,
 * e as notícias da casa não são o que essa pessoa assinou.
 *
 * `/rss/tudo.xml` junta o blog e o newsroom, por data, cada artigo com o seu
 * endereço. É o da newsletter: a campanha RSS do Brevo lê um feed só, e quando
 * o blog e o newsroom se separaram (outubro de 2026) os artigos do newsroom
 * deixaram de lhe chegar.
 */
type Qual = "blog" | "tudo";

const TITULO: Record<Qual, Record<Locale, string>> = {
  blog: { pt: "Jelly — Blog", en: "Jelly — Blog" },
  tudo: { pt: "Jelly — Blog e Newsroom", en: "Jelly — Blog and Newsroom" },
};

const DESCRICAO: Record<Qual, Record<Locale, string>> = {
  blog: {
    pt: "O que aprendemos a trabalhar: inteligência artificial, marcas, campanhas e o que correu mal pelo caminho.",
    en: "What we learn at work: artificial intelligence, brands, campaigns, and what went wrong along the way.",
  },
  tudo: {
    pt: "Os artigos do blog e as notícias da casa: o que aprendemos a trabalhar e o que vai acontecendo na Jelly.",
    en: "Blog articles and news from the house: what we learn at work and what is happening at Jelly.",
  },
};

export function feedDoBlog(locale: Locale): Promise<string> {
  return feed(locale, "blog");
}

export function feedDeTudo(locale: Locale): Promise<string> {
  return feed(locale, "tudo");
}

async function feed(locale: Locale, qual: Qual): Promise<string> {
  // getPosts já vem do mais recente para o mais antigo.
  const posts = (qual === "blog" ? await getPostsDa("blog") : await getPosts()).slice(0, QUANTOS);
  const raiz = SITE_URL.replace(/\/$/, "");
  const base = locale === "en" ? `${raiz}/en` : raiz;
  const ficheiro = qual === "blog" ? "/rss.xml" : "/rss/tudo.xml";
  const endereco = `${base}${ficheiro}`;

  const itens = posts
    .map((post) => {
      // Cada artigo no endereço da sua secção: /blog/… ou /newsroom/….
      const ligacao = `${base}/${seccaoDe(post) === "newsroom" ? "newsroom" : "blog"}/${slugFor(post, locale)}`;
      /* O mesmo resumo que serve a página e a description do Google — já limpo
         dos shortcodes que vieram do WordPress.

         A rede que estava aqui no fim, `|| post.excerpt[locale]`, desfazia o
         trabalho: quando a limpeza dava vazio — que é precisamente o caso dos
         artigos cujo resumo é código do construtor — repunha o código no RSS.
         Esta lista não traz os corpos, por isso não há primeira frase a que
         recorrer; sem resumo, o item vai sem `description`, e um leitor sabe
         lidar com isso melhor do que com `[vc_column column_padding=…]`. */
      const resumo = resumoPublicavel(post.excerpt[locale], post.blocks);
      return [
        "    <item>",
        `      <title>${escapa(post.title[locale])}</title>`,
        `      <link>${escapa(ligacao)}</link>`,
        `      <guid isPermaLink="true">${escapa(ligacao)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        post.category?.[locale] ? `      <category>${escapa(post.category[locale])}</category>` : "",
        post.author?.name ? `      <dc:creator>${escapa(post.author.name)}</dc:creator>` : "",
        // Sem resumo, sem elemento: um `<description>` vazio faz alguns leitores
        // mostrarem uma linha em branco onde devia estar o princípio do artigo.
        resumo ? `      <description>${escapa(resumo)}</description>` : "",
        ...capaDoItem(post, locale),
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/">',
    "  <channel>",
    `    <title>${escapa(TITULO[qual][locale])}</title>`,
    `    <link>${escapa(qual === "blog" ? `${base}/blog` : base)}</link>`,
    `    <description>${escapa(DESCRICAO[qual][locale])}</description>`,
    `    <language>${locale === "en" ? "en" : "pt-pt"}</language>`,
    `    <atom:link href="${escapa(endereco)}" rel="self" type="application/rss+xml" />`,
    posts[0] ? `    <lastBuildDate>${new Date(posts[0].date).toUTCString()}</lastBuildDate>` : "",
    itens,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
