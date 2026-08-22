import { envOr } from "@/lib/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

export const SITE_URL = envOr(process.env.NEXT_PUBLIC_SITE_URL, "https://www.jelly.pt").replace(/\/$/, "");

/** O domínio público do site. Tudo o que não é isto é staging ou preview. */
export const PRODUCTION_URL = "https://www.jelly.pt";

/**
 * Staging e previews ficam fora do Google. Sem isto, jelly-web-pi.vercel.app
 * competia com o jelly.pt pelas mesmas páginas — conteúdo duplicado contra o
 * próprio cliente.
 */
export const isIndexable = SITE_URL === PRODUCTION_URL;

type Href = Parameters<typeof getPathname>[0]["href"];

/** O endereço pode mudar de língua para língua: o slug de um artigo muda. */
type HrefPorLingua = Href | ((locale: Locale) => Href);

const resolve = (href: HrefPorLingua, locale: Locale) => (typeof href === "function" ? href(locale) : href);

/**
 * Canónico e hreflang para as duas árvores. Uma página sem isto é uma página
 * que o Google não sabe emparelhar — foi um dos defeitos do site antigo.
 *
 * Quando o slug é traduzido, passa-se uma função em vez de um endereço: o
 * hreflang tem de apontar para o endereço inglês da peça, não para o português
 * dentro da árvore inglesa.
 */
export function alternates(href: HrefPorLingua, locale: Locale) {
  const languages = Object.fromEntries(
    routing.locales.map((candidate) => [
      candidate === "pt" ? "pt-PT" : "en",
      SITE_URL + getPathname({ href: resolve(href, candidate), locale: candidate }),
    ]),
  );

  return {
    canonical: SITE_URL + getPathname({ href: resolve(href, locale), locale }),
    languages: {
      ...languages,
      "x-default": SITE_URL + getPathname({ href: resolve(href, routing.defaultLocale), locale: routing.defaultLocale }),
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Jelly",
    alternateName: "Jelly Digital Agency",
    url: SITE_URL,
    slogan: "be the change",
    foundingDate: "2010",
    email: "hello@jelly.pt",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Dom João V, 29C",
      postalCode: "1250-091",
      addressLocality: "Lisboa",
      addressCountry: "PT",
    },
    knowsAbout: ["Branding", "Marketing digital", "Paid media", "SEO", "Inteligência artificial", "E-commerce", "CRM"],
  };
}
