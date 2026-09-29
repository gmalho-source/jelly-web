import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { SheetTile } from "@/components/IndexSheet";
import { getArchivedProjects, getPosts } from "@/lib/cms";
import { slugFor } from "@/lib/slugs";

/** Os projetos com capa que o índice mostra na folha; os outros ficam para a procura. */
export const PROJETOS_NA_FOLHA = 3;

/**
 * O que o índice encontra mas não mostra: os projetos que não cabem na folha e
 * os artigos, até quarenta de cada. Aparecem à primeira letra escrita.
 *
 * Vinham dentro de todas as páginas do site — setenta e sete entradas, cada uma
 * com nome, endereço e imagem — para servirem só a quem abrisse o índice e
 * escrevesse alguma coisa. Era um quarto dos dados que o React recebia com a
 * homepage, lidos pelo telemóvel antes de ela aparecer. Agora vivem em
 * `/indice/pt.json` e `/indice/en.json`, e o browser pede-os quando o índice está
 * para abrir (ver `IndexSheet`).
 */
export async function entradasDaProcura(locale: Locale): Promise<SheetTile[]> {
  const [posts, archive] = await Promise.all([getPosts(), getArchivedProjects()]);
  const pt = locale === "pt";
  const url = (href: Parameters<typeof getPathname>[0]["href"]) => getPathname({ href, locale });
  const withCover = archive.filter((project) => project.cover?.src);

  return [
    ...withCover.slice(PROJETOS_NA_FOLHA, 40).map((project) => ({
      hidden: true,
      label: project.client,
      kind: project.disciplines[0] ?? (pt ? "projeto" : "project"),
      href: url({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }),
      image: project.cover!.src,
    })),
    ...posts.slice(0, 40).map((post) => ({
      hidden: true,
      label: post.title[locale],
      kind: pt ? "artigo" : "article",
      href: url({ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }),
      image: post.cover?.src,
      tone: "bg-slate",
    })),
  ];
}
