import type { NewsItem, Post } from "./types";

/**
 * Artigos com título, data e categoria reais do jelly.pt. Os corpos estão
 * marcados como rascunho: entram por migração do conteúdo existente, não são
 * texto final da Jelly.
 */
export const posts: Post[] = [
  {
    slug: "ia-no-marketing-digital",
    date: "2026-07-17",
    category: { pt: "Inteligência artificial", en: "Artificial intelligence" },
    author: "Gonçalo Malho Rodrigues",
    readingMinutes: 7,
    title: {
      pt: "Como a IA está a transformar o marketing digital",
      en: "How AI is transforming digital marketing",
    },
    excerpt: {
      pt: "Não é sobre substituir equipas. É sobre o que passa a ser possível medir, testar e decidir em horas em vez de trimestres.",
      en: "It is not about replacing teams. It is about what becomes possible to measure, test and decide in hours instead of quarters.",
    },
    body: [
      {
        pt: "Durante quinze anos, a pergunta que mais ouvimos de um cliente foi “quanto é que isto me dá?”. A resposta honesta era sempre a mesma: depende do tempo que estivermos dispostos a esperar pelos dados. Com IA, essa espera encurtou de trimestres para dias — e é aí que está a transformação real, não nos textos gerados automaticamente.",
        en: "For fifteen years, the question we heard most from clients was “what does this give me?”. The honest answer was always the same: it depends how long we are willing to wait for the data. With AI that wait shrank from quarters to days — and that is where the real change is, not in automatically generated copy.",
      },
      {
        pt: "O que mudou não foi a criatividade. Foi a velocidade do ciclo entre hipótese, teste e decisão. Uma equipa que antes testava quatro variações de campanha por mês testa agora quarenta, com leitura estatística ao fim de 48 horas.",
        en: "What changed was not creativity. It was the speed of the cycle between hypothesis, test and decision. A team that used to test four campaign variations a month now tests forty, with a statistical read within 48 hours.",
      },
      {
        pt: "A conclusão prática para quem gere marketing: antes de comprar ferramentas, arrume os dados e defina quem decide. A IA amplifica o processo que já existe — incluindo o que está mal.",
        en: "The practical conclusion for anyone running marketing: before buying tools, tidy the data and decide who decides. AI amplifies the process you already have — including the broken parts.",
      },
    ],
    draft: true,
  },
  {
    slug: "agentes-de-ia-no-atendimento-24h",
    date: "2026-08-04",
    category: { pt: "Inteligência artificial", en: "Artificial intelligence" },
    author: "Equipa Jelly",
    readingMinutes: 9,
    title: {
      pt: "Agentes de IA no atendimento ao cliente 24h: guia prático",
      en: "AI agents in 24h customer service: a practical guide",
    },
    excerpt: {
      pt: "Onde é que um agente responde melhor do que uma pessoa, onde é que não deve responder, e como medir a diferença.",
      en: "Where an agent answers better than a person, where it should not answer at all, and how to measure the difference.",
    },
    draft: true,
  },
  {
    slug: "trafego-pago-para-e-commerce",
    date: "2026-07-20",
    category: { pt: "Performance", en: "Performance" },
    author: "Equipa Jelly",
    readingMinutes: 8,
    title: {
      pt: "Tráfego pago para e-commerce: guia prático para vender mais",
      en: "Paid traffic for e-commerce: a practical guide to selling more",
    },
    excerpt: {
      pt: "A ordem certa das decisões: medição, margem, criativos, e só depois orçamento.",
      en: "The right order of decisions: measurement, margin, creative — and only then budget.",
    },
    draft: true,
  },
  {
    slug: "imunidade-algoritmica",
    date: "2026-07-10",
    category: { pt: "SEO e GEO", en: "SEO and GEO" },
    author: "Equipa Jelly",
    readingMinutes: 6,
    title: {
      pt: "Imunidade algorítmica: quando a autoridade da marca torna o SEO inevitável",
      en: "Algorithmic immunity: when brand authority makes SEO inevitable",
    },
    excerpt: {
      pt: "Marcas que as pessoas procuram pelo nome sofrem menos com cada atualização de algoritmo. Não é sorte: é construção.",
      en: "Brands people search for by name suffer less with every algorithm update. That is not luck: it is construction.",
    },
    draft: true,
  },
  {
    slug: "seo-sem-cliques",
    date: "2026-07-05",
    category: { pt: "SEO e GEO", en: "SEO and GEO" },
    author: "Equipa Jelly",
    readingMinutes: 5,
    title: {
      pt: "SEO sem cliques: o que a evidência diz e como reagir",
      en: "Zero-click SEO: what the evidence says and how to react",
    },
    excerpt: {
      pt: "Se a resposta aparece no motor de busca, o tráfego cai e a marca continua a ganhar. Como medir isso sem enganar ninguém.",
      en: "When the answer shows up in the engine, traffic drops and the brand still wins. How to measure that without fooling anyone.",
    },
    draft: true,
  },
  {
    slug: "como-gerar-leads-qualificados",
    date: "2026-07-08",
    category: { pt: "Performance", en: "Performance" },
    author: "Equipa Jelly",
    readingMinutes: 6,
    title: {
      pt: "Como gerar leads qualificados com marketing digital",
      en: "How to generate qualified leads with digital marketing",
    },
    excerpt: {
      pt: "Qualificar é dizer não depressa. O funil que devolve menos leads e mais contratos.",
      en: "Qualifying means saying no quickly. The funnel that returns fewer leads and more contracts.",
    },
    draft: true,
  },
];

/** Notícias, eventos e press reais do jelly.pt. */
export const news: NewsItem[] = [
  {
    slug: "premios-herois-pme-cnn",
    date: "2026-07-09",
    kind: "press",
    title: {
      pt: "8.ª Edição dos Prémios Heróis PME na CNN Portugal",
      en: "8th edition of the Heróis PME awards on CNN Portugal",
    },
    outlet: "CNN Portugal",
  },
  {
    slug: "herois-pme-8a-edicao",
    date: "2026-07-06",
    kind: "noticia",
    title: {
      pt: "Prémios Heróis PME distinguem os melhores do tecido empresarial português",
      en: "Heróis PME awards recognise the best of Portuguese business",
    },
    summary: {
      pt: "A Jelly é agência parceira da iniciativa, responsável pela comunicação da 8.ª edição.",
      en: "Jelly is the partner agency for the initiative, responsible for communicating the 8th edition.",
    },
  },
  {
    slug: "parceria-informa-db",
    date: "2026-06-18",
    kind: "noticia",
    title: {
      pt: "Jelly faz parceria inédita com a Informa D&B",
      en: "Jelly announces first-of-its-kind partnership with Informa D&B",
    },
    summary: {
      pt: "Estratégia digital assente em dados de mercado para acelerar o crescimento de vendas dos clientes.",
      en: "Digital strategy built on market data to accelerate client sales growth.",
    },
  },
  {
    slug: "nova-equipa-de-gestao",
    date: "2026-05-14",
    kind: "noticia",
    title: {
      pt: "Jelly anuncia nova equipa de gestão e plano estratégico a cinco anos",
      en: "Jelly announces new management team and five-year strategic plan",
    },
  },
  {
    slug: "prr-ia-nas-pme",
    date: "2026-04-22",
    kind: "evento",
    title: {
      pt: "PRR — Inteligência Artificial nas PME: candidaturas abertas",
      en: "PRR — Artificial Intelligence in SMEs: applications open",
    },
    summary: {
      pt: "Sessão de esclarecimento sobre o apoio à adoção de IA, com a equipa de consultoria da Jelly.",
      en: "Briefing session on support for AI adoption, with Jelly's consulting team.",
    },
  },
  {
    slug: "diretiva-acessibilidade-web",
    date: "2026-03-11",
    kind: "noticia",
    title: {
      pt: "Diretiva Europeia da Acessibilidade Web: o que muda para as marcas",
      en: "European Web Accessibility Directive: what changes for brands",
    },
  },
];
