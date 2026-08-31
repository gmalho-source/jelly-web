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
    "/imunidade-algoritmica": { pt: "/imunidade-algoritmica", en: "/algorithmic-immunity" },
    // Página pilar: vive debaixo da Inteligência Artificial e chega-se lá por
    // uma chamada nessa página. O endereço é de raiz, como o da Imunidade — as
    // duas páginas longas desta casa vivem à mesma altura, e a hierarquia
    // dizem-na as migalhas e não o caminho.
    "/pre-qualificacao-leads-agentes-ia": {
      pt: "/pre-qualificacao-leads-agentes-ia",
      en: "/ai-lead-pre-qualification",
    },
    "/equipa": { pt: "/equipa", en: "/team" },
    "/equipa/[slug]": { pt: "/equipa/[slug]", en: "/team/[slug]" },
    "/recrutamento": { pt: "/recrutamento", en: "/careers" },
    "/recrutamento/[slug]": { pt: "/recrutamento/[slug]", en: "/careers/[slug]" },
    "/legal/[slug]": { pt: "/legal/[slug]", en: "/legal/[slug]" },
    // As comunicações da Jelly: a página onde se subscreve, e o link que
    // confirma a subscrição.
    "/subscrever": { pt: "/subscrever", en: "/subscribe" },
    "/subscrever/[token]": { pt: "/subscrever/[token]", en: "/subscribe/[token]" },
    // O link que vai na carta a quem se candidatou por fora do formulário.
    "/confirmar-candidatura/[token]": { pt: "/confirmar-candidatura/[token]", en: "/confirm-application/[token]" },
  },
});

export type Locale = (typeof routing.locales)[number];
