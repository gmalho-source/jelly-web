import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["pt", "en"],
  defaultLocale: "pt",
  // PT na raiz (jelly.pt/projetos), EN prefixado (jelly.pt/en/work)
  localePrefix: "as-needed",
  // Slugs traduzidos: duas árvores completas, não tradução por cima.
  pathnames: {
    "/": "/",
    "/projetos": { pt: "/projetos", en: "/work" },
    "/projetos/[slug]": { pt: "/projetos/[slug]", en: "/work/[slug]" },
  },
});

export type Locale = (typeof routing.locales)[number];
