import type { ArchivedProject, Client, Kpi, Localized, LogoGallery, NewsItem, Post, Project, Service, TeamMember } from "@/content/types";
import { query, sanity } from "./client";
import { toBlocks, type PortableTextBlock } from "./normalize";
import * as groq from "./queries";

export const sanityReady = Boolean(sanity);

type RawLocale = { pt?: string | null; en?: string | null } | null | undefined;
type RawImage = { src?: string | null; alt?: string | null; caption?: string | null; width?: number | null; height?: number | null } | null;

/** EN em falta cai no PT: melhor a mesma frase do que um espaço vazio. */
function text(value: RawLocale, fallback = ""): Localized {
  const pt = value?.pt?.trim() || fallback;
  return { pt, en: value?.en?.trim() || pt };
}

function image(value: RawImage) {
  if (!value?.src) return undefined;
  return {
    src: value.src,
    alt: value.alt ?? undefined,
    width: value.width ?? undefined,
    height: value.height ?? undefined,
  };
}

function kpi(value: { value?: string | null; label?: RawLocale } | null | undefined): Kpi {
  return { value: value?.value ?? "", label: text(value?.label) };
}

/**
 * Um pedido ao CMS que devolve zero registos é quase sempre um dataset ainda
 * vazio — nesse caso o site continua com o conteúdo local em vez de ficar em
 * branco. A troca é por coleção, o que deixa migrar uma de cada vez.
 */
async function collection<Raw, Out>(groqQuery: string, map: (raw: Raw) => Out, fallback: Out[]): Promise<Out[]> {
  if (!sanity) return fallback;
  const raw = await query<Raw[]>(groqQuery, {}, []);
  if (!raw.length) return fallback;
  return raw.map(map);
}

type RawPost = {
  slug: string;
  date: string;
  lang?: "pt" | "en" | null;
  author?: string | null;
  readingMinutes?: number | null;
  legacyPath?: string | null;
  title: RawLocale;
  excerpt: RawLocale;
  category: RawLocale;
  cover: RawImage;
  body?: PortableTextBlock[] | null;
};

export function fetchPosts(fallback: Post[]) {
  return collection<RawPost, Post>(
    groq.POSTS,
    (raw) => ({
      slug: raw.slug,
      date: raw.date,
      lang: raw.lang ?? "pt",
      author: raw.author ?? "Jelly",
      readingMinutes: raw.readingMinutes ?? 4,
      legacyPath: raw.legacyPath ?? undefined,
      title: text(raw.title),
      excerpt: text(raw.excerpt),
      category: text(raw.category, "Jelly"),
      cover: image(raw.cover),
      blocks: toBlocks(raw.body),
    }),
    fallback,
  );
}

type RawProject = {
  slug: string;
  client: string;
  year?: string | null;
  order?: number | null;
  title: RawLocale;
  summary: RawLocale;
  disciplines: RawLocale;
  team: RawLocale;
  headline?: { value?: string | null; label?: RawLocale } | null;
  kpis?: ({ value?: string | null; label?: RawLocale } | null)[] | null;
  quote?: { text?: RawLocale; author?: string | null; role?: RawLocale } | null;
};

export function fetchProjects(fallback: Project[]) {
  return collection<RawProject, Project>(
    groq.PROJECTS,
    (raw) => ({
      slug: raw.slug,
      client: raw.client,
      year: raw.year ?? "",
      order: raw.order ?? 100,
      title: text(raw.title),
      summary: text(raw.summary),
      disciplines: text(raw.disciplines),
      team: text(raw.team),
      headline: kpi(raw.headline),
      kpis: (raw.kpis ?? []).filter(Boolean).map(kpi),
      quote: raw.quote?.author
        ? { text: text(raw.quote.text), author: raw.quote.author, role: text(raw.quote.role) }
        : undefined,
    }),
    fallback,
  );
}

type RawArchived = {
  slug: string;
  legacyPath?: string | null;
  client: string;
  date?: string | null;
  year?: string | null;
  disciplines?: string[] | null;
  summary?: string | null;
  cover: RawImage;
  images?: RawImage[] | null;
};

export function fetchArchivedProjects(fallback: ArchivedProject[]) {
  return collection<RawArchived, ArchivedProject>(
    groq.ARCHIVED_PROJECTS,
    (raw) => ({
      slug: raw.slug,
      legacyPath: raw.legacyPath ?? null,
      client: raw.client,
      date: raw.date ?? "",
      year: raw.year ?? (raw.date ? raw.date.slice(0, 4) : ""),
      disciplines: raw.disciplines ?? [],
      summary: raw.summary ?? "",
      body: [],
      cover: image(raw.cover) ?? null,
      images: (raw.images ?? []).map((item) => image(item)?.src).filter((src): src is string => Boolean(src)),
    }),
    fallback,
  );
}

type RawService = {
  slug: string;
  name: RawLocale;
  claim: RawLocale;
  link: RawLocale;
  promise?: RawLocale;
  includes?: RawLocale[] | null;
  phases?: ({ name?: RawLocale; body?: RawLocale } | null)[] | null;
  caseSlugs?: (string | null)[] | null;
  accent?: Service["accent"] | null;
};

export function fetchServices(fallback: Service[]) {
  return collection<RawService, Service>(
    groq.SERVICES,
    (raw) => ({
      slug: raw.slug,
      name: text(raw.name),
      claim: text(raw.claim),
      link: text(raw.link, text(raw.name).pt),
      promise: raw.promise ? text(raw.promise) : undefined,
      includes: (raw.includes ?? []).map((item) => text(item)),
      phases: (raw.phases ?? []).filter(Boolean).map((phase) => ({ name: text(phase?.name), body: text(phase?.body) })),
      caseSlugs: (raw.caseSlugs ?? []).filter((slug): slug is string => Boolean(slug)),
      accent: raw.accent ?? undefined,
    }),
    fallback,
  );
}

export function fetchClients(fallback: Client[]) {
  return collection<{ name: string; sector: Client["sector"] }, Client>(groq.CLIENTS, (raw) => raw, fallback);
}

export function fetchTeam(fallback: TeamMember[]) {
  return collection<{ name: string; role?: RawLocale }, TeamMember>(
    groq.TEAM,
    (raw) => ({ name: raw.name, role: raw.role ? text(raw.role) : undefined }),
    fallback,
  );
}

type Milestone = { year: string; pt: string; en: string };

export function fetchMilestones(fallback: Milestone[]) {
  return collection<{ year: string; body: RawLocale }, Milestone>(
    groq.MILESTONES,
    (raw) => ({ year: raw.year, ...text(raw.body) }),
    fallback,
  );
}

export function fetchNews(fallback: NewsItem[]) {
  return collection<
    { slug: string; date: string; kind: NewsItem["kind"]; outlet?: string | null; title: RawLocale; summary?: RawLocale },
    NewsItem
  >(
    groq.NEWS,
    (raw) => ({
      slug: raw.slug,
      date: raw.date,
      kind: raw.kind,
      outlet: raw.outlet ?? undefined,
      title: text(raw.title),
      summary: raw.summary ? text(raw.summary) : undefined,
    }),
    fallback,
  );
}

export function fetchLogoGalleries(fallback: LogoGallery[]) {
  return collection<
    { gallery: string; slug?: string | null; logos?: ({ name?: string | null; link?: string | null; src?: string | null } | null)[] | null },
    LogoGallery
  >(
    groq.LOGO_GALLERIES,
    (raw) => ({
      gallery: raw.gallery,
      slug: raw.slug ?? raw.gallery.toLowerCase(),
      logos: (raw.logos ?? [])
        .filter((logo): logo is { name?: string | null; link?: string | null; src: string } => Boolean(logo?.src))
        .map((logo) => ({ src: logo.src, name: logo.name ?? "", link: logo.link ?? null })),
    }),
    fallback,
  );
}
