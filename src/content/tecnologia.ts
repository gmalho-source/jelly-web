import type { Localized } from "./types";

/**
 * A página-mãe de Tecnologia.
 *
 * O site antigo tinha três páginas soltas — web design, aplicações, consultoria
 * e sistemas — e o JellyCARE à parte. Esta é o chapéu: quatro serviços, cada um
 * com a sua unidade de medida, porque um site mede-se pelo que converte, uma
 * app pelo que retém, uma integração pelas horas que devolve e uma migração
 * pelo tráfego que não perde. As fases do método continuam a vir do serviço no
 * painel. As capacidades de cada serviço ligam todas à página do serviço: são a
 * lista do que cabe lá dentro, não páginas próprias.
 */

export type AreaDeTecnologia = "web" | "apps" | "dados" | "performance";

export type Capacidade = {
  nome: Localized;
  linha: Localized;
};

export type Servico = {
  chave: AreaDeTecnologia;
  /** O slug português da página em `tecnologia-servicos.ts`. */
  sub: string;
  nome: Localized;
  medida: Localized;
  medidaNota: Localized;
  titulo: Localized;
  posicao: Localized;
  capacidades: Capacidade[];
  legenda: Localized;
  alcance: Localized;
};

export const tecnologia = {
  eyebrow: { pt: "Serviços · Tecnologia", en: "Services · Technology" },
  titulo: {
    forte: { pt: "Onde a marca vive e a receita entra.", en: "Where the brand lives and revenue comes in." },
    vermelho: { pt: "Construído para durar.", en: "Built to last." },
  },
  lead: {
    pt: "Websites, e-commerce, aplicações e os dados por baixo, desenhados e construídos pela mesma equipa que os vai medir. Quatro serviços, uma arquitetura.",
    en: "Websites, e-commerce, applications and the data underneath, designed and built by the same team that will measure them. Four services, one architecture.",
  },
  cta: { pt: "Falar connosco", en: "Talk to us" },
  /* O vídeo do topo é o da página de web design do site antigo, imagens de
     banco de 2025, recodificado de 5 MB para 1 MB. Provisório: fica até haver
     imagens filmadas na Jelly. */
  topo: {
    video: "/media/tecnologia-topo.mp4",
    poster: { src: "/media/tecnologia-topo-poster.webp", width: 1440, height: 810 },
  },
  descricao: {
    pt: "Tecnologia pela Jelly: websites e plataformas de e-commerce, aplicações web e mobile, CRM, CDP e integrações de dados, performance, acessibilidade e migrações sem perder tráfego. Quatro serviços, uma arquitetura.",
    en: "Technology by Jelly: websites and e-commerce platforms, web and mobile applications, CRM, CDP and data integrations, performance, accessibility and migrations without losing traffic. Four services, one architecture.",
  },

  mapa: { eyebrow: { pt: "O mapa", en: "The map" } },

  areas: {
    eyebrow: { pt: "Os serviços", en: "The services" },
    titulo: { pt: "Quatro serviços. Uma unidade de medida em cada.", en: "Four services. One unit of measure in each." },
    nota: {
      pt: "Um site mede-se pelo que converte, uma app pelo que retém, uma integração pelas horas que devolve, uma migração pelo tráfego que não perde. Cada serviço tem a sua página.",
      en: "A site is measured by what it converts, an app by what it retains, an integration by the hours it gives back, a migration by the traffic it keeps. Each service has its own page.",
    },
  },

  lista: [
    {
      chave: "web",
      sub: "websites-ecommerce",
      nome: { pt: "Websites e E-commerce", en: "Websites and E-commerce" },
      medida: { pt: "% conversão", en: "% conversion" },
      medidaNota: { pt: "de visita a cliente", en: "from visit to customer" },
      titulo: { pt: "Um site não é um folheto. É onde a receita entra.", en: "A website is not a brochure. It is where revenue comes in." },
      posicao: {
        pt: "Sites institucionais, lojas online e plataformas à medida, desenhados a partir do conteúdo e construídos com a performance fixada antes do primeiro ecrã.",
        en: "Corporate sites, online stores and bespoke platforms, designed from the content out and built with the performance budget fixed before the first screen.",
      },
      capacidades: [
        { nome: { pt: "Websites institucionais", en: "Corporate websites" }, linha: { pt: "Estrutura, conteúdo e um CMS que a equipa edita sem nos ligar.", en: "Structure, content and a CMS the team edits without calling us." } },
        { nome: { pt: "E-commerce", en: "E-commerce" }, linha: { pt: "Shopify, WooCommerce ou headless, com feed, checkout e medição ligados.", en: "Shopify, WooCommerce or headless, with feed, checkout and measurement wired in." } },
        { nome: { pt: "Plataformas à medida", en: "Bespoke platforms" }, linha: { pt: "Portais, configuradores, leilões, reservas: quando o produto de série não chega.", en: "Portals, configurators, auctions, bookings: when off-the-shelf falls short." } },
      ],
      legenda: { pt: "Taxa de conversão por etapa, antes e depois", en: "Conversion rate by step, before and after" },
      alcance: { pt: "12 semanas", en: "12 weeks" },
    },
    {
      chave: "apps",
      sub: "aplicacoes-web-mobile",
      nome: { pt: "Aplicações Web e Mobile", en: "Web and Mobile Applications" },
      medida: { pt: "retenção", en: "retention" },
      medidaNota: { pt: "ao trigésimo dia", en: "on day thirty" },
      titulo: { pt: "Uma app só vale o que as pessoas voltam a fazer nela.", en: "An app is only worth what people come back to do in it." },
      posicao: {
        pt: "iOS, Android e web, nativo ou híbrido conforme o projeto pede. Desenhadas para o gesto que se repete e medidas por quem volta.",
        en: "iOS, Android and web, native or hybrid as the project demands. Designed around the gesture that repeats, measured by who returns.",
      },
      capacidades: [
        { nome: { pt: "Apps mobile", en: "Mobile apps" }, linha: { pt: "iOS e Android, nativas ou híbridas, publicadas e mantidas.", en: "iOS and Android, native or hybrid, published and maintained." } },
        { nome: { pt: "Aplicações web", en: "Web applications" }, linha: { pt: "Back-offices, portais de cliente e ferramentas internas que substituem folhas de cálculo.", en: "Back offices, customer portals and internal tools that replace spreadsheets." } },
        { nome: { pt: "Produto e MVP", en: "Product and MVP" }, linha: { pt: "Do protótipo à primeira versão em produção, com utilizadores reais desde cedo.", en: "From prototype to first production release, with real users from early on." } },
      ],
      legenda: { pt: "Utilizadores que voltam, por dia desde a instalação", en: "Returning users, by day since install" },
      alcance: { pt: "D30", en: "D30" },
    },
    {
      chave: "dados",
      sub: "crm-cdp-integracoes",
      nome: { pt: "CRM, CDP e Integrações", en: "CRM, CDP and Integrations" },
      medida: { pt: "horas", en: "hours" },
      medidaNota: { pt: "devolvidas por semana", en: "given back per week" },
      titulo: { pt: "Um cliente, um registo. Marketing, vendas e operações a ler o mesmo.", en: "One customer, one record. Marketing, sales and operations reading the same thing." },
      posicao: {
        pt: "Pipedrive, Zoho e os sistemas que já tem, ligados para que o dado entre uma vez e chegue a todos. Parceiros certificados Pipedrive e Iubenda.",
        en: "Pipedrive, Zoho and the systems you already run, connected so data goes in once and reaches everyone. Certified Pipedrive and Iubenda partners.",
      },
      capacidades: [
        { nome: { pt: "CRM", en: "CRM" }, linha: { pt: "Implementação e parametrização de Pipedrive e Zoho, com os dados antigos migrados.", en: "Pipedrive and Zoho implementation and setup, with legacy data migrated." } },
        { nome: { pt: "CDP e dados de cliente", en: "CDP and customer data" }, linha: { pt: "Um perfil por pessoa, com o consentimento ao lado, a alimentar o marketing.", en: "One profile per person, consent alongside, feeding the marketing." } },
        { nome: { pt: "Integrações e automação", en: "Integrations and automation" }, linha: { pt: "ERP, loja, faturação, e-mail e suporte a falar entre si, sem copiar e colar.", en: "ERP, store, invoicing, email and support talking to each other, no copy-paste." } },
      ],
      legenda: { pt: "Sistemas a escrever no mesmo registo", en: "Systems writing to the same record" },
      alcance: { pt: "1 registo", en: "1 record" },
    },
    {
      chave: "performance",
      sub: "performance-acessibilidade-migracoes",
      nome: { pt: "Performance, Acessibilidade e Migrações", en: "Performance, Accessibility and Migrations" },
      medida: { pt: "segundos", en: "seconds" },
      medidaNota: { pt: "até o conteúdo aparecer", en: "until the content shows" },
      titulo: { pt: "Rápido, acessível e mudado de casa sem perder um visitante.", en: "Fast, accessible and moved house without losing a visitor." },
      posicao: {
        pt: "Core Web Vitals, WCAG e mapas de redirecionamento: a parte do trabalho que ninguém vê e todos sentem. E o JellyCARE para depois de publicar.",
        en: "Core Web Vitals, WCAG and redirect maps: the part of the work nobody sees and everyone feels. And JellyCARE for after launch.",
      },
      capacidades: [
        { nome: { pt: "Performance", en: "Performance" }, linha: { pt: "Orçamento de performance fixado e Core Web Vitals medidos em utilizadores reais.", en: "A fixed performance budget and Core Web Vitals measured on real users." } },
        { nome: { pt: "Acessibilidade", en: "Accessibility" }, linha: { pt: "WCAG 2.2 AA, auditoria e correção, com o European Accessibility Act em vigor.", en: "WCAG 2.2 AA, audit and fixes, with the European Accessibility Act in force." } },
        { nome: { pt: "Migrações sem perder tráfego", en: "Migrations without losing traffic" }, linha: { pt: "Mapa de redirecionamentos, medição antes e depois, vigilância nas primeiras semanas.", en: "Redirect map, before-and-after measurement, close watch in the first weeks." } },
        { nome: { pt: "JellyCARE", en: "JellyCARE" }, linha: { pt: "Manutenção ativa e preventiva: segurança, atualizações, backups e relatório mensal.", en: "Active, preventive maintenance: security, updates, backups and a monthly report." } },
      ],
      legenda: { pt: "Tempo até o conteúdo principal aparecer, por página", en: "Time until the main content shows, by page" },
      alcance: { pt: "LCP", en: "LCP" },
    },
  ] as Servico[],

  metodo: {
    eyebrow: { pt: "O método", en: "The method" },
    titulo: { pt: "Quatro fases. A arquitetura primeiro.", en: "Four phases. Architecture first." },
    nota: { pt: "O mesmo processo para uma landing page ou para uma plataforma de três anos.", en: "The same process for a landing page or for a three-year platform." },
  },

  trabalho: {
    eyebrow: { pt: "Trabalho", en: "Work" },
    titulo: { pt: "Plataformas que carregam negócios.", en: "Platforms that carry businesses." },
    todos: { pt: "Ver todos os projetos", en: "See all projects" },
    /* Quando o serviço no painel não escolher casos, são estes: projetos com
       narrativa escrita e desenvolvimento na disciplina — uma loja, um
       personalizador, uma plataforma financeira, uma app e um leilão online. */
    casos: ["agriloja", "decathlon", "unicambio", "take1-mobile-app", "artbid"],
    parceirosEyebrow: { pt: "Parceiros e stack", en: "Partners and stack" },
    parceiros: ["Pipedrive Partner", "Iubenda Certified Partner", "Shopify", "WooCommerce", "WordPress", "Zoho", "Google Workspace", "Next.js", "Payload CMS", "Vercel"],
  },

  cuidar: {
    eyebrow: { pt: "Depois de publicar", en: "After launch" },
    titulo: { pt: "Um site publicado é um site que começa a envelhecer. O JellyCARE trata disso.", en: "A published site is a site that starts to age. JellyCARE takes care of that." },
    texto: {
      pt: "Manutenção ativa e preventiva, todos os meses: o que se faz é reportado, e o que se evita também. Sem fidelização.",
      en: "Active, preventive maintenance, every month: what gets done is reported, and so is what gets avoided. No lock-in.",
    },
    cta: { pt: "Ver Performance e Manutenção", en: "See Performance and Maintenance" },
    itens: [
      { nome: { pt: "Checkup diário de segurança e malware", en: "Daily security and malware checkup" }, area: { pt: "Segurança", en: "Security" } },
      { nome: { pt: "Atualização de temas, plugins e dependências", en: "Theme, plugin and dependency updates" }, area: { pt: "Atualizações", en: "Updates" } },
      { nome: { pt: "Monitor de disponibilidade e backups diários na cloud", en: "Uptime monitor and daily cloud backups" }, area: { pt: "Continuidade", en: "Continuity" } },
      { nome: { pt: "Links quebrados, base de dados e relatório mensal", en: "Broken links, database and a monthly report" }, area: { pt: "Higiene", en: "Hygiene" } },
    ],
  },

  fecho: {
    titulo: { pt: "Tem um site, uma app ou um CRM que já não acompanha o negócio?", en: "Is there a site, an app or a CRM that no longer keeps up with the business?" },
    texto: { pt: "Conte-nos o que está a travar. Respondemos com uma primeira leitura técnica, antes de qualquer proposta.", en: "Tell us what is holding you back. We answer with a first technical reading, before any proposal." },
    cta: { pt: "Começar uma conversa", en: "Start a conversation" },
  },
} as const;
