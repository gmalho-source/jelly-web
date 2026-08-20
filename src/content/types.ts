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

export type Service = {
  slug: string;
  name: Localized;
  claim: Localized;
  link: Localized;
};

export type Client = { name: string };
