/**
 * O press kit da Jelly (/press e /en/press): os textos nas duas línguas e os
 * ficheiros. Os ficheiros vivem em public/press — fotografias em tamanho de
 * página (web/) e em alta resolução para descarregar (hires/), logótipos, os
 * PDFs e o ZIP com tudo. Para mudar o press kit, troca-se aqui o texto e lá os
 * ficheiros, com os mesmos nomes.
 */
export type Lang = "pt" | "en";

export const BASE = "/press";

export const photos = {
  event: { file: "jelly-evento-set-2026.jpg", w: 1672, h: 941 },
  presentation: { file: "jelly-apresentacao-set-2026.jpg", w: 3000, h: 2000 },
  goncaloReception: { file: "goncalo-malho-rodrigues-rececao.jpg", w: 3120, h: 2080 },
  goncaloPortraits: [1, 2, 3].map((n) => ({
    file: `goncalo-malho-rodrigues-retrato-${n}.jpg`,
    w: 4096,
    h: 4096,
  })),
  mariaPhotos: [1, 2, 3, 4].map((n) => ({
    file: `maria-felix-da-costa-${n}.jpg`,
    w: 3000,
    h: 2000,
  })),
};

export const web = (file: string) => `${BASE}/web/${file}`;
export const hires = (file: string) => `${BASE}/hires/${file}`;

export const pdf = (lang: Lang) => `${BASE}/Jelly-PressKit-2026-${lang.toUpperCase()}.pdf`;
export const zip = `${BASE}/Jelly-PressKit-2026.zip`;

export const colors = [
  { name: "Jelly Red", hex: "#DD364A" },
  { name: "Deep Red", hex: "#9D141C" },
  { name: "Coral", hex: "#FF9AA5" },
  { name: "Lavender", hex: "#C3ABFF" },
  { name: "Chartreuse", hex: "#DCE277" },
  { name: "Slate", hex: "#2A384A" },
  { name: "Ink", hex: "#151719" },
  { name: "Paper", hex: "#F4F6F8" },
];

export const logos = [
  { key: "color", file: "jelly-logo-color", bg: "#ffffff" },
  { key: "white", file: "jelly-logo-white", bg: "#dd364a" },
  { key: "black", file: "jelly-logo-black", bg: "#dcdfe3" },
] as const;

export const clients = [
  { name: "Cetelem", file: "cetelem.png", dark: false, w: 600, h: 229 },
  { name: "Slide & Splash", file: "slide-and-splash-branco.png", dark: true, w: 600, h: 158 },
  { name: "Generali Tranquilidade", file: "generali-tranquilidade.svg", dark: false, w: 300, h: 100 },
  { name: "Savills", file: "savills.png", dark: false, w: 600, h: 400 },
];

export const otherClients = [
  "Novobanco", "Montblanc", "Decathlon", "Heineken", "Native Açaí",
  "Hilton", "Marriott", "TDA", "Vorwerk", "Central de Cervejas",
];

export const copy = {
  pt: {
    htmlLang: "pt-PT",
    metaTitle: "Press kit | Jelly",
    metaDescription:
      "Informação oficial, fotografias e materiais de marca da Jelly para jornalistas e meios de comunicação.",
    eyebrow: "Press kit · 2026",
    lead: "Informação oficial, fotografias e materiais de marca da Jelly para jornalistas e meios de comunicação.",
    pdfLabel: "Versão PDF →",
    zipLabel: "Descarregar press kit completo (ZIP)",
    zipHint: "PDFs, logótipos, fotografias em alta resolução e paleta. Cerca de 18 MB.",
    eventAlt: "Evento Jelly, setembro 2026",
    aboutTitle: "Sobre a Jelly",
    aboutP1:
      "A Jelly é uma agência digital, com foco em estratégia de marketing, content e performance marketing. Na frente tecnológica, a Jelly tem know-how e um extenso historial no desenvolvimento de websites, ecommerce e sistemas de Inteligência Artificial.",
    aboutP2:
      "Fundada em dezembro de 2010 por Gonçalo Malho Rodrigues, a Jelly conta com uma equipa sólida de 20 colaboradores, mais de 150 clientes ativos e centenas de projetos realizados desde a sua fundação. Em 2022, a Jelly passou a ser detida maioritariamente pela gestora de ativos Route66.",
    stats: [
      { n: "2010", l: "Fundação, em dezembro" },
      { n: "150+", l: "Clientes ativos" },
      { n: "20", l: "Colaboradores" },
      { n: "2022", l: "Route66 torna-se acionista maioritária" },
    ],
    leadership: "Liderança",
    goncaloRole: "Fundador da Jelly",
    goncaloBio: [
      "Quando fundou a Jelly em 2010, já tinha um negócio a acontecer. Com um percurso ligado ao marketing, comunicação e tecnologia, Gonçalo Malho Rodrigues, tem desenvolvido e liderado projetos no digital, respondendo ao desafio de articular marketing, comunicação e tecnologia, à estratégia das marcas.",
      "Na Jelly, lidera a visão estratégica da agência, apoiando a equipa e clientes a tomar melhores decisões num contexto digital cada vez mais complexo e, por isso, mais exigente.",
    ],
    goncaloPortraitsNote: "Retratos em alta resolução. Clicar para descarregar.",
    mariaRole: "COO",
    mariaBio:
      "Maria Félix da Costa traz à Jelly uma combinação de formação académica sólida e experiência prática. Licenciada em Gestão de Marketing, complementou os seus estudos com duas pós-graduações e vários cursos especializados, destacando-se pela busca constante de atualização no mercado digital. Atualmente, encontra-se a frequentar um Master Internacional focado em performance.",
    mariaPhotosNote: "Fotografias em alta resolução. Clicar para descarregar.",
    servicesTitle: "Serviços",
    services: [
      { title: "Marketing", items: ["Branding", "Estratégia de marketing", "Content", "Performance marketing"] },
      { title: "Tecnologia", items: ["Websites", "E-commerce", "Sistemas de Inteligência Artificial"] },
    ],
    clientsTitle: "Clientes e casos de estudo",
    clientDesc: [
      "Comunicação digital da marca",
      "Estratégia de marketing digital (conteúdo e performance) + website",
      "Design de comunicação",
      "Marketing digital, eventos e ativação de marca",
    ],
    otherClientsTitle: "Outros clientes",
    logosTitle: "Logótipos e regras de uso",
    logoLabels: { color: "Principal · vermelho", white: "Branco", black: "Preto" },
    rules: [
      ["Cor.", "Vermelho sobre fundos claros; branco sobre vermelho, escuro ou fotografia; preto quando o vermelho não é possível."],
      ["Espaço e tamanho.", "Margem livre igual à altura das maiúsculas. Mínimo de 80 px em ecrã e 20 mm em impressão."],
      ["Não fazer.", "Não recolorir, distorcer, rodar, aplicar efeitos ou recriar o logótipo noutra fonte."],
    ],
    colorsTitle: "Cores e tipografia",
    fontHeadline: "Títulos",
    fontBody: "Texto",
    photosTitle: "Fotografias",
    photoCaptions: {
      event: "Evento Jelly, setembro 2026",
      presentation: "Apresentação, setembro 2026",
      goncalo: "Gonçalo Malho Rodrigues, receção Jelly",
      maria: "Maria Félix da Costa, apresentação, setembro 2026",
    },
    contactTitle: "Contacto de imprensa",
    portraitAlt: (n: number) => `Gonçalo Malho Rodrigues, retrato ${n}`,
    mariaAlt: (n: number) => `Maria Félix da Costa, fotografia ${n}`,
    download: "Descarregar",
    altLang: "EN",
    switchLabel: "Mudar idioma",
  },
  en: {
    htmlLang: "en",
    metaTitle: "Press kit | Jelly",
    metaDescription:
      "Official information, photography and brand materials from Jelly for journalists and media.",
    eyebrow: "Press kit · 2026",
    lead: "Official information, photography and brand materials from Jelly for journalists and media.",
    pdfLabel: "PDF version →",
    zipLabel: "Download full press kit (ZIP)",
    zipHint: "PDFs, logos, high-resolution photos and colour palette. About 18 MB.",
    eventAlt: "Jelly event, September 2026",
    aboutTitle: "About Jelly",
    aboutP1:
      "Jelly is a digital agency focused on marketing strategy, content and performance marketing. On the technology side, Jelly has the know-how and an extensive track record in developing websites, e-commerce and Artificial Intelligence systems.",
    aboutP2:
      "Founded in December 2010 by Gonçalo Malho Rodrigues, Jelly has a solid team of 20 people, more than 150 active clients and hundreds of projects delivered since it was founded. In 2022, Jelly became majority-owned by the asset manager Route66.",
    stats: [
      { n: "2010", l: "Founded in December" },
      { n: "150+", l: "Active clients" },
      { n: "20", l: "Team members" },
      { n: "2022", l: "Route66 becomes majority shareholder" },
    ],
    leadership: "Leadership",
    goncaloRole: "Founder of Jelly",
    goncaloBio: [
      "When he founded Jelly in 2010, he already had a business up and running. With a background in marketing, communication and technology, Gonçalo Malho Rodrigues has developed and led digital projects, taking on the challenge of aligning marketing, communication and technology with brand strategy.",
      "At Jelly, he leads the agency's strategic vision, helping the team and clients make better decisions in an increasingly complex, and therefore more demanding, digital context.",
    ],
    goncaloPortraitsNote: "High-resolution portraits. Click to download.",
    mariaRole: "COO",
    mariaBio:
      "Maria Félix da Costa brings Jelly a combination of solid academic training and hands-on experience. With a degree in Marketing Management, she complemented her studies with two postgraduate degrees and several specialised courses, standing out for her constant drive to keep up with the digital market. She is currently attending an International Master's focused on performance.",
    mariaPhotosNote: "High-resolution photos. Click to download.",
    servicesTitle: "Services",
    services: [
      { title: "Marketing", items: ["Branding", "Marketing strategy", "Content", "Performance marketing"] },
      { title: "Technology", items: ["Websites", "E-commerce", "Artificial Intelligence systems"] },
    ],
    clientsTitle: "Clients and case studies",
    clientDesc: [
      "Digital brand communication",
      "Digital marketing strategy (content and performance) + website",
      "Communication design",
      "Digital marketing, events and brand activation",
    ],
    otherClientsTitle: "Other clients",
    logosTitle: "Logos and usage",
    logoLabels: { color: "Primary · red", white: "White", black: "Black" },
    rules: [
      ["Colour.", "Red on light backgrounds; white on red, dark or photography; black when red isn't possible."],
      ["Space and size.", "Clear space equal to the cap height. Minimum 80 px on screen and 20 mm in print."],
      ["Don't.", "Recolour, distort, rotate, add effects to, or redraw the logo in another typeface."],
    ],
    colorsTitle: "Colours and typography",
    fontHeadline: "Headlines",
    fontBody: "Body text",
    photosTitle: "Photography",
    photoCaptions: {
      event: "Jelly event, September 2026",
      presentation: "Presentation, September 2026",
      goncalo: "Gonçalo Malho Rodrigues, Jelly reception",
      maria: "Maria Félix da Costa, presentation, September 2026",
    },
    contactTitle: "Press contact",
    portraitAlt: (n: number) => `Gonçalo Malho Rodrigues, portrait ${n}`,
    mariaAlt: (n: number) => `Maria Félix da Costa, photo ${n}`,
    download: "Download",
    altLang: "PT",
    switchLabel: "Switch language",
  },
} as const;
