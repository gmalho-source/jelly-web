import type { Payload } from "payload";
import type {
  ArchivedProject,
  Autor,
  Block,
  Client,
  Localized,
  LogoGallery,
  NewsItem,
  Post,
  Project,
  Service,
  TeamMember,
} from "@/content/types";
import { fromCms } from "./client";

type Doc = Record<string, unknown>;
type MediaDoc = { url?: string | null; alt?: string | null; width?: number | null; height?: number | null } | number | null | undefined;

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

/** EN em falta cai no PT: melhor a mesma frase do que um espaço vazio. */
function localized(group: unknown, fallback = ""): Localized {
  const value = (group ?? {}) as { pt?: string | null; en?: string | null };
  const pt = text(value.pt) || fallback;
  return { pt, en: text(value.en) || pt };
}

function image(media: MediaDoc) {
  if (!media || typeof media === "number" || !media.url) return undefined;
  return { src: media.url, alt: media.alt ?? undefined, width: media.width ?? undefined, height: media.height ?? undefined };
}

/** Lexical → os blocos que o ArticleBody desenha. */
function fromLexical(root: unknown): Block[] {
  const children = ((root as { root?: { children?: Doc[] } })?.root?.children ?? []) as Doc[];
  const blocks: Block[] = [];

  const plain = (node: Doc): string =>
    ((node.children ?? []) as Doc[])
      .map((child) => (typeof child.text === "string" ? child.text : plain(child)))
      .join("")
      .trim();

  for (const node of children) {
    const type = node.type as string;
    if (type === "heading") {
      const value = plain(node);
      if (value) blocks.push({ type: node.tag === "h3" ? "h3" : "h2", text: value });
    } else if (type === "quote") {
      const value = plain(node);
      if (value) blocks.push({ type: "quote", text: value });
    } else if (type === "list") {
      const items = ((node.children ?? []) as Doc[]).map(plain).filter(Boolean);
      if (items.length) blocks.push({ type: "list", ordered: node.listType === "number" || undefined, items });
    } else if (type === "upload") {
      const media = image((node.value ?? null) as MediaDoc);
      // Com as medidas reais, uma infografia alta não é cortada a 16:9.
      if (media) blocks.push({ type: "image", src: media.src, alt: media.alt, width: media.width, height: media.height });
    } else {
      const value = plain(node);
      if (value) blocks.push({ type: "p", text: value });
    }
  }
  return blocks;
}

/** Blocos de caso do Payload → os blocos que o CaseStory desenha. */
function fromStory(story: unknown): Block[] {
  const blocks: Block[] = [];
  for (const raw of (story ?? []) as Doc[]) {
    const kind = raw.blockType as string;
    if (kind === "text") {
      const heading = text(raw.heading);
      if (heading) blocks.push({ type: raw.level === "h3" ? "h3" : "h2", text: heading });
      for (const paragraph of text(raw.body).split(/\n{2,}/)) {
        if (paragraph.trim()) blocks.push({ type: "p", text: paragraph.trim() });
      }
    } else if (kind === "image") {
      const media = image(raw.image as MediaDoc);
      if (media) blocks.push({ type: "image", src: media.src, alt: media.alt });
    } else if (kind === "gallery") {
      const images = ((raw.images ?? []) as MediaDoc[])
        .map(image)
        .filter((item): item is NonNullable<ReturnType<typeof image>> => Boolean(item))
        .map(({ src, alt }) => ({ src, alt }));
      if (images.length) blocks.push({ type: "gallery", images });
    } else if (kind === "video") {
      const mp4 = text(raw.mp4);
      const webm = text(raw.webm);
      if (mp4 || webm) {
        blocks.push({
          type: "video",
          mp4: mp4 || undefined,
          webm: webm || undefined,
          poster: image(raw.poster as MediaDoc)?.src,
          portrait: Boolean(raw.portrait),
        });
      }
    } else if (kind === "embed") {
      const url = text(raw.url);
      if (url) blocks.push({ type: "embed", url });
    } else if (kind === "link") {
      const href = text(raw.href);
      const label = text(raw.label);
      if (href && label) blocks.push({ type: "link", label, href });
    }
  }
  return blocks;
}

const all = { limit: 0, depth: 2 } as const;

/**
 * O autor da peça, da tabela ou do texto antigo.
 *
 * `depth: 2` chega para trazer o autor com a fotografia dentro: um salto para o
 * autor, outro para a imagem. Sem ficha na tabela vale o campo de texto que
 * veio do site antigo — 179 artigos importados não podem ficar sem assinatura à
 * espera de serem tratados um a um.
 */
function autor(raw: Doc): Autor {
  const ficha = raw.authorRef as Doc | number | null;
  if (ficha && typeof ficha === "object") {
    return {
      name: text(ficha.name) || "Jelly",
      ...(text(ficha.role) ? { role: text(ficha.role) } : {}),
      ...(text(ficha.bio) ? { bio: text(ficha.bio) } : {}),
      ...((() => {
        const foto = image(ficha.photo as MediaDoc);
        return foto ? { photo: foto } : {};
      })()),
    };
  }
  return { name: text(raw.author) || "Jelly" };
}

export function fetchPosts(fallback: Post[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "posts", sort: "-date", ...all });
    return (docs as unknown as Doc[]).map((raw): Post => {
      const category = raw.category as Doc | number | null;
      return {
        slug: text(raw.slug),
        slugEn: text(raw.slugEn) || undefined,
        date: text(raw.date).slice(0, 10),
        author: autor(raw),
        readingMinutes: typeof raw.readingMinutes === "number" ? raw.readingMinutes : 4,
        legacyPath: text(raw.legacyPath) || undefined,
        lang: raw.lang === "en" ? "en" : "pt",
        title: { pt: text(raw.titlePt), en: text(raw.titleEn) || text(raw.titlePt) },
        excerpt: localized(raw.excerpt),
        category:
          category && typeof category === "object"
            ? {
                pt: text((category as Doc).titlePt) || "Jelly",
                en: text((category as Doc).titleEn) || text((category as Doc).titlePt) || "Jelly",
              }
            : { pt: "Jelly", en: "Jelly" },
        cover: image(raw.cover as MediaDoc),
        blocks: fromLexical(raw.body),
        blocksEn: fromLexical(raw.bodyEn),
      };
    });
  }, fallback);
}

async function projectDocs(payload: Payload) {
  const { docs } = await payload.find({ collection: "projects", sort: "order", ...all });
  return docs as unknown as (Doc & { written?: boolean })[];
}

export function fetchProjects(fallback: Project[]) {
  return fromCms(async (payload) => {
    const docs = (await projectDocs(payload)).filter((doc) => doc.written);
    return docs.map((raw): Project => {
      const headline = (raw.headline ?? {}) as Doc;
      const quote = (raw.quote ?? {}) as Doc;
      const disciplines = ((raw.disciplines as string[] | null) ?? []).join(", ");
      return {
        slug: text(raw.slug),
        slugEn: text(raw.slugEn) || undefined,
        client: text(raw.client),
        year: text(raw.year),
        order: typeof raw.order === "number" ? raw.order : 100,
        title: localized(raw.title, text(raw.client)),
        summary: localized(raw.summary),
        disciplines: { pt: disciplines, en: disciplines },
        team: localized(raw.team),
        headline: { value: text(headline.value), label: localized(headline.label) },
        kpis: ((raw.kpis ?? []) as Doc[]).map((kpi) => ({ value: text(kpi.value), label: localized(kpi.label) })),
        numbersValidated: Boolean(raw.numbersValidated),
        quote: text(quote.author)
          ? { text: localized(quote.text), author: text(quote.author), role: localized(quote.role) }
          : undefined,
      };
    });
  }, fallback);
}

export function fetchArchivedProjects(fallback: ArchivedProject[]) {
  return fromCms(async (payload) => {
    const docs = await projectDocs(payload);
    return docs.map(
      (raw): ArchivedProject => ({
        slug: text(raw.slug),
        legacyPath: text(raw.legacyPath) || null,
        client: text(raw.client),
        date: text(raw.date).slice(0, 10),
        year: text(raw.year) || text(raw.date).slice(0, 4),
        disciplines: (raw.disciplines as string[] | null) ?? [],
        subtitle: text(raw.subtitle) || undefined,
        summary: localized(raw.summary).pt,
        body: [],
        story: fromStory(raw.story),
        cover: image(raw.cover as MediaDoc) ?? null,
        images: [],
      }),
    );
  }, fallback);
}

export function fetchServices(fallback: Service[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "services", sort: "order", ...all });
    return (docs as unknown as Doc[]).map((raw): Service => ({
      slug: text(raw.slug),
      slugEn: text(raw.slugEn) || undefined,
      name: { pt: text(raw.namePt), en: text(raw.nameEn) || text(raw.namePt) },
      claim: localized(raw.claim),
      link: localized(raw.link, text(raw.namePt)),
      promise: localized(raw.promise),
      includes: ((raw.includes ?? []) as Doc[]).map((row) => localized(row.item)),
      phases: ((raw.phases ?? []) as Doc[]).map((row) => ({ name: localized(row.name), body: localized(row.body) })),
      caseSlugs: ((raw.cases ?? []) as (Doc | number)[])
        .map((item) => (typeof item === "object" && item ? text(item.slug) : ""))
        .filter(Boolean),
      accent: (raw.accent as Service["accent"]) ?? undefined,
      // A página longa. Cada peça só entra se estiver escrita: uma frase de
      // impacto meia-feita é pior do que nenhuma.
      heroTitle: text((raw.heroTitle as Doc)?.pt) ? localized(raw.heroTitle) : undefined,
      heroVideo: text(raw.heroVideo) || undefined,
      heroPoster: image(raw.heroPoster as MediaDoc),
      heroHeight: (raw.heroHeight as Service["heroHeight"]) ?? undefined,
      statement: text(((raw.statement ?? {}) as Doc).first ? ((raw.statement as Doc).first as Doc).pt : "")
        ? {
            first: localized((raw.statement as Doc).first),
            second: localized((raw.statement as Doc).second),
          }
        : undefined,
      areas: ((raw.areas ?? []) as Doc[])
        .filter((row) => text((row.title as Doc)?.pt))
        .map((row) => ({ title: localized(row.title), body: localized(row.body) })),
      essayTitle: text((raw.essayTitle as Doc)?.pt) ? localized(raw.essayTitle) : undefined,
      essay: ((raw.essay ?? []) as Doc[]).map((row) => localized(row.body)).filter((row) => row.pt),
      essayImage: image(raw.essayImage as MediaDoc),
      closing: text(((raw.closing ?? {}) as Doc).question ? ((raw.closing as Doc).question as Doc).pt : "")
        ? {
            question: localized((raw.closing as Doc).question),
            answer: localized((raw.closing as Doc).answer),
          }
        : undefined,
    }));
  }, fallback);
}

export function fetchClients(fallback: Client[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "clients", sort: "order", ...all });
    return (docs as unknown as Doc[]).map((raw): Client => ({ name: text(raw.name), sector: raw.sector as Client["sector"] }));
  }, fallback);
}

export function fetchTeam(fallback: TeamMember[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "team", sort: "order", ...all });
    return (docs as unknown as Doc[]).map((raw): TeamMember => ({ name: text(raw.name), role: localized(raw.role) }));
  }, fallback);
}

type Milestone = { year: string; pt: string; en: string };

export function fetchMilestones(fallback: Milestone[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "milestones", sort: "year", ...all });
    return (docs as unknown as Doc[]).map((raw): Milestone => ({ year: text(raw.year), ...localized(raw.body) }));
  }, fallback);
}

export function fetchNews(fallback: NewsItem[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "news", sort: "-date", ...all, depth: 1 });
    return (docs as unknown as Doc[]).map((raw): NewsItem => {
      const post = raw.post;
      return {
        slug: text(raw.slug),
        date: text(raw.date).slice(0, 10),
        kind: raw.kind as NewsItem["kind"],
        title: { pt: text(raw.titlePt), en: text(raw.titleEn) || text(raw.titlePt) },
        summary: localized(raw.summary),
        outlet: text(raw.outlet) || undefined,
        postSlug: post && typeof post === "object" ? text((post as Doc).slug) || undefined : undefined,
        postSlugEn: post && typeof post === "object" ? text((post as Doc).slugEn) || undefined : undefined,
        link: text(raw.link) || undefined,
      };
    });
  }, fallback);
}

export function fetchLogoGalleries(fallback: LogoGallery[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "logos", sort: "order", ...all });
    const byGallery = new Map<string, LogoGallery>();
    for (const raw of docs as unknown as Doc[]) {
      const media = image(raw.image as MediaDoc);
      if (!media) continue;
      const gallery = text(raw.gallery) || "Clientes";
      if (!byGallery.has(gallery)) {
        byGallery.set(gallery, { gallery, slug: gallery.toLowerCase().replace(/\s+/g, "-"), logos: [] });
      }
      byGallery.get(gallery)!.logos.push({ src: media.src, name: text(raw.name), link: text(raw.link) || null });
    }
    return [...byGallery.values()];
  }, fallback);
}

export type PageCopy = {
  slug: string;
  images: { src: string; alt?: string; width?: number; height?: number }[];
  entries: { key: string; pt?: string; en?: string }[];
};

export function fetchPageCopy(): Promise<PageCopy[]> {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "pages", limit: 0, depth: 1 });
    return (docs as unknown as Doc[]).map((raw): PageCopy => ({
      slug: text(raw.key),
      images: ((raw.images ?? []) as MediaDoc[]).map(image).filter((found): found is NonNullable<typeof found> => Boolean(found)),
      entries: ((raw.entries ?? []) as Doc[]).map((entry) => ({
        key: text(entry.key),
        pt: text(entry.pt) || undefined,
        en: text(entry.en) || undefined,
      })),
    }));
  }, []);
}
