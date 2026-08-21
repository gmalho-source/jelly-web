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

/**
 * Canónico e hreflang para as duas árvores. Uma página sem isto é uma página
 * que o Google não sabe emparelhar — foi um dos defeitos do site antigo.
 */
export function alternates(href: Href, locale: Locale) {
  const languages = Object.fromEntries(
    routing.locales.map((candidate) => [
      candidate === "pt" ? "pt-PT" : "en",
      SITE_URL + getPathname({ href, locale: candidate }),
    ]),
  );

  return {
    canonical: SITE_URL + getPathname({ href, locale }),
    languages: { ...languages, "x-default": SITE_URL + getPathname({ href, locale: routing.defaultLocale }) },
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
    email: "geral@jelly.pt",
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
