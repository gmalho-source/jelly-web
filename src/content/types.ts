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
  /** Corpo em parágrafos. Rascunho enquanto o conteúdo real não é migrado. */
  body?: Localized[];
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
