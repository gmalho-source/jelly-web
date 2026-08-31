import type { Localized } from "./types";

/**
 * A página pilar da pré-qualificação de leads com agentes de IA.
 *
 * Vive debaixo da Inteligência Artificial e chega-se lá por uma chamada na
 * página desse serviço. O texto é o que já estava produzido no site antigo,
 * respeitado à letra — só o título perdeu uma gralha («Pré-qualficação») e o
 * sexto passo deixou de ser um passo, por a secção se chamar «cinco passos» e
 * ter seis números. Ver a nota em `passos.desfecho`.
 *
 * O português é o original; o inglês é tradução.
 */

export type Numero = {
  /** O algarismo, sozinho, para poder ser tipografia e não texto. */
  valor: string;
  unidade: string;
  texto: Localized;
};

export type Passo = { nome: Localized; corpo: Localized };

export type Vertical = {
  numero: string;
  titulo: Localized;
  corpo: Localized;
  imagem: { src: string; alt: Localized };
  /** A cor da paleta que marca este vertical. */
  cor: "coral" | "lavender" | "chartreuse";
};

export type Pergunta = { pergunta: Localized; resposta: Localized };

export const agentesLeads = {
  eyebrow: { pt: "Inteligência artificial", en: "Artificial intelligence" },
  titulo: {
    pt: "Pré-qualificação de leads com agentes de IA",
    en: "Lead pre-qualification with AI agents",
  },
  /** O nome curto, para a migalha e para a chamada na página do serviço. */
  tituloCurto: { pt: "Pré-qualificação de leads", en: "Lead pre-qualification" },
  claim: {
    pt: "Descubra como um agente de IA que atende, qualifica e agenda (no WhatsApp, email e redes sociais, 24 horas por dia) transforma o orçamento que já gasta em receita que ainda não tem.",
    en: "See how an AI agent that answers, qualifies and books (on WhatsApp, email and social, 24 hours a day) turns the budget you already spend into revenue you do not yet have.",
  },
  descricao: {
    pt: "Responda a cada lead em segundos, 24/7, no WhatsApp e email. Saiba como a pré-qualificação de leads com agentes de IA multiplica a conversão. Guia Jelly.",
    en: "Answer every lead in seconds, 24/7, on WhatsApp and email. How lead pre-qualification with AI agents multiplies conversion. A Jelly guide.",
  },

  abertura: {
    titulo: {
      pt: "O seu marketing gera leads. O seu processo perde-os.",
      en: "Your marketing generates leads. Your process loses them.",
    },
    cena: {
      pt: "São 22h47. Um lead escreve: «Boa noite, queria mais informações.» A maioria das empresas responde na manhã seguinte. Ou nunca. O concorrente que respondeu em 30 segundos ficou com o cliente.",
      en: "It is 22:47. A lead writes: “Good evening, I would like more information.” Most companies answer the next morning. Or never. The competitor who answered in 30 seconds got the client.",
    },
  },

  numeros: [
    {
      valor: "21",
      unidade: "x",
      texto: {
        pt: "mais provável qualificar um lead respondendo em menos de 5 minutos",
        en: "more likely to qualify a lead by answering in under 5 minutes",
      },
    },
    {
      valor: "78",
      unidade: "%",
      texto: {
        pt: "dos compradores fecham com a primeira empresa que responde",
        en: "of buyers close with the first company that answers",
      },
    },
    {
      valor: "42",
      unidade: "h",
      texto: {
        pt: "o tempo médio de resposta B2B que o agente substitui por segundos",
        en: "the average B2B response time the agent replaces with seconds",
      },
    },
  ] satisfies Numero[],

  definicao: {
    titulo: {
      pt: "O que é a pré-qualificação de leads com agentes de IA?",
      en: "What is lead pre-qualification with AI agents?",
    },
    paragrafos: [
      {
        pt: "A pré-qualificação de leads com agentes de IA é o processo de usar um agente conversacional inteligente para responder de imediato a cada novo contacto comercial, conduzir uma conversa natural de qualificação (orçamento, urgência, perfil, necessidade) e entregar à equipa de vendas apenas os leads com real potencial — já classificados, contextualizados e registados no CRM. Funciona 24 horas por dia em canais como WhatsApp, email, webchat e Instagram.",
        en: "Lead pre-qualification with AI agents is the practice of using an intelligent conversational agent to answer every new commercial contact immediately, hold a natural qualifying conversation (budget, urgency, profile, need) and hand the sales team only the leads with real potential — already scored, in context and logged in the CRM. It runs 24 hours a day on channels such as WhatsApp, email, web chat and Instagram.",
      },
      {
        pt: "Convém ser claro sobre o que isto não é: não é um chatbot de menus com botões que irrita toda a gente. Não é um autoresponder que diz «obrigado pelo seu contacto». É um agente parametrizado à medida do seu negócio, que conversa no tom da sua marca, sabe o que pode e não pode responder, e sabe quando passar a conversa a um humano.",
        en: "It is worth being clear about what this is not: it is not a menu chatbot with buttons that annoys everybody. It is not an autoresponder saying “thank you for getting in touch”. It is an agent parameterised to your business, which talks in your brand's tone, knows what it may and may not answer, and knows when to hand the conversation to a human.",
      },
    ],
    tese: {
      pt: "O agente qualifica. As pessoas vendem. O objetivo nunca é substituir a sua equipa comercial — é devolver-lhe as horas que hoje gasta a filtrar curiosos, e entregar-lhe conversas que valem o seu tempo.",
      en: "The agent qualifies. People sell. The goal is never to replace your sales team — it is to give back the hours it spends today filtering the merely curious, and to hand it conversations worth its time.",
    },
  },

  beneficios: {
    titulo: { pt: "O que isto faz pelo seu negócio?", en: "What this does for your business" },
    itens: [
      {
        nome: { pt: "Nenhum lead sem resposta", en: "No lead left unanswered" },
        corpo: {
          pt: "Atendimento em segundos, 24/7, incluindo os 40% que chegam fora de horário.",
          en: "Answered in seconds, 24/7, including the 40% that arrive outside working hours.",
        },
      },
      {
        nome: { pt: "Só leads qualificados chegam à equipa", en: "Only qualified leads reach the team" },
        corpo: {
          pt: "O agente filtra curiosos e aplica os seus critérios comerciais.",
          en: "The agent filters the merely curious and applies your commercial criteria.",
        },
      },
      {
        nome: { pt: "Reuniões marcadas na própria conversa", en: "Meetings booked inside the conversation" },
        corpo: {
          pt: "Sem vai-e-vem de emails e chamadas perdidas.",
          en: "No back-and-forth of emails and missed calls.",
        },
      },
      {
        nome: { pt: "Tudo no CRM, automaticamente", en: "Everything in the CRM, automatically" },
        corpo: {
          pt: "Score, dados e histórico de cada contacto, sem trabalho manual.",
          en: "Score, data and history for every contact, with no manual work.",
        },
      },
    ],
    imagem: {
      src: "/media/agentes-executiva.webp",
      alt: {
        pt: "Uma executiva a caminhar na Avenida da Liberdade, em Lisboa, a ler o telemóvel.",
        en: "A businesswoman walking down Avenida da Liberdade, in Lisbon, reading her phone.",
      },
    },
  },

  passos: {
    eyebrow: { pt: "Qualidade sobre a quantidade", en: "Quality over quantity" },
    titulo: {
      pt: "Como funciona: do clique ao CRM em cinco passos",
      en: "How it works: from click to CRM in five steps",
    },
    itens: [
      {
        nome: { pt: "Captação omnicanal", en: "Omnichannel capture" },
        corpo: {
          pt: "O lead chega por anúncio click-to-WhatsApp, formulário do site, portal, email ou DM de Instagram. Todos os canais convergem para o mesmo agente: uma única fila, zero contactos perdidos.",
          en: "The lead arrives through a click-to-WhatsApp ad, a site form, a portal, email or an Instagram DM. Every channel converges on the same agent: one queue, zero contacts lost.",
        },
      },
      {
        nome: {
          pt: "Resposta imediata e conversa de qualificação",
          en: "Immediate reply and qualifying conversation",
        },
        corpo: {
          pt: "O agente responde em segundos, no tom de voz da marca, e conduz 4 a 8 perguntas naturais adaptadas às respostas — não um formulário disfarçado de conversa.",
          en: "The agent answers in seconds, in the brand's tone of voice, and asks 4 to 8 natural questions that adapt to the answers — not a form disguised as a conversation.",
        },
      },
      {
        nome: { pt: "Scoring e classificação", en: "Scoring and classification" },
        corpo: {
          pt: "Cada lead recebe um score e uma categoria (quente, morno, fora de perfil) com base em regras de negócio explícitas, definidas consigo — auditáveis e ajustáveis.",
          en: "Each lead gets a score and a category (hot, warm, out of profile) from explicit business rules, defined with you — auditable and adjustable.",
        },
      },
      {
        nome: { pt: "Encaminhamento e agendamento", en: "Routing and booking" },
        corpo: {
          pt: "Leads quentes são entregues de imediato ao comercial certo, com resumo da conversa. Quando faz sentido, o agente marca diretamente a reunião, visita ou consulta na agenda da equipa.",
          en: "Hot leads go straight to the right salesperson, with a summary of the conversation. Where it makes sense, the agent books the meeting, viewing or appointment directly in the team's calendar.",
        },
      },
      {
        nome: { pt: "Sincronização com CRM", en: "CRM synchronisation" },
        corpo: {
          pt: "Cada interação alimenta o CRM: dados de qualificação, score, fonte de campanha e transcrição. A gestão passa a ver o funil inteiro num dashboard.",
          en: "Every interaction feeds the CRM: qualifying data, score, campaign source and transcript. Management gets to see the whole funnel on one dashboard.",
        },
      },
    ] satisfies Passo[],
    /**
     * O sexto item do site antigo. Não é um passo — é o que acontece depois de
     * os cinco estarem a correr, e a secção chama-se «cinco passos». Numerado a
     * seis, o título ficava a mentir; fora da lista, o texto continua todo lá e
     * a conta fecha.
     */
    desfecho: {
      nome: { pt: "Assista ao seu negócio a crescer", en: "Watch your business grow" },
      corpo: {
        pt: "A partir daqui, o sistema trabalha para si: cada mês, as conversas reais afinam perguntas, fluxos e scoring — o agente melhora com o uso. O tempo de resposta mantém-se em segundos, a taxa de contacto em 100%, e a sua equipa passa os dias no único sítio onde gera receita: a vender.",
        en: "From here the system works for you: every month, real conversations sharpen the questions, the flows and the scoring — the agent improves with use. Response time stays in seconds, contact rate stays at 100%, and your team spends its days in the only place where it makes money: selling.",
      },
    },
    nota: {
      nome: { pt: "E os leads que não respondem?", en: "And the leads that never reply?" },
      corpo: {
        pt: "O mesmo sistema faz follow-up contextual em 24–48h e coloca os «mornos» em nurturing até estarem prontos. A qualificação não é um momento. É um processo contínuo.",
        en: "The same system follows up in context within 24–48h and puts the warm ones into nurturing until they are ready. Qualification is not a moment. It is a continuous process.",
      },
    },
  },

  verticais: {
    titulo: { pt: "Alguns verticais que apoiamos", en: "Some of the verticals we support" },
    itens: [
      {
        numero: "01",
        titulo: {
          pt: "Imobiliário: a velocidade vale (literalmente) casas",
          en: "Real estate: speed is worth (literally) houses",
        },
        corpo: {
          pt: "Num teste às 74 maiores mediadoras norte-americanas, 41% nunca respondeu aos leads do próprio site — e apenas 9% respondeu dentro dos 5 minutos críticos. O agente qualifica intenção, orçamento, financiamento, zona e tipologia, e agenda visitas diretamente na agenda do consultor certo.",
          en: "In a test on the 74 largest North American agencies, 41% never answered the leads from their own site — and only 9% answered inside the critical 5 minutes. The agent qualifies intent, budget, financing, area and property type, and books viewings straight into the right agent's calendar.",
        },
        imagem: {
          src: "/media/agentes-imobiliario.webp",
          alt: {
            pt: "Uma cliente sentada num café mostra no telemóvel uma conversa com o agente.",
            en: "A client sitting in a café shows a conversation with the agent on her phone.",
          },
        },
        cor: "coral",
      },
      {
        numero: "02",
        titulo: {
          pt: "Clínicas e saúde: da pergunta à consulta marcada",
          en: "Clinics and healthcare: from question to booked appointment",
        },
        corpo: {
          pt: "A receção é o estrangulamento de qualquer clínica: o telefone toca enquanto se atende ao balcão, e o pedido de sexta à noite só tem resposta na segunda. O agente responde com informação aprovada pela clínica, faz triagem administrativa, marca na agenda real, envia lembretes que reduzem no-shows e reativa pacientes inativos.",
          en: "Reception is the bottleneck of any clinic: the phone rings while someone is being served at the desk, and the Friday-night request only gets an answer on Monday. The agent replies with information the clinic has approved, does administrative triage, books in the real calendar, sends reminders that cut no-shows and reactivates dormant patients.",
        },
        imagem: {
          src: "/media/agentes-clinica.webp",
          alt: {
            pt: "A receção de uma clínica, com o corredor das salas de consulta ao fundo.",
            en: "A clinic's reception, with the corridor of consulting rooms beyond.",
          },
        },
        cor: "lavender",
      },
      {
        numero: "03",
        titulo: {
          pt: "B2B e serviços: menos reuniões desperdiçadas, pipeline mais limpo",
          en: "B2B and services: fewer wasted meetings, a cleaner pipeline",
        },
        corpo: {
          pt: "O custo no B2B não está só no lead perdido — está na reunião de 45 minutos com quem nunca poderia comprar. O agente aplica o seu framework de qualificação (BANT ou variante à medida) antes de qualquer humano investir tempo, agenda a discovery com o comercial certo e mantém em nurturing os «ainda não».",
          en: "In B2B the cost is not only the lead you lose — it is the 45-minute meeting with someone who could never have bought. The agent applies your qualifying framework (BANT or a tailored variant) before any human invests time, books the discovery call with the right salesperson and keeps the “not yet” in nurturing.",
        },
        imagem: {
          src: "/media/agentes-b2b.webp",
          alt: {
            pt: "Alguém a trabalhar num portátil, com painéis de dados projetados ao lado.",
            en: "Someone working on a laptop, with data panels projected alongside.",
          },
        },
        cor: "chartreuse",
      },
    ] satisfies Vertical[],
  },

  fecho: {
    titulo: {
      pt: "Quer perceber onde a IA pode gerar impacto real no seu negócio?",
      en: "Want to know where AI can make a real difference to your business?",
    },
    texto: { pt: "Nós ajudamos a descobrir.", en: "We help you find out." },
    cta: { pt: "Vamos falar?", en: "Shall we talk?" },
  },

  faqTitulo: { pt: "Tudo o que precisa saber", en: "Everything you need to know" },
  faq: [
    {
      pergunta: {
        pt: "Os Agentes IA vão substituir a minha equipa comercial?",
        en: "Will AI agents replace my sales team?",
      },
      resposta: {
        pt: "Não. Vai substituir a pior parte do trabalho dela. A triagem repetitiva passa para o agente; a relação e o fecho continuam humanos, com mais tempo e melhor contexto.",
        en: "No. It will replace the worst part of its work. Repetitive triage moves to the agent; the relationship and the close stay human, with more time and better context.",
      },
    },
    {
      pergunta: {
        pt: "E se o agente disser um disparate a um cliente?",
        en: "What if the agent says something absurd to a client?",
      },
      resposta: {
        pt: "O agente responde apenas com base em informação aprovada por si e escala para humano quando sai desse perímetro. Toda a conversa fica registada e auditável.",
        en: "The agent answers only from information you have approved, and escalates to a human when it leaves that perimeter. Every conversation is logged and auditable.",
      },
    },
    {
      pergunta: {
        pt: "Os meus clientes não preferem falar com pessoas?",
        en: "Don't my clients prefer talking to people?",
      },
      resposta: {
        pt: "Preferem falar com quem responde. A alternativa real não é uma pessoa disponível 24/7, é o silêncio até segunda-feira. E quando o cliente pede um humano, o agente entrega a conversa imediatamente.",
        en: "They prefer talking to whoever answers. The real alternative is not a person available 24/7, it is silence until Monday. And when the client asks for a human, the agent hands over the conversation at once.",
      },
    },
    {
      pergunta: { pt: "Funciona com o meu CRM atual?", en: "Does it work with my current CRM?" },
      resposta: {
        pt: "Sim. Integramos com os principais CRM do mercado. E se ainda não tem CRM, estruturamos um como parte do projeto.",
        en: "Yes. We integrate with the main CRMs on the market. And if you do not have a CRM yet, we set one up as part of the project.",
      },
    },
    {
      pergunta: {
        pt: "Quanto tempo demora a implementar um Agente IA?",
        en: "How long does it take to implement an AI agent?",
      },
      resposta: {
        pt: "Um projeto típico vai de kickoff a go-live em 4 a 6 semanas: diagnóstico e desenho, parametrização e integração, testes supervisionados e lançamento faseado.",
        en: "A typical project goes from kickoff to go-live in 4 to 6 weeks: diagnosis and design, parameterisation and integration, supervised testing and a phased launch.",
      },
    },
    {
      pergunta: { pt: "Em que idiomas funciona?", en: "Which languages does it work in?" },
      resposta: {
        pt: "Qualquer uma. Para começar, em Português, inglês e as línguas relevantes para o seu mercado, com deteção automática do idioma do lead.",
        en: "Any of them. To start with, Portuguese, English and whichever languages matter to your market, detecting the lead's language automatically.",
      },
    },
    {
      pergunta: {
        pt: "Quanto custa implementar um Agente IA?",
        en: "How much does implementing an AI agent cost?",
      },
      resposta: {
        pt: "Depende dos canais, integrações e volume de conversas. O investimento estrutura-se em projeto de implementação + acompanhamento mensal de otimização, dimensionado em proposta após o diagnóstico gratuito.",
        en: "It depends on channels, integrations and conversation volume. The investment is structured as an implementation project plus monthly optimisation, sized in a proposal after the free diagnosis.",
      },
    },
  ] satisfies Pergunta[],
};
