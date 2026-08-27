import type { Client, Service, TeamMember } from "./types";

export const services: Service[] = [
  {
    slug: "branding",
    name: { pt: "Branding", en: "Branding" },
    claim: {
      pt: "Identidade, posicionamento e narrativa para marcas que precisam de ser reconhecíveis antes de serem lembradas.",
      en: "Identity, positioning and narrative for brands that need to be recognisable before they can be remembered.",
    },
    link: { pt: "Brand", en: "Brand" },
    promise: {
      pt: "Uma marca não é um logo. É a decisão de o que dizer, a quem, e o que deixar de dizer.",
      en: "A brand is not a logo. It is deciding what to say, to whom, and what to stop saying.",
    },
    includes: [
      { pt: "Posicionamento e arquitetura de marca", en: "Positioning and brand architecture" },
      { pt: "Identidade visual e design system", en: "Visual identity and design system" },
      { pt: "Narrativa, tom de voz e naming", en: "Narrative, tone of voice and naming" },
      { pt: "Manuais, templates e ativação interna", en: "Guidelines, templates and internal rollout" },
    ],
    phases: [
      { name: { pt: "Diagnóstico", en: "Diagnosis" }, body: { pt: "Entrevistas, análise de concorrência e leitura do que a marca já significa hoje para quem compra.", en: "Interviews, competitive analysis and a read on what the brand already means to buyers today." } },
      { name: { pt: "Território", en: "Territory" }, body: { pt: "Uma decisão de posicionamento, escrita numa frase, com o que fica de fora explicitado.", en: "One positioning decision, written in a single sentence, with what stays out made explicit." } },
      { name: { pt: "Sistema", en: "System" }, body: { pt: "Identidade, tipografia, cor, imagem e componentes — tudo em tokens, pronto a entrar em produto.", en: "Identity, type, colour, imagery and components — all as tokens, ready to ship in product." } },
      { name: { pt: "Ativação", en: "Rollout" }, body: { pt: "Formação das equipas e primeiros materiais em circulação. Uma marca só existe quando é usada.", en: "Team training and the first materials in circulation. A brand only exists once it is used." } },
    ],
    caseSlugs: ["unicambio", "agriloja"],
  },
  {
    slug: "marketing",
    name: { pt: "Marketing", en: "Marketing" },
    claim: {
      pt: "Dados, criatividade e cadência. Tráfego, leads e vendas com o número sempre ao lado da ideia.",
      en: "Data, creativity and cadence. Traffic, leads and sales with the number next to the idea.",
    },
    link: { pt: "Performance", en: "Performance" },
    promise: {
      pt: "Não otimizamos cliques. Otimizamos o que acontece depois do clique.",
      en: "We don't optimise clicks. We optimise what happens after the click.",
    },
    includes: [
      { pt: "Estratégia full-funnel e media plan", en: "Full-funnel strategy and media planning" },
      { pt: "Paid media (Google, Meta, LinkedIn, TikTok)", en: "Paid media (Google, Meta, LinkedIn, TikTok)" },
      { pt: "SEO e GEO — otimização para busca e para agentes", en: "SEO and GEO — search and generative engine optimisation" },
      { pt: "Conteúdos, social e produção audiovisual", en: "Content, social and video production" },
    ],
    phases: [
      { name: { pt: "Linha de base", en: "Baseline" }, body: { pt: "Medição limpa antes de gastar um euro: eventos, atribuição e o número de partida.", en: "Clean measurement before spending a euro: events, attribution and the starting number." } },
      { name: { pt: "Hipóteses", en: "Hypotheses" }, body: { pt: "Cinco a dez apostas ordenadas por retorno esperado, não por gosto.", en: "Five to ten bets ranked by expected return, not by taste." } },
      { name: { pt: "Cadência", en: "Cadence" }, body: { pt: "Ciclos curtos: testar, ler, decidir. Relatório semanal com o que muda na semana seguinte.", en: "Short cycles: test, read, decide. A weekly report with what changes next week." } },
      { name: { pt: "Escala", en: "Scale" }, body: { pt: "O que funciona ganha orçamento; o que não funciona morre depressa e sem drama.", en: "What works gets budget; what doesn't dies quickly and without drama." } },
    ],
    caseSlugs: ["vorwerk", "nuk"],
  },
  {
    slug: "inteligencia-artificial",
    slugEn: "artificial-intelligence",
    name: { pt: "Inteligência artificial", en: "Artificial intelligence" },
    claim: {
      pt: "Da consultoria à implementação de agentes e automação que ficam a correr sozinhos na sua operação.",
      en: "From consulting to shipping agents and automation that keep running inside your operation.",
    },
    link: { pt: "IA", en: "AI" },
    promise: {
      pt: "IA que sai da apresentação e entra na operação. Não vendemos pilotos: vendemos processos que passam a correr sozinhos.",
      en: "AI that leaves the deck and enters the operation. We don't sell pilots: we ship processes that keep running.",
    },
    includes: [
      { pt: "Diagnóstico de casos de uso por retorno", en: "Use-case diagnosis ranked by return" },
      { pt: "Agentes de atendimento, qualificação e apoio interno", en: "Agents for support, qualification and internal help" },
      { pt: "Automação entre CRM, catálogo e operações", en: "Automation across CRM, catalogue and operations" },
      { pt: "Governo, custo por tarefa e formação das equipas", en: "Governance, cost per task and team training" },
    ],
    phases: [
      { name: { pt: "Diagnóstico", en: "Diagnosis" }, body: { pt: "Duas semanas a mapear processos, dados e fricção. Sai uma lista ordenada por retorno.", en: "Two weeks mapping processes, data and friction. Out comes a list ranked by return." } },
      { name: { pt: "Piloto", en: "Pilot" }, body: { pt: "Um caso de uso em produção, com métrica definida à cabeça. Sem comité, sem PowerPoint.", en: "One use case in production, with the metric agreed up front. No committee, no slides." } },
      { name: { pt: "Escala", en: "Scale" }, body: { pt: "Agentes ligados ao CRM, ao catálogo e ao suporte, com custo por tarefa à vista.", en: "Agents connected to CRM, catalogue and support, with cost per task in plain sight." } },
      { name: { pt: "Autonomia", en: "Autonomy" }, body: { pt: "Formação da sua equipa. O objetivo é deixarmos de ser necessários para operar.", en: "Training your team. The goal is for us to stop being needed to operate it." } },
    ],
    caseSlugs: ["informa-db", "vorwerk"],
    accent: "lavender",
  },
  {
    slug: "tecnologia",
    slugEn: "technology",
    name: { pt: "Tecnologia", en: "Technology" },
    claim: {
      pt: "Websites, e-commerce, CRM e CDP a ligar marketing, vendas e operações.",
      en: "Websites, e-commerce, CRM and CDP connecting marketing, sales and operations.",
    },
    link: { pt: "Tech", en: "Tech" },
    promise: {
      pt: "Um site não é um folheto. É a peça de software que carrega a marca e a receita.",
      en: "A website is not a brochure. It is the software that carries the brand and the revenue.",
    },
    includes: [
      { pt: "Websites e plataformas de e-commerce", en: "Websites and e-commerce platforms" },
      { pt: "Aplicações web e mobile", en: "Web and mobile applications" },
      { pt: "CRM, CDP e integrações de dados", en: "CRM, CDP and data integrations" },
      { pt: "Performance, acessibilidade e migrações sem perder tráfego", en: "Performance, accessibility and migrations without losing traffic" },
    ],
    phases: [
      { name: { pt: "Arquitetura", en: "Architecture" }, body: { pt: "Estrutura de conteúdo, URLs e modelo de dados antes de qualquer ecrã.", en: "Content structure, URLs and data model before any screen." } },
      { name: { pt: "Sistema", en: "System" }, body: { pt: "Design system em código, componentes reutilizáveis e orçamento de performance fixado.", en: "Design system in code, reusable components and a fixed performance budget." } },
      { name: { pt: "Construção", en: "Build" }, body: { pt: "Entregas semanais visíveis em pré-visualização, com o cliente a ver crescer.", en: "Weekly deliveries visible in preview, with the client watching it grow." } },
      { name: { pt: "Migração", en: "Migration" }, body: { pt: "Mapa de redirecionamentos, medição antes e depois, e vigilância nas primeiras semanas.", en: "Redirect map, before-and-after measurement, and close watch in the first weeks." } },
    ],
    caseSlugs: ["agriloja", "unicambio"],
  },
];

/**
 * Clientes observados no jelly.pt público (grelha de portfolio, parede de logos
 * da homepage e sitemap de portfolio). O agrupamento por setor é nosso — a
 * confirmar com a Jelly. Nada aqui é inventado.
 */
export const clients: Client[] = [
  { name: "Cetelem", sector: "financeiro" },
  { name: "Novobanco", sector: "financeiro" },
  { name: "Unicâmbio", sector: "financeiro" },
  { name: "Informa D&B", sector: "servicos" },
  { name: "Audit2Measure", sector: "servicos" },
  { name: "Kompetenza", sector: "servicos" },
  { name: "Normática", sector: "servicos" },
  { name: "Maintarget", sector: "servicos" },
  { name: "Oncorporate", sector: "servicos" },
  { name: "Observatório de Enfermeiros dos Açores", sector: "servicos" },
  { name: "M.F. Pinto", sector: "servicos" },
  { name: "Decathlon", sector: "retalho" },
  { name: "Auchan · Jumbo Moda", sector: "retalho" },
  { name: "Agriloja", sector: "retalho" },
  { name: "NUK", sector: "retalho" },
  { name: "More than Beauty", sector: "retalho" },
  { name: "Top Brands Online", sector: "retalho" },
  { name: "Mustik", sector: "eventos" },
  { name: "Adegamãe", sector: "bebidas" },
  { name: "Vinuus", sector: "retalho" },
  { name: "Arneiro 1969", sector: "retalho" },
  { name: "Central de Cervejas e Bebidas", sector: "bebidas" },
  { name: "Vorwerk", sector: "consumo" },
  { name: "Coldkit", sector: "industria" },
  { name: "Systerra", sector: "industria" },
  { name: "Foambox", sector: "industria" },
  { name: "Sabrab", sector: "construcao" },
  { name: "Conorpe", sector: "industria" },
  { name: "Smartholidays", sector: "lazer" },
  { name: "Lifecooler", sector: "lazer" },
  { name: "Playplanet", sector: "lazer" },
  { name: "Fly Horus", sector: "lazer" },
  { name: "Logicalis", sector: "tecnologia" },
  { name: "Take1", sector: "tecnologia" },
  { name: "MyChange", sector: "tecnologia" },
  { name: "Faccia", sector: "saude" },
  { name: "Farmácias Shee", sector: "saude" },
  { name: "TO BE — by Teresa Branco", sector: "saude" },
  { name: "Stronddo", sector: "arte" },
  { name: "Artbid", sector: "arte" },
  { name: "Louis Bourgon", sector: "bebidas" },
  { name: "Adamus", sector: "bebidas" },
];

/**
 * Equipa a partir da página pública /equipa-jelly/. Os cargos entram pelo CMS —
 * só o do CEO está afirmado aqui.
 */

/** Linha de tempo da casa. Marcos a confirmar com a Jelly antes de publicar. */
export const milestones = [
  { year: "2010", pt: "Nasce a Jelly em Lisboa, com três pessoas e um portátil cada.", en: "Jelly is born in Lisbon, with three people and one laptop each." },
  { year: "2014", pt: "Primeira equipa de performance dedicada e as primeiras contas internacionais.", en: "First dedicated performance team and the first international accounts." },
  { year: "2018", pt: "A tecnologia passa a ser disciplina própria: websites, e-commerce e integrações.", en: "Technology becomes its own discipline: websites, e-commerce and integrations." },
  { year: "2022", pt: "Reporting próprio em analytics.jelly.pt, com cinco níveis de leitura.", en: "In-house reporting at analytics.jelly.pt, with five levels of reading." },
  { year: "2024", pt: "Unidade de dados e IA, e os primeiros agentes em produção em clientes.", en: "Data and AI unit, and the first agents running in production for clients." },
  { year: "2026", pt: "Parceria com a Informa D&B e nova equipa de gestão com plano a cinco anos.", en: "Partnership with Informa D&B and a new management team with a five-year plan." },
];
