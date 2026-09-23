import { envOr } from "@/lib/env";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";

/** O domínio público do site. Tudo o que não é isto é staging ou preview. */
export const PRODUCTION_URL = "https://www.jelly.pt";

/**
 * O endereço com que o site fala de si próprio: canónicos, hreflang, sitemap,
 * imagens de partilha.
 *
 * Numa implantação de produção na Vercel é o domínio público, e ponto — não se
 * pergunta a uma variável de ambiente. Perguntava, e a variável ficou no
 * endereço de pré-visualização no dia em que o www passou para cá. O site
 * esteve no ar a dizer `noindex, nofollow` em todas as páginas, com o
 * `robots.txt` a proibir o rastreio inteiro, com todos os canónicos a apontar
 * para o `.vercel.app` e com as 428 entradas do sitemap no domínio errado.
 * Ninguém deu por isso, porque nada falha: o site abre, está bonito, e é
 * invisível.
 *
 * Fora da produção — pré-visualizações e a máquina de quem desenvolve — vale a
 * variável, que é onde ela serve mesmo: ali o endereço muda a cada implantação
 * e não há constante que o saiba.
 */
const CONFIGURADO = envOr(process.env.NEXT_PUBLIC_SITE_URL, PRODUCTION_URL).replace(/\/$/, "");

export const SITE_URL = process.env.VERCEL_ENV === "production" ? PRODUCTION_URL : CONFIGURADO;

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
    legalName: "Jelly - Digital Agency & AI, Lda.",
    vatID: "PT509686605",
    url: SITE_URL,
    slogan: "be the change",
    foundingDate: "2010",
    email: "hello@jelly.pt",
    telephone: "+351915098769",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Rua Dom João V, 29C",
      postalCode: "1250-089",
      addressLocality: "Lisboa",
      addressCountry: "PT",
    },
    knowsAbout: ["Branding", "Marketing digital", "Paid media", "SEO", "Inteligência artificial", "E-commerce", "CRM"],
  };
}
