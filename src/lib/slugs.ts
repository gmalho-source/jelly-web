import type { Locale } from "@/i18n/routing";

/**
 * Endereços por língua.
 *
 * Um artigo escrito em português tem um título inglês traduzido, e o endereço
 * devia acompanhar: quem procura em inglês não escreve «trafego-pago». O slug
 * português continua a ser a identidade da peça — é ele que está nos links de
 * fora e nos redirecionamentos do site antigo — e o inglês é uma segunda porta.
 *
 * Onde não há slug inglês, o inglês usa o português. É o caso dos projetos: o
 * nome do cliente não se traduz.
 */
export type ComSlug = { slug: string; slugEn?: string };

/** O slug a pôr no endereço, para esta língua. */
export function slugFor(item: ComSlug, locale: Locale) {
  return locale === "en" && item.slugEn ? item.slugEn : item.slug;
}

/** Os dois slugs, para o canónico e o hreflang. */
export function slugsOf(item: ComSlug): Record<Locale, string> {
  return { pt: item.slug, en: item.slugEn || item.slug };
}

/**
 * Encontra a peça por qualquer dos seus endereços. Quem chega pelo endereço da
 * outra língua não leva um 404: a página serve-o e diz ao browser qual é o
 * endereço certo desta língua.
 */
export function findBySlug<T extends ComSlug>(items: T[], slug: string) {
  return items.find((item) => item.slug === slug || item.slugEn === slug);
}
