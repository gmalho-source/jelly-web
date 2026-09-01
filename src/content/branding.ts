import type { Localized } from "./types";

/**
 * A página de Branding.
 *
 * Era a mais curta das páginas de serviço — frase, quatro bullets, quatro
 * fases — e para a disciplina cujo argumento é tornar reconhecível, uma página
 * igual às outras é uma contradição. Esta não descreve branding: faz. O topo é
 * o manifesto, o trabalho aparece em matéria, e a anatomia deixa desligar as
 * decisões de uma marca para se ver o que sobra.
 *
 * As duas frases de tese são do site antigo e são melhores do que qualquer
 * título novo. As três marcas são as do arquivo com identidade em matéria —
 * cartão, relevo, papel — que é o que esta página quer mostrar.
 */

export type Obra = {
  slug: string;
  cliente: string;
  rotulo: Localized;
  corpo: Localized;
  etiquetas: Localized[];
  imagem: { src: string; width: number; height: number; alt: Localized };
  /** A cor que a marca empresta à página enquanto está no ecrã. */
  acento: string;
};

export type Decisao = { chave: "tipo" | "cor" | "ritmo" | "voz"; nome: Localized; texto: Localized };

export const branding = {
  eyebrow: { pt: "Serviços · Branding", en: "Services · Branding" },
  /* A frase é de Frank Chimero e a casa adotou-a. O verbo concorda com
     «design»: ignores. */
  manifesto: {
    forte: ["People", "ignore", "design"],
    fraco: ["that", "ignores"],
    fecho: "people.",
  },
  claim: {
    pt: "Uma marca não é um logo. É a decisão de o que dizer, a quem, e o que deixar de dizer — e é isso que se constrói aqui.",
    en: "A brand is not a logo. It is the decision of what to say, to whom, and what to leave unsaid — and that is what gets built here.",
  },
  cta: { pt: "Vamos falar?", en: "Shall we talk?" },
  descricao: {
    pt: "Posicionamento, identidade e sistemas de marca que se reconhecem antes de se lerem. Branding pela Jelly: estratégia, design e execução, nesta ordem.",
    en: "Positioning, identity and brand systems that are recognised before they are read. Branding by Jelly: strategy, design and execution, in that order.",
  },

  tese: {
    a: { pt: "Uma marca bem construída não precisa de se explicar.", en: "A well-built brand does not need to explain itself." },
    b: {
      pt: "Percebe-se. Em apresentações, produtos, redes, embalagens ou ambientes digitais — antes de alguém ler o nome.",
      en: "It is understood. In decks, products, social, packaging or digital environments — before anyone reads the name.",
    },
  },

  materia: {
    eyebrow: { pt: "O trabalho, em matéria", en: "The work, in matter" },
    titulo: { pt: "Marcas que se pegam na mão antes de se lerem no ecrã.", en: "Brands you hold in your hand before you read them on a screen." },
  },

  obras: [
    {
      slug: "stronddo",
      cliente: "Stronddo",
      rotulo: { pt: "Galeria de arte online · 2024", en: "Online art gallery · 2024" },
      corpo: {
        pt: "Uma galeria que vive no ecrã precisava de um nome que se pudesse gravar em papel. Preto sobre branco, serifa de peso, e um sistema que aguenta desde o cartão até à moldura.",
        en: "A gallery that lives on screen needed a name you could press into paper. Black on white, a serif with weight, and a system that holds from the card to the frame.",
      },
      etiquetas: [{ pt: "Naming", en: "Naming" }, { pt: "Identidade", en: "Identity" }, { pt: "Web", en: "Web" }, { pt: "Estratégia", en: "Strategy" }],
      imagem: { src: "/media/branding-stronddo.webp", width: 1024, height: 1024, alt: { pt: "Cartões de visita da Stronddo Art Gallery, pretos e brancos, sobre uma mesa escura.", en: "Stronddo Art Gallery business cards, black and white, on a dark table." } },
      acento: "#e6e6e6",
    },
    {
      slug: "clinica-da-farmacia",
      cliente: "Clínica da Farma&Cia",
      rotulo: { pt: "Saúde · 2022", en: "Healthcare · 2022" },
      corpo: {
        pt: "Duas cores que não gritam e um padrão que se reconhece de longe. Um sistema para receção, receitas, fardas e o site — o mesmo em todos, sem parecer repetido.",
        en: "Two colours that do not shout and a pattern you recognise from afar. One system for reception, prescriptions, uniforms and the site — the same everywhere, never repetitive.",
      },
      etiquetas: [{ pt: "Identidade", en: "Identity" }, { pt: "Website", en: "Website" }, { pt: "Comunicação", en: "Communication" }],
      imagem: { src: "/media/branding-clinica.webp", width: 1321, height: 881, alt: { pt: "Cartões da Clínica da Farmácia em verde-sálvia e salmão, dispostos em leque.", en: "Clínica da Farmácia cards in sage green and salmon, fanned out." } },
      acento: "#8fb8a5",
    },
    {
      slug: "tom-barry-luxury-home-developer",
      cliente: "TOM Barry",
      rotulo: { pt: "Imobiliário de luxo · 2022", en: "Luxury real estate · 2022" },
      corpo: {
        pt: "Luxo raramente é acrescentar. Um monograma, relevo seco em papel preto, e uma história contada em renders 3D antes de o primeiro tijolo existir.",
        en: "Luxury is rarely about adding. A monogram, blind embossing on black paper, and a story told in 3D renders before the first brick exists.",
      },
      etiquetas: [{ pt: "Identidade", en: "Identity" }, { pt: "Storytelling", en: "Storytelling" }, { pt: "3D", en: "3D" }],
      imagem: { src: "/media/branding-tom-barry.webp", width: 1564, height: 1080, alt: { pt: "Cartão de visita preto da TOM Barry com o monograma em relevo seco.", en: "TOM Barry black business card with the monogram blind-embossed." } },
      acento: "#d8c8a8",
    },
  ] satisfies Obra[],

  anatomia: {
    eyebrow: { pt: "Anatomia de uma marca", en: "Anatomy of a brand" },
    titulo: { pt: "Uma marca é um sistema de quatro decisões. Desliga uma e vê o que fica.", en: "A brand is a system of four decisions. Switch one off and see what is left." },
    texto: {
      pt: "O espécime ao lado é a nossa própria marca, construída a partir dos mesmos tokens que fazem este site. Cada interruptor retira uma decisão. O que sobra quando se retiram todas é o que a maioria das empresas tem: um nome e uma cor que alguém escolheu.",
      en: "The specimen alongside is our own brand, built from the same tokens that make this site. Each switch removes one decision. What is left when all are removed is what most companies have: a name and a colour someone picked.",
    },
    nota: {
      pt: "Cada projeto de branding pode ter a sua anatomia, com os tokens verdadeiros da marca do cliente — o mesmo mecanismo, outro sistema.",
      en: "Every branding project can have its own anatomy, with the client brand's real tokens — the same mechanism, another system.",
    },
    decisoes: [
      { chave: "tipo", nome: { pt: "Tipo", en: "Type" }, texto: { pt: "Uma serifa com peso para o que se afirma; uma sans para o que se explica.", en: "A serif with weight for what is stated; a sans for what is explained." } },
      { chave: "cor", nome: { pt: "Cor", en: "Colour" }, texto: { pt: "Um vermelho, um preto de tinta, um papel. Tudo o resto é exceção com razão.", en: "One red, one ink black, one paper. Everything else is an exception with a reason." } },
      { chave: "ritmo", nome: { pt: "Ritmo", en: "Rhythm" }, texto: { pt: "Escala, respiro, alinhamento. É o que faz a mesma frase parecer cara ou barata.", en: "Scale, breathing room, alignment. What makes the same sentence look expensive or cheap." } },
      { chave: "voz", nome: { pt: "Voz", en: "Voice" }, texto: { pt: "O que se diz e como. A decisão de design que mais gente esquece que é design.", en: "What is said and how. The design decision most people forget is design." } },
    ] satisfies Decisao[],
    especime: {
      com: {
        titulo: { pt: "Be the change.", en: "Be the change." },
        corpo: { pt: "Marcas, marketing e inteligência artificial para empresas que querem ser reconhecidas antes de serem lembradas.", en: "Brands, marketing and artificial intelligence for companies that want to be recognised before they are remembered." },
        botao: { pt: "Falar connosco", en: "Get in touch" },
      },
      sem: {
        titulo: { pt: "Soluções integradas de comunicação", en: "Integrated communication solutions" },
        corpo: { pt: "Somos uma agência full-service focada em resultados, com uma equipa multidisciplinar orientada para o cliente e para a excelência.", en: "We are a results-driven full-service agency with a multidisciplinary, client-oriented team committed to excellence." },
        botao: { pt: "Saiba mais", en: "Learn more" },
      },
    },
    vereditos: {
      pt: ["Isto não é uma marca. É um nome.", "Isto é um documento com um logótipo.", "Já se reconhece alguma coisa.", "Falta uma decisão, e nota-se.", "Isto é uma marca."],
      en: ["This is not a brand. It is a name.", "This is a document with a logo.", "Something is recognisable now.", "One decision missing, and it shows.", "This is a brand."],
    },
    ativas: { pt: "Decisões ativas", en: "Active decisions" },
  },

  fases: {
    eyebrow: { pt: "Como trabalhamos", en: "How we work" },
    titulo: { pt: "Quatro fases. A ordem é o método.", en: "Four phases. The order is the method." },
  },

  servicos: {
    eyebrow: { pt: "O que fazemos", en: "What we do" },
    titulo: { pt: "Estratégia, design e execução. Nesta ordem, e sem saltar nenhuma.", en: "Strategy, design and execution. In that order, skipping none." },
    colunas: [
      { nome: { pt: "Estratégia", en: "Strategy" }, itens: [
        { pt: "Posicionamento e arquitetura de marca", en: "Positioning and brand architecture" },
        { pt: "Naming e tom de voz", en: "Naming and tone of voice" },
        { pt: "Pesquisa, entrevistas e workshops", en: "Research, interviews and workshops" },
        { pt: "Personas e arquétipos", en: "Personas and archetypes" },
        { pt: "Estratégia de conteúdo e de website", en: "Content and website strategy" },
      ] },
      { nome: { pt: "Design", en: "Design" }, itens: [
        { pt: "Identidade visual e brand guidelines", en: "Visual identity and brand guidelines" },
        { pt: "Sistemas de design em tokens", en: "Design systems in tokens" },
        { pt: "Direção de arte e fotografia", en: "Art direction and photography" },
        { pt: "Motion e sistemas de animação", en: "Motion and animation systems" },
        { pt: "Packaging e materiais", en: "Packaging and materials" },
      ] },
      { nome: { pt: "Execução", en: "Execution" }, itens: [
        { pt: "Website e produto digital", en: "Website and digital product" },
        { pt: "Ativação interna e formação", en: "Internal rollout and training" },
        { pt: "Campanhas de lançamento", en: "Launch campaigns" },
        { pt: "Conteúdo editorial", en: "Editorial content" },
        { pt: "Acompanhamento da marca em uso", en: "Looking after the brand in use" },
      ] },
    ],
  },

  fecho: {
    titulo: { pt: "Quer saber o que a sua marca já diz sem querer?", en: "Want to know what your brand already says without meaning to?" },
    texto: { pt: "Um diagnóstico de duas semanas, com o que a marca significa hoje para quem compra — e o que devia significar.", en: "A two-week diagnosis of what the brand means today to the people who buy — and what it should mean." },
  },
};
