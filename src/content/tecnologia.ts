import type { Localized } from "./types";

/**
 * A página-mãe de Tecnologia.
 *
 * O site antigo tinha três páginas soltas — web design, aplicações, consultoria
 * e sistemas — e o JellyCARE à parte. Esta é o chapéu: quatro áreas, e o nome
 * de cada uma diz o que lá se faz, sem número ao lado. Houve uma versão com uma
 * unidade de medida por área (% de conversão, retenção, horas, segundos): lia-se
 * como um painel de indicadores à entrada de uma casa onde ainda não se entrou,
 * e caiu.
 *
 * Três áreas têm página construída em `tecnologia-servicos.ts`. A quarta, os
 * sistemas de IA, aponta para a página de Inteligência Artificial: a área existe
 * no mapa porque um cliente de tecnologia procura-a aqui, mas a página é a de
 * lá, e duas páginas a dizer o mesmo seriam duas páginas a desatualizar-se.
 *
 * As fases do método continuam a vir do serviço no painel. As capacidades de
 * cada área ligam todas à página da área: são a lista do que cabe lá dentro,
 * não páginas próprias.
 */

export type AreaDeTecnologia = "web" | "apps" | "dados" | "ia";

export type Capacidade = {
  nome: Localized;
  linha: Localized;
  /*
   * O destino, quando a capacidade tem página só dela. A regra da casa é que as
   * capacidades de uma área levam todas à página da área — são a lista do que
   * cabe lá dentro, não uma lista de páginas. A exceção é para quando a página
   * existe mesmo e está escrita: mandar quem carrega para a lista genérica,
   * tendo a página certa ao lado, seria esconder o que se tem.
   */
  rota?: "/pre-qualificacao-leads-agentes-ia";
};

export type Servico = {
  chave: AreaDeTecnologia;
  /** O slug português da página em `tecnologia-servicos.ts`, quando a há. */
  sub?: string;
  /** O slug do serviço em `site.ts`, quando a área vive fora de Tecnologia. */
  servico?: string;
  nome: Localized;
  titulo: Localized;
  posicao: Localized;
  capacidades: Capacidade[];
  legenda: Localized;
  alcance: Localized;
};

export const tecnologia = {
  eyebrow: { pt: "Serviços · Tecnologia", en: "Services · Technology" },
  /* A pergunta parte-se em duas: o vermelho cai sobre o verbo e o agora, que
     é onde a frase quer o peso. */
  titulo: {
    forte: { pt: "O que vamos", en: "What are we" },
    vermelho: { pt: "criar hoje?", en: "creating today?" },
  },
  lead: {
    pt: "Websites, e-commerce, aplicações e os dados por baixo, desenhados e construídos pela mesma equipa que os vai medir. Quatro áreas, uma arquitetura.",
    en: "Websites, e-commerce, applications and the data underneath, designed and built by the same team that will measure them. Four areas, one architecture.",
  },
  cta: { pt: "Vamos falar", en: "Let's talk" },
  /* Imagens filmadas na Jelly, que era o que faltava aqui: o vídeo anterior era
     de banco e falava de fazer sites — uma das quatro áreas — no topo da página
     que as junta às quatro. Desceu para a página de Websites e E-commerce, que
     é o sítio dele, e este ficou.

     Preparado com a régua nova da casa: 1920 px e CRF 26, sem som, índice à
     cabeça. 12 MB para 3,7. Ver `docs/MOVIMENTO.md` e o `video:prep`. */
  topo: {
    video: "/media/tecnologia-topo.mp4",
    poster: { src: "/media/tecnologia-topo-poster.webp", width: 1920, height: 1084 },
  },
  descricao: {
    pt: "Tecnologia pela Jelly: websites e plataformas de e-commerce, aplicações web e mobile, CRM, CDP e integrações de dados, performance, acessibilidade e migrações sem perder tráfego. Quatro áreas, uma arquitetura.",
    en: "Technology by Jelly: websites and e-commerce platforms, web and mobile applications, CRM, CDP and data integrations, performance, accessibility and migrations without losing traffic. Four areas, one architecture.",
  },

  mapa: { eyebrow: { pt: "O mapa", en: "The map" } },

  areas: {
    eyebrow: { pt: "As áreas", en: "The areas" },
    titulo: { pt: "Quatro áreas. A mesma arquitetura por baixo.", en: "Four areas. The same architecture underneath." },
    nota: {
      pt: "Onde a marca se mostra, o que as pessoas usam, o que a empresa sabe sobre quem compra, e o que passa a correr sozinho. Cada área tem a sua página.",
      en: "Where the brand shows itself, what people use, what the company knows about who buys, and what starts running on its own. Each area has its own page.",
    },
  },

  lista: [
    {
      chave: "web",
      sub: "websites-ecommerce",
      nome: { pt: "Websites e E-commerce", en: "Websites and E-commerce" },
      titulo: { pt: "Um site não é um folheto. É onde a receita entra.", en: "A website is not a brochure. It is where revenue comes in." },
      posicao: {
        pt: "Sites institucionais, lojas online e plataformas à medida, desenhados a partir do conteúdo e construídos com a performance fixada antes do primeiro ecrã.",
        en: "Corporate sites, online stores and bespoke platforms, designed from the content out and built with the performance budget fixed before the first screen.",
      },
      capacidades: [
        { nome: { pt: "Websites institucionais", en: "Corporate websites" }, linha: { pt: "Estrutura, conteúdo e um CMS que a equipa edita sem nos ligar.", en: "Structure, content and a CMS the team edits without calling us." } },
        { nome: { pt: "E-commerce", en: "E-commerce" }, linha: { pt: "Shopify, WooCommerce ou headless, com feed, checkout e medição ligados.", en: "Shopify, WooCommerce or headless, with feed, checkout and measurement wired in." } },
        { nome: { pt: "Plataformas à medida", en: "Bespoke platforms" }, linha: { pt: "Portais, configuradores, leilões, reservas: quando o produto de série não chega.", en: "Portals, configurators, auctions, bookings: when off-the-shelf falls short." } },
        { nome: { pt: "Performance, acessibilidade e migrações", en: "Performance, accessibility and migrations" }, linha: { pt: "Core Web Vitals, WCAG 2.2 e mudar de casa sem perder um visitante. E o JellyCARE depois de publicar.", en: "Core Web Vitals, WCAG 2.2 and moving house without losing a visitor. And JellyCARE after launch." } },
      ],
      legenda: { pt: "Taxa de conversão por etapa, antes e depois", en: "Conversion rate by step, before and after" },
      alcance: { pt: "12 semanas", en: "12 weeks" },
    },
    {
      chave: "apps",
      sub: "aplicacoes-web-mobile",
      nome: { pt: "Aplicações Web e Mobile", en: "Web and Mobile Applications" },
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
      nome: { pt: "Sistemas integrados de Marketing & Vendas (CRM/CDP)", en: "Integrated Marketing & Sales Systems (CRM/CDP)" },
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
      chave: "ia",
      /* A única área cuja página não é construída aqui: leva à página de
         Inteligência Artificial, onde o assunto já está escrito por inteiro. */
      servico: "inteligencia-artificial",
      nome: { pt: "Sistemas IA", en: "AI Systems" },
      titulo: { pt: "O trabalho que passa a fazer-se sozinho, dentro dos sistemas que já tem.", en: "The work that starts doing itself, inside the systems you already run." },
      posicao: {
        pt: "Agentes e automação ligados ao CRM, ao catálogo e ao atendimento. Não é um piloto para mostrar numa reunião: é um processo que fica a correr depois de irmos embora.",
        en: "Agents and automation wired into the CRM, the catalogue and support. Not a pilot to show in a meeting: a process that keeps running after we leave.",
      },
      capacidades: [
        { nome: { pt: "Agentes de IA", en: "AI agents" }, linha: { pt: "Respondem, qualificam e encaminham, com o que não sabem a passar a uma pessoa.", en: "They answer, qualify and route, handing over to a person what they do not know." }, rota: "/pre-qualificacao-leads-agentes-ia" },
        { nome: { pt: "Automação entre sistemas", en: "Automation across systems" }, linha: { pt: "CRM, catálogo, faturação e operações a trocar trabalho, não ficheiros.", en: "CRM, catalogue, invoicing and operations exchanging work, not files." } },
        { nome: { pt: "Diagnóstico e governo", en: "Diagnosis and governance" }, linha: { pt: "Casos de uso ordenados por retorno, com o custo por tarefa à vista desde o primeiro dia.", en: "Use cases ranked by return, with the cost per task in plain sight from day one." } },
      ],
      legenda: { pt: "Tarefas a correr sem ninguém a meio", en: "Tasks running with nobody in the middle" },
      alcance: { pt: "por processo", en: "per process" },
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
    /* Os parceiros vêm da parede "parceiros-tecnologia" no painel: uma lista escrita no código
       obriga a um deploy para acrescentar um selo, e um selo de parceiro
       renova-se. O chapéu fica aqui porque é texto da página, não é conteúdo. */
    parceirosEyebrow: { pt: "Parceiros e stack", en: "Partners and stack" },
  },

  cuidar: {
    eyebrow: { pt: "Depois de publicar", en: "After launch" },
    titulo: { pt: "Um site publicado é um site que começa a envelhecer. O JellyCARE trata disso.", en: "A published site is a site that starts to age. JellyCARE takes care of that." },
    texto: {
      pt: "Manutenção ativa e preventiva, todos os meses: o que se faz é reportado, e o que se evita também. Sem fidelização.",
      en: "Active, preventive maintenance, every month: what gets done is reported, and so is what gets avoided. No lock-in.",
    },
    cta: { pt: "Ver os planos JellyCARE", en: "See the JellyCARE plans" },
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
