import type { Localized } from "./types";

/**
 * A página de Branding.
 *
 * Era a mais curta das páginas de serviço — frase, quatro bullets, quatro
 * fases — e para a disciplina cujo argumento é tornar reconhecível, uma página
 * igual às outras é uma contradição. Esta não descreve branding: faz. O topo é
 * o manifesto, a frase vermelha diz o que fazemos, e o trabalho são as marcas
 * mais recentes do arquivo.
 *
 * As marcas não vivem aqui: são os três projetos mais recentes com a disciplina
 * Branding no painel, com link para a página de cada um. Quem publica um
 * projeto novo de branding vê-o aparecer nesta página sem mexer em código.
 */

export const branding = {
  eyebrow: { pt: "Serviços · Branding", en: "Services · Branding" },
  /* A frase é de Frank Chimero, e vai entre aspas e assinada: é uma citação,
     não um slogan da casa. O verbo concorda com «design»: ignores. */
  manifesto: {
    forte: ["“People", "ignore", "design"],
    fraco: ["that", "ignores"],
    fecho: "people.”",
    autor: "Frank Chimero",
  },
  /* O remate da citação: um título, o que fazemos, e a razão numa linha. */
  remate: {
    titulo: {
      pt: "Trabalhar uma marca começa por compreender as pessoas.",
      en: "Building a brand starts with understanding people.",
    },
    texto: {
      pt: "Na Jelly, acreditamos que o branding constrói a forma como uma marca é reconhecida, compreendida e escolhida. Começamos por perceber o negócio, o que o torna relevante e as pessoas a quem se dirige. Traduzimos essa compreensão num posicionamento claro, numa identidade própria e numa experiência coerente em cada contacto.",
      en: "At Jelly, we believe branding shapes how a brand is recognised, understood and chosen. We start by understanding the business, what makes it relevant and the people it speaks to. We translate that understanding into a clear positioning, a distinctive identity and a coherent experience at every touchpoint.",
    },
    fecho: {
      pt: "Porque uma marca ganha valor quando aquilo que promete corresponde àquilo que as pessoas vivem.",
      en: "Because a brand gains value when what it promises matches what people experience.",
    },
  },
  cta: { pt: "Vamos falar?", en: "Shall we talk?" },
  /* O filme: um livro de marca numa mesa escura, a preto e branco, com a página
     a virar. Entregue em 720p H.264 a 8,7 Mbps (10,4 MB), fica em 1,0 MB — CRF
     26 e índice à cabeça, a régua da casa para um fundo.

     Fica a 1280 px e não a 1920 porque é essa a largura do que nos foi dado, e
     esticar um filme não lhe acrescenta detalhe nenhum: acrescenta peso. Se
     aparecer um original maior, vale a pena repetir isto com ele — a moldura
     abre até 1200 px, que num ecrã de dois pontos por pixel pede 2400.

     Sem áudio porque corre em ciclo e mudo, e um filme mudo com faixa de som é
     peso que ninguém ouve. O cartaz é o fotograma do primeiro segundo, o mesmo
     que fica a quem pediu menos movimento. */
  topo: {
    video: "/media/branding-topo.mp4",
    poster: { src: "/media/branding-topo-poster.webp", width: 1280, height: 720 },
  },
  descricao: {
    pt: "Posicionamento, identidade e sistemas de marca que se reconhecem antes de se lerem. Branding pela Jelly: estratégia, design e execução, nesta ordem.",
    en: "Positioning, identity and brand systems that are recognised before they are read. Branding by Jelly: strategy, design and execution, in that order.",
  },

  /* Uma frase só, a dizer o que fazemos. A primeira oração afirma; a segunda,
     no mesmo parágrafo e em tom mais baixo, fecha o argumento. */
  tese: {
    a: { pt: "Fazemos marcas que se reconhecem à primeira.", en: "We make brands people recognise at first sight." },
    b: { pt: "E que dizem o mesmo em todo o lado.", en: "And that say the same thing everywhere." },
  },

  materia: {
    eyebrow: { pt: "O trabalho", en: "The work" },
    titulo: { pt: "Marcas que trabalhámos recentemente.", en: "Brands we have worked on recently." },
    ver: { pt: "Ver o projeto", en: "See the project" },
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

  /*
   * O fecho é uma pergunta e um botão, e mais nada.
   *
   * Era um título com um parágrafo por baixo a prometer um diagnóstico de duas
   * semanas. A página inteira já é o argumento: no fim, quem chega ali não
   * precisa de mais uma explicação, precisa de uma porta. A faixa vermelha a
   * toda a largura é a porta.
   */
  fecho: {
    titulo: { pt: "Vamos falar sobre a sua nova marca?", en: "Shall we talk about your new brand?" },
    cta: { pt: "Vamos a isso", en: "Let's do it" },
  },
};
