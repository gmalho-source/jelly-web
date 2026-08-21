import type { Locale } from "@/i18n/routing";

/** Texto traduzido. Espelha o campo localizado que o Sanity vai devolver. */
export type Localized = Record<Locale, string>;

export type Kpi = { value: string; label: Localized };

export type Project = {
  slug: string;
  client: string;
  year: string;
  order: number;
  title: Localized;
  summary: Localized;
  disciplines: Localized;
  team: Localized;
  headline: Kpi;
  kpis: Kpi[];
  quote?: { text: Localized; author: string; role: Localized };
};

export type Phase = { name: Localized; body: Localized };

export type Service = {
  slug: string;
  name: Localized;
  claim: Localized;
  link: Localized;
  /** Página de serviço */
  promise?: Localized;
  includes?: Localized[];
  phases?: Phase[];
  caseSlugs?: string[];
  accent?: "lavender" | "chartreuse" | "coral";
};

export type Client = { name: string; sector: "financeiro" | "retalho" | "industria" | "servicos" | "lazer" | "tecnologia" };

export type TeamMember = { name: string; role?: Localized };

export type Post = {
  slug: string;
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
};

/** Bloco de corpo de artigo, como sai da migração do WordPress. */
export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "image"; src: string; alt?: string; caption?: string };

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
  summary: string;
  body: string[];
  cover?: { src: string; alt?: string; title?: string } | null;
  images: string[];
};

export type LogoGallery = {
  gallery: string;
  slug: string;
  logos: { src: string; name: string; link: string | null }[];
};
