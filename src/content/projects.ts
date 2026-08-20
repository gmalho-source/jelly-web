import type { Project } from "./types";

/**
 * Conteúdo local, a servir de seed e de fallback.
 * Quando o Sanity estiver ligado (NEXT_PUBLIC_SANITY_PROJECT_ID), passa a vir de lá.
 * Os números têm de ser validados com o cliente antes de publicar.
 */
export const projects: Project[] = [
  {
    slug: "adegamae",
    client: "Adegamãe",
    year: "2025 — 2026",
    order: 1,
    title: {
      pt: "Vender vinho como se conta uma história",
      en: "Selling wine the way you tell a story",
    },
    summary: {
      pt: "A Adegamãe tinha uma loja online que funcionava como catálogo. Reconstruímos a plataforma, o discurso e a captação de conteúdo à volta de uma ideia simples: quem compra vinho quer saber de onde vem.",
      en: "Adegamãe had an online store that behaved like a catalogue. We rebuilt the platform, the narrative and the content production around one simple idea: people who buy wine want to know where it comes from.",
    },
    disciplines: { pt: "Brand digital, e-commerce, conteúdos", en: "Digital brand, e-commerce, content" },
    team: { pt: "6 pessoas · 5 meses", en: "6 people · 5 months" },
    headline: { value: "+38%", label: { pt: "Receita online, ano sobre ano", en: "Online revenue, year over year" } },
    kpis: [
      { value: "2,9×", label: { pt: "Taxa de conversão da loja", en: "Store conversion rate" } },
      { value: "−41%", label: { pt: "Custo de aquisição por cliente", en: "Customer acquisition cost" } },
    ],
    quote: {
      text: {
        pt: "Deixámos de ter uma loja e passámos a ter um sítio onde as pessoas ficam.",
        en: "We stopped having a store and started having a place where people stay.",
      },
      author: "Rita Sequeira",
      role: { pt: "Marketing, Adegamãe", en: "Marketing, Adegamãe" },
    },
  },
  {
    slug: "321-credito",
    client: "321 Crédito",
    year: "2024 — 2026",
    order: 2,
    title: {
      pt: "Menos custo por lead, mais leads certas",
      en: "Lower cost per lead, more of the right leads",
    },
    summary: {
      pt: "Reconstruímos o funil de paid media de cima a baixo e ligámos as campanhas ao CRM, para deixar de otimizar cliques e passar a otimizar contratos.",
      en: "We rebuilt the paid media funnel end to end and connected campaigns to the CRM, so the optimisation target moved from clicks to signed contracts.",
    },
    disciplines: { pt: "Paid media full-funnel, CRM", en: "Full-funnel paid media, CRM" },
    team: { pt: "4 pessoas · em curso", en: "4 people · ongoing" },
    headline: { value: "−27%", label: { pt: "Custo por lead qualificada", en: "Cost per qualified lead" } },
    kpis: [
      { value: "+34%", label: { pt: "Leads que chegam a contrato", en: "Leads reaching contract" } },
      { value: "18,40€", label: { pt: "Custo por lead atual", en: "Current cost per lead" } },
    ],
  },
  {
    slug: "defined-ai",
    client: "Defined.ai",
    year: "2025",
    order: 3,
    title: {
      pt: "Não se pede em casamento no primeiro encontro",
      en: "You don't propose on the first date",
    },
    summary: {
      pt: "Demand gen para um ciclo de venda longo, com conteúdo técnico e agentes de IA a qualificar e a encaminhar contactos antes de chegarem a comercial.",
      en: "Demand gen for a long sales cycle, with technical content and AI agents qualifying and routing contacts before they reach sales.",
    },
    disciplines: { pt: "Demand gen, conteúdos, agentes de IA", en: "Demand gen, content, AI agents" },
    team: { pt: "5 pessoas · 8 meses", en: "5 people · 8 months" },
    headline: { value: "4,1×", label: { pt: "Retorno sobre investimento em media", en: "Return on media spend" } },
    kpis: [{ value: "−52%", label: { pt: "Tempo até primeira reunião", en: "Time to first meeting" } }],
  },
  {
    slug: "evidensia",
    client: "Evidensia",
    year: "2024 — 2026",
    order: 4,
    title: {
      pt: "Quarenta clínicas, quarenta mercados locais",
      en: "Forty clinics, forty local markets",
    },
    summary: {
      pt: "Estratégia de local search e paid por clínica, com agenda inteligente a distribuir a procura pelas unidades com disponibilidade.",
      en: "Local search and paid strategy per clinic, with smart scheduling spreading demand across the units that have capacity.",
    },
    disciplines: { pt: "Local SEO, paid media, automação", en: "Local SEO, paid media, automation" },
    team: { pt: "3 pessoas · em curso", en: "3 people · ongoing" },
    headline: { value: "+61%", label: { pt: "Marcações vindas de canais digitais", en: "Bookings from digital channels" } },
    kpis: [{ value: "40", label: { pt: "Clínicas com campanhas próprias", en: "Clinics with their own campaigns" } }],
  },
  {
    slug: "slide-splash",
    client: "Slide & Splash",
    year: "2025",
    order: 5,
    title: {
      pt: "Um verão inteiro numa campanha",
      en: "A whole summer in one campaign",
    },
    summary: {
      pt: "Campanha de verão com produção de conteúdo no parque, distribuição paga em quatro mercados e medição diária de bilhetes vendidos.",
      en: "Summer campaign with on-site content production, paid distribution across four markets and daily ticket-sales measurement.",
    },
    disciplines: { pt: "Campanha, conteúdos, paid media", en: "Campaign, content, paid media" },
    team: { pt: "7 pessoas · 4 meses", en: "7 people · 4 months" },
    headline: { value: "2,4M", label: { pt: "Pessoas alcançadas em quatro mercados", en: "People reached across four markets" } },
    kpis: [{ value: "+19%", label: { pt: "Bilhetes vendidos online", en: "Tickets sold online" } }],
  },
];
