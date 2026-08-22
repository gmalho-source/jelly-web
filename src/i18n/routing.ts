import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  // PT na raiz (jelly.pt/projetos), EN prefixado (jelly.pt/en/work)
  localePrefix: "as-needed",
  // A casa é portuguesa: quem chega a jelly.pt fica em português, mesmo com o
  // browser em inglês. Sem isto o next-intl lia o Accept-Language e mandava
  // metade das visitas para /en sem ninguém pedir.
  localeDetection: false,
  // Slugs traduzidos: duas árvores completas, não tradução por cima.
  pathnames: {
    "/": "/",
    "/sobre": { pt: "/sobre", en: "/about" },
    "/servicos": { pt: "/servicos", en: "/services" },
    "/servicos/[slug]": { pt: "/servicos/[slug]", en: "/services/[slug]" },
    "/projetos": { pt: "/projetos", en: "/work" },
    "/projetos/[slug]": { pt: "/projetos/[slug]", en: "/work/[slug]" },
    "/clientes": { pt: "/clientes", en: "/clients" },
    "/blog": { pt: "/blog", en: "/blog" },
    "/blog/[slug]": { pt: "/blog/[slug]", en: "/blog/[slug]" },
    "/newsroom": { pt: "/newsroom", en: "/newsroom" },
    "/contactos": { pt: "/contactos", en: "/contact" },
    "/legal/[slug]": { pt: "/legal/[slug]", en: "/legal/[slug]" },
  },
});

export type Locale = (typeof routing.locales)[number];
