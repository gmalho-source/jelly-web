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
  statement?: { first: Localized; second: Localized };
  areas?: { title: Localized; body: Localized }[];
  essayTitle?: Localized;
  essay?: Localized[];
  essayImage?: { src: string; alt?: string; width?: number; height?: number };
  closing?: { question: Localized; answer: Localized };
};

export type Client = { name: string; sector: "financeiro" | "saude" | "bebidas" | "consumo" | "retalho" | "industria" | "construcao" | "servicos" | "arte" | "eventos" | "lazer" | "tecnologia" };

export type TeamMember = { name: string; role?: Localized };

export type Post = {
  slug: string;
  /** Endereço em inglês. Vazio, o inglês usa o português. */
  slugEn?: string;
  date: string;
  category: Localized;
  author: string;
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
  | { type: "image"; src: string; alt?: string; caption?: string; width?: number; height?: number }
  /* Blocos que só aparecem em casos: o corpo dos artigos não os usa. */
  | { type: "gallery"; images: { src: string; alt?: string }[] }
  | { type: "video"; mp4?: string; webm?: string; poster?: string; portrait?: boolean }
  | { type: "embed"; url: string }
  | { type: "link"; label: string; href: string };

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
