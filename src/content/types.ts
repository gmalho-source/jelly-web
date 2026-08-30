import type { Locale } from "@/i18n/routing";

/** Texto traduzido. Espelha o par { pt, en } que o painel devolve. */
export type Localized = Record<Locale, string>;

export type Kpi = { value: string; label: Localized };

export type Project = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
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
  quote?: { text: Localized; author: string; role: Localized };
};

export type Phase = { name: Localized; body: Localized };

export type Service = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
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

export type Client = { name: string; sector: "financeiro" | "saude" | "bebidas" | "consumo" | "retalho" | "industria" | "construcao" | "transportes" | "servicos" | "ong" | "arte" | "eventos" | "lazer" | "tecnologia" };

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
  bio?: string;
  photo?: { src: string; alt?: string; width?: number; height?: number };
};

export type Post = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
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
  legacyPath?: string;
  lang?: "pt" | "en";
  draft?: boolean;
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
  | { type: "gallery"; images: { src: string; alt?: string }[] }
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
  legacyPath: string | null;
  client: string;
  /**
   * Esconder a capa no corpo da página.
   *
   * Só no corpo: a capa continua a identificar o projeto na grelha, no índice e
   * como primeiro fotograma dos vídeos do caso. Em negativo de propósito — os
   * projetos que já existem têm o campo vazio, e um campo vazio tem de querer
   * dizer «mostra», que é o que o site fazia antes de isto existir.
   */
  hideCoverInBody?: boolean;
  date: string;
  year: string;
  disciplines: string[];
  /** Linha curta que o site antigo punha debaixo do nome do cliente. */
  subtitle?: string;
  summary: string;
  body: string[];
  /** Narrativa do caso, como estava no construtor de páginas do site antigo. */
  story: Block[];
  cover?: { src: string; alt?: string; title?: string } | null;
  images: string[];
};

export type LogoGallery = {
  gallery: string;
  slug: string;
  logos: { src: string; name: string; link: string | null }[];
};

/** Uma pergunta que só existe numa vaga. */
export type JobQuestion = {
  type: "escolha" | "varias" | "curto" | "longo" | "numero";
  required: boolean;
  label: Localized;
  options: Localized[];
};

/** Uma vaga aberta, como o site a mostra. */
export type Job = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  title: Localized;
  department: { slug: string; name: Localized };
  functionName: Localized;
  contract?: "contrato" | "estagio" | "freelancer";
  regime?: "presencial" | "hibrido" | "remoto";
  seniority?: "junior" | "intermedio" | "senior";
  location?: string;
  /** ISO, ou vazio quando a vaga não tem prazo. */
  deadline?: string;
  intro: Localized;
  responsibilities: Localized[];
  requirements: Localized[];
  niceToHave: Localized[];
  benefits: Localized[];
  closing: Localized;
  questions: JobQuestion[];
  legacyPath?: string;
};

/** Uma área da agência, para agrupar as vagas e as candidaturas espontâneas. */
export type Department = { slug: string; name: Localized; order: number };
