import type { Locale } from "@/i18n/routing";
import { slugFor } from "./slugs";

/**
 * As duas secções da coleção de artigos: o blog — a voz editorial da casa,
 * opinião e método — e o newsroom — a casa a falar de si, anúncios, eventos,
 * imprensa. O campo «Onde aparece» no painel decide; vazio, é blog.
 *
 * Vive à parte das páginas para as rotas de servidor (sitemap, llms.txt,
 * índice) saberem o endereço de um artigo sem trazerem a página consigo.
 */
export type Seccao = "blog" | "newsroom";

export function seccaoDe(post: { seccao?: string }): Seccao {
  return post.seccao === "newsroom" ? "newsroom" : "blog";
}

export const ROTA_DO_ARTIGO = { blog: "/blog/[slug]", newsroom: "/newsroom/[slug]" } as const;

/** O endereço de um artigo, na secção dele e na língua pedida. */
export function hrefDoArtigo(post: { slug: string; slugEn?: string; seccao?: string }, locale: Locale) {
  return { pathname: ROTA_DO_ARTIGO[seccaoDe(post)], params: { slug: slugFor(post, locale) } };
}
