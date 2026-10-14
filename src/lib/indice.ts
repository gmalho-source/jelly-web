import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SheetTile } from "@/components/IndexSheet";
import { SERVICOS_DE_MARKETING } from "@/content/marketing-servicos";
import { PILARES } from "@/content/pilares";
import { SERVICOS_DE_TECNOLOGIA } from "@/content/tecnologia-servicos";
import { getArchivedProjects, getPosts, getProjectGrid, getTemasDosArtigos } from "@/lib/cms";
import { semShortcodes } from "@/lib/resumo";
import { hrefDoArtigo, seccaoDe } from "@/lib/seccao";
import { slugFor } from "@/lib/slugs";

/** Os projetos com capa que o índice mostra na folha; os outros ficam para a procura. */
export const PROJETOS_NA_FOLHA = 3;

/**
 * A ordem dos resultados a procurar: primeiro as páginas — um serviço, uma
 * página da casa —, depois os projetos, depois os artigos. Quem escreve «SEO»
 * quer, antes de mais, a página de SEO; os artigos vêm a seguir.
 */
export const ORDEM = { pagina: 0, projeto: 1, artigo: 2 } as const;

/**
 * Palavras por que as páginas de serviço também se procuram, além do nome, da
 * frase e da descrição. São as que as pessoas escrevem e a página não usa —
 * «multimédia» na de vídeo, «Google» na de SEO.
 */
const TERMOS_DOS_SERVICOS: Record<string, string> = {
  "paid-media": "ads anuncios publicidade google meta facebook instagram linkedin tiktok ppc sem campanhas",
  "seo-geo": "seo geo google pesquisa organico motores chatgpt posicionamento",
  "lead-generation-b2b": "leads b2b prospecao vendas",
  "social-media": "redes sociais instagram facebook linkedin tiktok community",
  "video-audiovisual": "video videos filme filmes multimedia audiovisual audiovisuais producao spot estudio fotografia motion",
  "conteudo-editorial-inbound": "conteudo conteudos blog artigos copy inbound newsletter",
  "influencers-creators-ugc": "influenciadores influencers creators ugc",
  "digital-pr-assessoria-imprensa": "pr imprensa media comunicacao",
  "marketing-automation-lifecycle": "automacao email crm hubspot brevo",
  "analytics-atribuicao-cro": "analytics dados ga4 google tag manager conversao cro",
  "websites-ecommerce": "site sites website loja online ecommerce shopify woocommerce wordpress desenvolvimento web",
  "aplicacoes-web-mobile": "app apps aplicacoes ios android mobile software",
  "crm-cdp-integracoes": "crm cdp pipedrive zoho integracoes dados",
};

/**
 * O que o índice encontra mas não mostra: as páginas de cada serviço, todos os
 * projetos e todos os artigos. Aparecem à primeira letra escrita.
 *
 * Vinham dentro de todas as páginas do site, e eram um quarto dos dados que o
 * React recebia com a homepage. Vivem em `/indice/pt.json` e `/indice/en.json`,
 * e o browser pede-os quando o índice está para abrir (ver `IndexSheet`).
 *
 * Até outubro de 2026 eram só os quarenta artigos mais recentes, pelo título,
 * e os projetos do arquivo — sem os casos escritos nem as páginas dos
 * serviços. «Vídeo» não dava nada e «SEO» dava um artigo. Agora vai tudo, e
 * cada entrada leva as palavras por que se procura: a categoria, as etiquetas
 * e os temas de que o texto trata num artigo (`lib/temas.ts`), as disciplinas
 * de um projeto, a descrição de um serviço.
 */
export async function entradasDaProcura(locale: Locale): Promise<SheetTile[]> {
  const [posts, projetos, arquivo, temas] = await Promise.all([getPosts(), getProjectGrid(), getArchivedProjects(), getTemasDosArtigos()]);
  const pt = locale === "pt";
  const url = (href: Parameters<typeof getPathname>[0]["href"]) => getPathname({ href, locale });

  // Os que já estão na folha — os mesmos três que o SiteHeader mostra — não
  // se repetem na procura.
  const naFolha = new Set(
    arquivo
      .filter((project) => project.cover?.src)
      .slice(0, PROJETOS_NA_FOLHA)
      .map((project) => project.slug),
  );

  const servicos: SheetTile[] = [
    ...SERVICOS_DE_MARKETING.map((servico) => ({
      servico,
      href: url({ pathname: "/servicos/marketing/[sub]", params: { sub: servico.slug[locale] } }),
      mae: "marketing",
    })),
    ...SERVICOS_DE_TECNOLOGIA.map((servico) => ({
      servico,
      href: url({ pathname: "/servicos/tecnologia/[sub]", params: { sub: servico.slug[locale] } }),
      mae: pt ? "tecnologia" : "technology",
    })),
  ].map(({ servico, href, mae }) => ({
    hidden: true,
    label: servico.nome[locale],
    kind: pt ? "serviço" : "service",
    href,
    tone: "bg-slate",
    image: servico.topo?.poster?.src,
    ordem: ORDEM.pagina,
    termos: [mae, servico.claim[locale], servico.descricao[locale], TERMOS_DOS_SERVICOS[servico.slug.pt] ?? ""].join(" "),
  }));

  const pilares: SheetTile[] = PILARES.map((pilar) => ({
    hidden: true,
    // O JellyCARE é um produto com nome: procura-se por ele, não pelo título
    // da página. O guia dos agentes é conhecido pelo título.
    label: pilar.rota === "/jellycare" ? "JellyCARE" : pilar.titulo[locale],
    kind: pilar.rota === "/jellycare" ? (pt ? "manutenção" : "maintenance") : pt ? "guia" : "guide",
    href: url(pilar.rota),
    tone: "bg-slate",
    ordem: ORDEM.pagina,
    termos: `${pilar.titulo[locale]} ${pilar.resumo[locale]} ${pilar.rota.replace(/[/-]/g, " ")}`,
  }));

  const todosOsProjetos: SheetTile[] = projetos
    .filter((project) => !naFolha.has(project.slug))
    .map((project) => ({
      hidden: true,
      label: project.client,
      kind: project.disciplines[0] ?? (pt ? "projeto" : "project"),
      href: url({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }),
      image: project.cover?.src,
      tone: "bg-slate",
      ordem: ORDEM.projeto,
      termos: [project.disciplines.join(" "), project.subtitle ?? "", project.year].join(" "),
    }));

  const artigos: SheetTile[] = posts.map((post) => ({
    hidden: true,
    label: post.title[locale],
    kind: seccaoDe(post) === "newsroom" ? (pt ? "notícia" : "news") : pt ? "artigo" : "article",
    href: url(hrefDoArtigo(post, locale)),
    image: post.cover?.src,
    tone: "bg-slate",
    ordem: ORDEM.artigo,
    termos: [
      post.category?.[locale] ?? "",
      ...(post.tags ?? []).map((etiqueta) => etiqueta.name[locale]),
      // O princípio do resumo: diz do que o artigo trata quando o título não
      // o diz. Curto, para a lista não pesar.
      semShortcodes(post.excerpt[locale]).slice(0, 160),
      // Os temas lidos do texto: o «SEO» de um artigo que só o diz lá dentro.
      temas[post.slug] ?? "",
    ].join(" "),
  }));

  return [...servicos, ...pilares, ...todosOsProjetos, ...artigos];
}
