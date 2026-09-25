import type { Locale } from "@/i18n/routing";

/** Texto traduzido. Espelha o par { pt, en } que o painel devolve. */
export type Localized = Record<Locale, string>;

export type Kpi = { value: string; label: Localized };

export type Project = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  /** Endereços que esta peça já teve. Quem chega por um leva 308 para o atual. */
  oldSlugs?: string[];
  client: string;
  year: string;
  order: number;
  title: Localized;
  summary: Localized;
  disciplines: Localized;
  team: Localized;
  headline: Kpi;
  kpis: Kpi[];
  /** Os números só vão para o ecrã depois de validados com o cliente. */
  numbersValidated?: boolean;
  quote?: Citacao;
};

/** O testemunho do cliente, com a fotografia de quem o deu, se houver. */
export type Citacao = {
  text: Localized;
  author: string;
  role: Localized;
  photo?: { src: string; alt?: string } | null;
};

export type Phase = { name: Localized; body: Localized };

export type Service = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  /** Endereços que esta peça já teve. Quem chega por um leva 308 para o atual. */
  oldSlugs?: string[];
  name: Localized;
  claim: Localized;
  link: Localized;
  /** Página de serviço */
  promise?: Localized;
  includes?: Localized[];
  phases?: Phase[];
  caseSlugs?: string[];
  accent?: "lavender" | "chartreuse" | "coral";
  /**
   * A página longa. Tudo opcional: sem isto a página é a curta, com o claim, o
   * que inclui e as fases. Com isto ganha topo em vídeo, frase de impacto,
   * áreas e texto — a forma que as páginas de serviço do site antigo tinham.
   */
  heroTitle?: Localized;
  heroVideo?: string;
  heroPoster?: { src: string; alt?: string; width?: number; height?: number };
  heroHeight?: "curto" | "medio" | "alto";
  statement?: { first: Localized; second: Localized };
  areas?: { title: Localized; body: Localized }[];
  essayTitle?: Localized;
  essay?: Localized[];
  essayImage?: { src: string; alt?: string; width?: number; height?: number };
  closing?: { question: Localized; answer: Localized };
};

export type Client = { name: string; sector: "financeiro" | "saude" | "bebidas" | "alimentar" | "consumo" | "retalho" | "industria" | "construcao" | "imobiliario" | "transportes" | "servicos" | "ong" | "arte" | "eventos" | "lazer" | "tecnologia" };

export type TeamMember = {
  name: string;
  role?: Localized;
  /**
   * A apresentação que a pessoa escreveu, em português. O inglês não está aqui:
   * faz-se no painel, com o botão de traduzir, e é de lá que o site o serve.
   * Sem ele, o site inglês serve o português — mais vale isso do que uma página
   * vazia, e melhor do que um campo `en` a dizer que o português é inglês.
   */
  bio?: Partial<Localized>;
  /** O retrato a preto e branco: o que se vê na grelha. */
  photo?: { src: string; alt?: string; width?: number; height?: number };
  /** O retrato a cores: o que aparece quando se abre a pessoa. */
  photoColor?: { src: string; alt?: string; width?: number; height?: number };
  linkedin?: string;
};

/**
 * Quem assina um artigo.
 *
 * Era uma string. Passou a isto quando os autores ganharam tabela própria: um
 * nome sozinho não dá para desenhar a assinatura no fim de um texto, que é o
 * sítio onde se quer ver a cara e a função de quem escreveu.
 */
export type Autor = {
  name: string;
  role?: string;
  /** A frase de apresentação, com a marcação que o painel deixa escrever. */
  bio?: Span[];
  photo?: { src: string; alt?: string; width?: number; height?: number };
};

export type Post = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  /** Endereços que esta peça já teve. Quem chega por um leva 308 para o atual. */
  oldSlugs?: string[];
  date: string;
  category: Localized;
  /**
   * Aquilo de que o artigo fala. A categoria é a prateleira — uma; estas são o
   * assunto, e são quantas forem precisas.
   */
  tags?: { slug: string; name: Localized }[];
  author: Autor;
  readingMinutes: number;
  title: Localized;
  excerpt: Localized;
  /** Corpo em parágrafos, dos artigos de estrutura escritos à mão. */
  body?: Localized[];
  /** Corpo migrado do WordPress, em blocos. */
  blocks?: Block[];
  /** Corpo traduzido. Vazio, o site em inglês serve o português. */
  blocksEn?: Block[];
  cover?: { src: string; alt?: string; width?: number; height?: number };
  /**
   * A capa inglesa, quando a portuguesa não serve.
   *
   * Quase sempre serve: uma fotografia não tem língua. Serve mal quando tem
   * texto lá dentro. Vazia, o inglês usa a portuguesa.
   */
  coverEn?: { src: string; alt?: string; width?: number; height?: number };
  /** O artigo lido em voz alta, quando já foi gerado. Uma entrada por língua. */
  audio?: Partial<Record<"pt" | "en", { src: string; segundos?: number; voz?: string }>>;
  legacyPath?: string;
  lang?: "pt" | "en";
  draft?: boolean;
};

/**
 * Um plano JellyCARE, como o painel o descreve.
 *
 * Vive no CMS porque é o que se negoceia: o preço, o nome, as linhas do cartão
 * e a campanha de arranque. O que está no repositório é a rede de segurança.
 */
export type CarePlan = {
  key: string;
  name: string;
  price: number;
  badge?: Localized;
  features: Localized[];
  /** A campanha, já filtrada: se não está a decorrer ou passou a data, não vem. */
  campaign?: { label?: Localized; firstPrice?: number; until?: string };
};

export type NewsKind = "noticia" | "evento" | "press";

export type NewsItem = {
  slug: string;
  date: string;
  kind: NewsKind;
  title: Localized;
  summary?: Localized;
  outlet?: string;
  /** Artigo do blog, quando a notícia tem um. */
  postSlug?: string;
  /** O mesmo artigo, no endereço inglês. */
  postSlugEn?: string;
  /** Endereço de fora, quando não há artigo. */
  link?: string;
};

/** Trecho de texto com marcação inline. Vem do Portable Text do CMS. */
export type Span = { text: string; bold?: boolean; italic?: boolean; href?: string };

/** Bloco de corpo de artigo, como sai da migração do WordPress ou do CMS. */
export type Block =
  | { type: "p"; text: string; spans?: Span[] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "image"; src: string; alt?: string; caption?: string; width?: number; height?: number; float?: "left" | "right" }
  /* Blocos que só aparecem em casos: o corpo dos artigos não os usa. */
  | { type: "gallery"; images: { src: string; alt?: string; legenda?: string; width?: number; height?: number }[] }
  | { type: "video"; mp4?: string; webm?: string; poster?: string; portrait?: boolean; modo?: "ambiente" | "filme" }
  | { type: "embed"; url: string; caption?: string }
  | { type: "link"; label: string; href: string }
  /** Dois a quatro conjuntos de blocos lado a lado. Não se aninha em si mesmo. */
  | { type: "columns"; columns: Block[][] };

/** Artigo migrado do jelly.pt. Uma língua por registo (hoje só PT). */
export type MigratedPost = {
  slug: string;
  legacyPath: string;
  date: string;
  updated?: string;
  lang: "pt" | "en";
  title: string;
  excerpt: string;
  author: string;
  category: string;
  categorySlug: string;
  readingMinutes: number;
  cover?: { src: string; alt?: string; width?: number; height?: number } | null;
  body: Block[];
};

/** Projeto migrado do portfolio antigo: sem narrativa nem número — arquivo. */
export type ArchivedProject = {
  slug: string;
  /** Endereços que este projeto já teve. Quem chega por um leva 308 para o atual. */
  oldSlugs?: string[];
  legacyPath: string | null;
  client: string;
  /** A imagem do topo da página. Vazia, o topo usa a capa. */
  heroImage?: { src: string; alt?: string; title?: string } | null;
  date: string;
  year: string;
  disciplines: string[];
  /** Linha curta que o site antigo punha debaixo do nome do cliente. */
  subtitle?: string;
  summary: string;
  /** O resumo em inglês. Vazio, o site inglês usa o português. */
  summaryEn?: string;
  body: string[];
  /** Narrativa do caso, como estava no construtor de páginas do site antigo. */
  story: Block[];
  /**
   * A mesma história, com os textos em inglês. A estrutura é a mesma — sai do
   * mesmo sítio no painel — e cada bloco por traduzir serve o português.
   */
  storyEn?: Block[];
  cover?: { src: string; alt?: string; title?: string } | null;
  images: string[];
  /**
   * O testemunho do cliente. Vive no mesmo registo que o caso escrito, mas não
   * depende dele: um projeto de arquivo também pode ter quem fale por ele.
   */
  quote?: Citacao;
};

export type LogoGallery = {
  gallery: string;
  slug: string;
  logos: LogoOnWall[];
};

/**
 * Uma marca numa parede. Sem imagem, é o nome que vai para o ecrã: é o que
 * mantém uma faixa de parceiros completa enquanto faltam os selos que só o
 * próprio parceiro emite.
 */
export type LogoOnWall = {
  src: string | null;
  name: string;
  link: string | null;
  /** Do ficheiro. É a forma da marca que decide o tamanho a que ela se desenha. */
  width?: number;
  height?: number;
};

/** Uma pergunta que só existe numa vaga. */
export type JobQuestion = {
  type: "escolha" | "varias" | "curto" | "longo" | "numero";
  required: boolean;
  label: Localized;
  options: Localized[];
};

/** Uma vaga aberta, como o site a mostra. */
/**
 * Texto corrido com marcação, nas duas línguas.
 *
 * A abertura e o fecho de uma vaga escrevem-se no painel como se escreve um
 * artigo — parágrafos, negrito, itálico, links — e chegam aqui já em blocos.
 */
export type Paragrafos = { pt: Block[]; en: Block[] };

/**
 * Uma linha com marcação, nas duas línguas.
 *
 * Cada ponto das listas de uma vaga. É uma linha e não um corpo: a lista já é
 * a lista, e o que se marca é uma palavra dentro da frase.
 */
export type LinhaMarcada = { pt: Span[]; en: Span[] };

export type Job = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  /** Endereços que esta peça já teve. Quem chega por um leva 308 para o atual. */
  oldSlugs?: string[];
  title: Localized;
  department: { slug: string; name: Localized };
  functionName: Localized;
  contract?: "contrato" | "estagio" | "freelancer";
  regime?: "presencial" | "hibrido" | "remoto";
  seniority?: "junior" | "intermedio" | "senior";
  location?: string;
  /** ISO, ou vazio quando a vaga não tem prazo. */
  deadline?: string;
  intro: Paragrafos;
  responsibilities: LinhaMarcada[];
  requirements: LinhaMarcada[];
  niceToHave: LinhaMarcada[];
  benefits: LinhaMarcada[];
  closing: Paragrafos;
  questions: JobQuestion[];
  legacyPath?: string;
};

/** Uma área da agência, para agrupar as vagas e as candidaturas espontâneas. */
export type Department = { slug: string; name: Localized; order: number };
