import type { Localized } from "./types";

/**
 * A página-mãe de Marketing.
 *
 * É a principal razão pela qual nos procuram, e a página antiga era uma lista
 * plana de nove competências sem hierarquia. Esta é um chapéu: dez serviços em
 * quatro áreas, cada área com a sua unidade de medida — euros por lead, minutos
 * de atenção, menções, ciclos — porque é pela medida que se organiza o trabalho
 * e se prestam contas. As fases do método continuam a vir do serviço no painel.
 *
 * Os serviços sem `sub` ainda não têm página: aparecem no mapa, mas não são
 * ligação. Quando a página nascer em `marketing-servicos.ts`, põe-se aqui o slug. Nenhum leva a
 * etiqueta «novo»: são serviços que é suposto a casa ter, não lançamentos.
 */

export type ServicoDeArea = {
  nome: Localized;
  linha: Localized;
  /** O slug português da página em `marketing-servicos.ts`. Sem página, não é ligação. */
  sub?: string;
};

export type Area = {
  chave: "performance" | "conteudo" | "influencia" | "dados";
  nome: Localized;
  medida: Localized;
  medidaNota: Localized;
  titulo: Localized;
  posicao: Localized;
  servicos: ServicoDeArea[];
  legenda: Localized;
  alcance: Localized;
};

export const marketing = {
  eyebrow: { pt: "Serviços · Marketing digital", en: "Services · Digital marketing" },
  titulo: {
    forte: { pt: "Tudo o que faz o número mexer.", en: "Everything that moves the number." },
    vermelho: { pt: "Debaixo do mesmo chapéu.", en: "Under one roof." },
  },
  lead: {
    pt: "Dados, criatividade e cadência. Dez serviços em quatro áreas, geridos como uma só conta, com o número sempre ao lado da ideia.",
    en: "Data, creativity and cadence. Ten services in four areas, run as one account, with the number always next to the idea.",
  },
  cta: { pt: "Falar connosco", en: "Talk to us" },
  /* O vídeo do topo é o da página antiga, imagens de banco de 2019, recodificado
     de 51 MB para 3 MB. Provisório: fica até haver imagens filmadas na Jelly. */
  topo: {
    video: "/media/marketing-topo.mp4",
    poster: { src: "/media/marketing-topo-poster.webp", width: 1440, height: 810 },
  },
  descricao: {
    pt: "Marketing digital pela Jelly: paid media, SEO e GEO, lead generation B2B, social media, vídeo, conteúdo, influencers, digital PR, marketing automation e analytics. Dez serviços, uma só conta.",
    en: "Digital marketing by Jelly: paid media, SEO and GEO, B2B lead generation, social media, video, content, influencers, digital PR, marketing automation and analytics. Ten services, one account.",
  },

  mapa: { eyebrow: { pt: "O mapa", en: "The map" } },

  areas: {
    eyebrow: { pt: "As áreas", en: "The areas" },
    titulo: { pt: "Quatro áreas. Uma unidade de medida em cada.", en: "Four areas. One unit of measure in each." },
    nota: { pt: "É pela medida que se organiza o trabalho e se prestam contas. Cada serviço tem a sua página.", en: "Work is organised, and accounts are given, by the measure. Each service has its own page." },
    emBreve: { pt: "em breve", en: "soon" },
  },

  lista: [
    {
      chave: "performance",
      nome: { pt: "Performance", en: "Performance" },
      medida: { pt: "€ / lead", en: "€ / lead" },
      medidaNota: { pt: "a unidade que manda", en: "the unit in charge" },
      titulo: { pt: "Comprar atenção e devolvê-la em receita.", en: "Buy attention and return it as revenue." },
      posicao: { pt: "Media paga, procura orgânica e leads B2B geridas como um só orçamento.", en: "Paid media, organic search and B2B leads run as one budget." },
      servicos: [
        { nome: { pt: "Paid Media", en: "Paid Media" }, linha: { pt: "Google, Meta, LinkedIn e TikTok, full-funnel.", en: "Google, Meta, LinkedIn and TikTok, full-funnel." }, sub: "paid-media" },
        { nome: { pt: "SEO e GEO", en: "SEO and GEO" }, linha: { pt: "Ser encontrado por pessoas e por agentes de IA.", en: "Be found by people and by AI agents." }, sub: "seo-geo" },
        { nome: { pt: "Lead Generation B2B", en: "B2B Lead Generation" }, linha: { pt: "Com os dados da Informa D&B.", en: "Powered by Informa D&B data." }, sub: "lead-generation-b2b" },
      ],
      legenda: { pt: "Custo por lead qualificada, por canal", en: "Cost per qualified lead, by channel" },
      alcance: { pt: "12 semanas", en: "12 weeks" },
    },
    {
      chave: "conteudo",
      nome: { pt: "Conteúdo", en: "Content" },
      medida: { pt: "minutos", en: "minutes" },
      medidaNota: { pt: "de atenção merecida", en: "of earned attention" },
      titulo: { pt: "Merecer atenção em vez de a comprar.", en: "Earn attention instead of buying it." },
      posicao: { pt: "Redes, vídeo e texto com uma ideia editorial por trás, publicados com cadência.", en: "Social, video and text with an editorial idea behind them, published with cadence." },
      servicos: [
        { nome: { pt: "Social Media", en: "Social Media" }, linha: { pt: "Gestão, conteúdos e comunidade.", en: "Management, content and community." } },
        { nome: { pt: "Vídeo e Audiovisual", en: "Video and Audiovisual" }, linha: { pt: "Jelly.Studio, da ideia à pós-produção.", en: "Jelly.Studio, from idea to post-production." } },
        { nome: { pt: "Conteúdo editorial e Inbound", en: "Editorial content and Inbound" }, linha: { pt: "Artigos, guias e newsletters que alimentam o SEO e o GEO.", en: "Articles, guides and newsletters that feed SEO and GEO." } },
      ],
      legenda: { pt: "Tempo de atenção acumulado", en: "Accumulated attention time" },
      alcance: { pt: "26 semanas", en: "26 weeks" },
    },
    {
      chave: "influencia",
      nome: { pt: "Influência e Reputação", en: "Influence and Reputation" },
      medida: { pt: "menções", en: "mentions" },
      medidaNota: { pt: "que valem uma recomendação", en: "worth a recommendation" },
      titulo: { pt: "Pôr outros a dizer o que a marca não pode dizer de si.", en: "Get others to say what the brand cannot say about itself." },
      posicao: { pt: "Criadores, comunidades e imprensa: a credibilidade de quem já tem a atenção do público.", en: "Creators, communities and the press: the credibility of those who already have the audience's attention." },
      servicos: [
        { nome: { pt: "Influencers e Creators (UGC)", en: "Influencers and Creators (UGC)" }, linha: { pt: "Seleção, briefing, contratos e medição.", en: "Selection, briefing, contracts and measurement." } },
        { nome: { pt: "Digital PR e Assessoria de Imprensa", en: "Digital PR and Media Relations" }, linha: { pt: "Press releases e relações com os media.", en: "Press releases and media relations." } },
      ],
      legenda: { pt: "Rede de menções por afinidade", en: "Mention network by affinity" },
      alcance: { pt: "1 campanha", en: "1 campaign" },
    },
    {
      chave: "dados",
      nome: { pt: "Dados e Automação", en: "Data and Automation" },
      medida: { pt: "ciclos", en: "cycles" },
      medidaNota: { pt: "entre o clique e a venda", en: "between the click and the sale" },
      titulo: { pt: "O que acontece depois do clique.", en: "What happens after the click." },
      posicao: { pt: "Medição limpa, atribuição honesta e jornadas que trabalham quando a equipa vai dormir.", en: "Clean measurement, honest attribution and journeys that keep working while the team sleeps." },
      servicos: [
        { nome: { pt: "Marketing Automation e Lifecycle", en: "Marketing Automation and Lifecycle" }, linha: { pt: "E-mail, nurturing e jornadas ligadas ao CRM.", en: "Email, nurturing and journeys wired to the CRM." } },
        { nome: { pt: "Analytics, Atribuição e CRO", en: "Analytics, Attribution and CRO" }, linha: { pt: "Eventos, atribuição e testes na página.", en: "Events, attribution and on-page testing." } },
      ],
      legenda: { pt: "Jornada de uma lead, em ciclos", en: "A lead's journey, in cycles" },
      alcance: { pt: "7 toques", en: "7 touches" },
    },
  ] as Area[],

  metodo: {
    eyebrow: { pt: "O método", en: "The method" },
    titulo: { pt: "Quatro fases. A ordem importa.", en: "Four phases. The order matters." },
    nota: { pt: "O mesmo processo para três meses ou para três anos.", en: "The same process for three months or for three years." },
  },

  trabalho: {
    eyebrow: { pt: "Trabalho", en: "Work" },
    titulo: { pt: "Marcas que confiam o número à Jelly.", en: "Brands that trust Jelly with the number." },
    todos: { pt: "Ver todos os projetos", en: "See all projects" },
    /* Quando o serviço no painel não escolher casos, são estes: os projetos
       com narrativa escrita que têm marketing na disciplina. Só esses aparecem
       no site — um projeto sem história não tem página para onde ir. */
    casos: ["informa-db", "agriloja", "vorwerk", "nuk"],
    parceirosEyebrow: { pt: "Parceiros e certificações", en: "Partners and certifications" },
    parceiros: ["Google Partner", "Meta Business Partner", "Informa D&B", "Brevo", "Mailchimp", "Pipedrive", "HighLevel"],
  },

  ia: {
    eyebrow: { pt: "A IA atravessa as quatro áreas", en: "AI runs through all four areas" },
    titulo: { pt: "Não vendemos IA à parte. Vendemos marketing com IA dentro.", en: "We don't sell AI on the side. We sell marketing with AI inside." },
    texto: {
      pt: "Agentes, GEO e jornadas automáticas têm casa no serviço de Inteligência Artificial, e trabalho em cada uma destas áreas.",
      en: "Agents, GEO and automated journeys live in the Artificial Intelligence service, and work in each of these areas.",
    },
    cta: { pt: "Ver Inteligência Artificial", en: "See Artificial Intelligence" },
    itens: [
      { nome: { pt: "Pré-qualificação de leads com agentes de IA", en: "Lead pre-qualification with AI agents" }, area: { pt: "Performance", en: "Performance" }, href: "/pre-qualificacao-leads-agentes-ia" },
      { nome: { pt: "GEO: ser a resposta dos motores generativos", en: "GEO: being the answer of generative engines" }, area: { pt: "Performance · Conteúdo", en: "Performance · Content" } },
      { nome: { pt: "Conteúdo assistido, com editor humano no fim", en: "Assisted content, with a human editor at the end" }, area: { pt: "Conteúdo", en: "Content" } },
      { nome: { pt: "Jornadas que escolhem o próximo toque", en: "Journeys that choose the next touch" }, area: { pt: "Dados e Automação", en: "Data and Automation" } },
    ],
  },

  fecho: {
    titulo: { pt: "Preparado para o que vem a seguir?", en: "Ready for what comes next?" },
    texto: { pt: "Conte-nos o desafio em duas frases. Respondemos com uma primeira leitura, antes de qualquer proposta.", en: "Tell us the challenge in two sentences. We answer with a first reading, before any proposal." },
    cta: { pt: "Começar uma conversa", en: "Start a conversation" },
  },
} as const;
