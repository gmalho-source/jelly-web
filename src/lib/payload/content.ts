import type { Payload } from "payload";
import type {
  ArchivedProject,
  Autor,
  Block,
  Client,
  Department,
  Job,
  JobQuestion,
  Localized,
  LogoGallery,
  NewsItem,
  Post,
  Project,
  Service,
  Span,
  TeamMember,
} from "@/content/types";
import { fromCms, getCms } from "./client";

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

  /*
   * A marcação de dentro do parágrafo: negrito, itálico e links.
   *
   * O `format` do Lexical é um mapa de bits — 1 é negrito, 2 é itálico — e um
   * link é um nó com os filhos dentro. Sem isto, quem escrevesse um link no
   * painel via-o publicado como texto morto: não falhava nada, só deixava de
   * ser link. Ninguém dá por isso a tempo.
   */
  const spans = (node: Doc, href?: string): Span[] => {
    const saida: Span[] = [];
    for (const child of (node.children ?? []) as Doc[]) {
      if (typeof child.text === "string") {
        if (!child.text) continue;
        const format = typeof child.format === "number" ? child.format : 0;
        saida.push({
          text: child.text,
          ...(format & 1 ? { bold: true } : {}),
          ...(format & 2 ? { italic: true } : {}),
          ...(href ? { href } : {}),
        });
      } else if (child.type === "link" || child.type === "autolink") {
        const campos = (child.fields ?? {}) as { url?: string };
        saida.push(...spans(child, text(campos.url) || href));
      } else {
        saida.push(...spans(child, href));
      }
    }
    return saida;
  };

  /** Só vale a pena guardar os pedaços quando há mesmo marcação. */
  const paragrafo = (node: Doc): Block | undefined => {
    const value = plain(node);
    if (!value) return undefined;
    const pedacos = spans(node);
    const marcado = pedacos.some((pedaco) => pedaco.bold || pedaco.italic || pedaco.href);
    return marcado ? { type: "p", text: value, spans: pedacos } : { type: "p", text: value };
  };

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
      // A posição e a legenda são campos do próprio nó, escolhidos imagem a
      // imagem no editor. Só «esquerda» e «direita» contam: qualquer outra
      // coisa — incluindo as imagens que já lá estavam, sem campo nenhum — é a
      // largura do texto, que era o que havia antes.
      const campos = (node.fields ?? {}) as Doc;
      const posicao = text(campos.align);
      const legenda = text(campos.caption);
      // Com as medidas reais, uma infografia alta não é cortada a 16:9.
      if (media) {
        blocks.push({
          type: "image",
          src: media.src,
          alt: media.alt,
          width: media.width,
          height: media.height,
          ...(posicao === "left" || posicao === "right" ? { float: posicao } : {}),
          ...(legenda ? { caption: legenda } : {}),
        });
      }
    } else if (type === "block") {
      // O bloco de vídeo do editor. O endereço é que manda: quem desenha
      // decide-se mais tarde, pelo que ele é.
      const campos = (node.fields ?? {}) as Doc;
      if (campos.blockType === "video") {
        const url = text(campos.url);
        const caption = text(campos.caption);
        if (url) blocks.push({ type: "embed", url, ...(caption ? { caption } : {}) });
      }
    } else {
      const bloco = paragrafo(node);
      if (bloco) blocks.push(bloco);
    }
  }
  return blocks;
}

/**
 * Blocos de caso do Payload → os blocos que o CaseStory desenha, numa língua.
 *
 * A história é uma só no painel, com os textos nas duas línguas lado a lado, e
 * sai daqui duas vezes: uma em português e outra em inglês. O que se guarda é a
 * estrutura, que é a mesma; o que muda é a língua de cada texto.
 *
 * Sem inglês, serve o português. Mais vale um caso em português do que uma
 * página com buracos — e um bloco por traduzir não deve fazer desaparecer a
 * imagem que está a seguir.
 */
function fromStory(story: unknown, lingua: "pt" | "en" = "pt"): Block[] {
  const blocks: Block[] = [];
  for (const raw of (story ?? []) as Doc[]) {
    const kind = raw.blockType as string;
    /** O texto na língua pedida, com o português a servir de rede. */
    const naLingua = (campo: string) =>
      (lingua === "en" ? text(raw[`${campo}En`]) : "") || text(raw[campo]);
    if (kind === "text") {
      const heading = naLingua("heading");
      if (heading) blocks.push({ type: raw.level === "h3" ? "h3" : "h2", text: heading });
      for (const paragraph of naLingua("body").split(/\n{2,}/)) {
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
      // O ficheiro carregado ganha ao endereço escrito à mão: quem arrastou um
      // vídeo para o campo quer esse, e não o que lá estava antes. O endereço
      // continua a servir os vídeos que vivem noutro sítio — são trinta e
      // quatro, ainda no site antigo.
      const carregado = raw.ficheiro;
      const doArmazenamento =
        carregado && typeof carregado === "object" ? text((carregado as Doc).url) : "";
      const mp4 = doArmazenamento || text(raw.mp4);
      const webm = doArmazenamento ? "" : text(raw.webm);
      if (mp4 || webm) {
        blocks.push({
          type: "video",
          mp4: mp4 || undefined,
          webm: webm || undefined,
          poster: image(raw.poster as MediaDoc)?.src,
          portrait: Boolean(raw.portrait),
          modo: raw.modo === "filme" ? "filme" : undefined,
        });
      }
    } else if (kind === "embed") {
      const url = text(raw.url);
      if (url) blocks.push({ type: "embed", url });
    } else if (kind === "colunas") {
      // Cada coluna é uma história pequena: o mesmo leitor, chamado outra vez.
      // Uma coluna vazia não conta — duas colunas com uma delas em branco é uma
      // coluna com um buraco ao lado.
      const colunas = ((raw.colunas ?? []) as Doc[])
        .map((coluna) => fromStory(coluna.blocos, lingua))
        .filter((coluna) => coluna.length);
      if (colunas.length > 1) blocks.push({ type: "columns", columns: colunas });
    } else if (kind === "link") {
      const href = text(raw.href);
      const label = naLingua("label");
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

/**
 * A lista dos artigos, sem os corpos.
 *
 * Isto é uma correcção de um erro caro. A leitura trazia os 179 artigos com o
 * texto todo — 3,7 MB — e a entrada não caber nos 2 MB que o cache do Next
 * aceita: falhava a escrita em silêncio e cada página voltava a ler tudo à base.
 * E como a barra do topo mostra artigos, «cada página» era o site inteiro. Um só
 * build fez 518 leituras dessas.
 *
 * Agora o `select` deixa os corpos de fora, e a diferença não é só no cache: a
 * base deixa de os enviar. O corpo de um artigo vai-se buscar quando é preciso —
 * um, o que se está a ler — em `fetchPostBody`.
 */
export function fetchPosts(fallback: Post[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({
      collection: "posts",
      sort: "-date",
      ...all,
      select: { body: false, bodyEn: false },
    });
    return (docs as unknown as Doc[]).map((raw): Post => {
      const category = raw.category as Doc | number | null;
      // As etiquetas chegam como documentos quando há profundidade e como
      // números quando não há. Sem nome não servem para nada aqui, e por isso as
      // que vierem por resolver caem.
      const etiquetas = (Array.isArray(raw.tags) ? raw.tags : [])
        .filter((etiqueta): etiqueta is Doc => Boolean(etiqueta) && typeof etiqueta === "object")
        .map((etiqueta) => ({
          slug: text(etiqueta.slug),
          name: {
            pt: text(etiqueta.titlePt),
            en: text(etiqueta.titleEn) || text(etiqueta.titlePt),
          },
        }))
        .filter((etiqueta) => etiqueta.name.pt);
      return {
        slug: text(raw.slug),
        slugEn: text(raw.slugEn) || undefined,
      oldSlugs: Array.isArray(raw.oldSlugs) ? raw.oldSlugs.map(String) : undefined,
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
        tags: etiquetas.length ? etiquetas : undefined,
        cover: image(raw.cover as MediaDoc),
      };
    });
  }, fallback);
}

/**
 * O corpo de um artigo, e só dele.
 *
 * Aceita os dois endereços — português e inglês — porque é por endereço que a
 * página o pede, e o inglês pode ter o seu.
 */
export async function fetchPostBody(slug: string): Promise<{ blocks: Block[]; blocksEn: Block[] } | undefined> {
  const payload = await getCms();
  if (!payload) return undefined;
  try {
    const { docs } = await payload.find({
      collection: "posts",
      where: { or: [{ slug: { equals: slug } }, { slugEn: { equals: slug } }] },
      limit: 1,
      depth: 2,
      select: { body: true, bodyEn: true },
    });
    const raw = docs[0] as Doc | undefined;
    if (!raw) return undefined;
    return { blocks: fromLexical(raw.body), blocksEn: fromLexical(raw.bodyEn) };
  } catch (error) {
    console.error("[payload] o corpo do artigo não veio:", error);
    return undefined;
  }
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
      oldSlugs: Array.isArray(raw.oldSlugs) ? raw.oldSlugs.map(String) : undefined,
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
        oldSlugs: Array.isArray(raw.oldSlugs) ? raw.oldSlugs.map(String) : undefined,
        legacyPath: text(raw.legacyPath) || null,
        client: text(raw.client),
        hideCoverInBody: raw.hideCoverInBody === true,
        date: text(raw.date).slice(0, 10),
        year: text(raw.year) || text(raw.date).slice(0, 4),
        disciplines: (raw.disciplines as string[] | null) ?? [],
        subtitle: text(raw.subtitle) || undefined,
        summary: localized(raw.summary).pt,
        body: [],
        story: fromStory(raw.story, "pt"),
        storyEn: fromStory(raw.story, "en"),
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
      oldSlugs: Array.isArray(raw.oldSlugs) ? raw.oldSlugs.map(String) : undefined,
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

/**
 * A equipa de A a Z.
 *
 * A ordem é do nome e não de um campo: uma grelha de vinte e uma caras sem
 * ordem visível obriga a percorrê-la toda para encontrar alguém, e qualquer
 * outra ordem — antiguidade, hierarquia, a ordem por que foram criados no
 * painel — é uma ordem que alguém tem de manter à mão e que ninguém lê.
 *
 * Comparação portuguesa, para os acentos ficarem no lugar: «Alícia» antes de
 * «Ana», e não onde a tabela de códigos os punha.
 */
function deAaZ(pessoas: TeamMember[]) {
  return [...pessoas].sort((uma, outra) => uma.name.localeCompare(outra.name, "pt"));
}

export function fetchTeam(fallback: TeamMember[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "team", ...all, depth: 1 });
    // O painel manda no que tiver, e o ficheiro do repositório preenche o resto
    // pessoa a pessoa: enquanto os retratos e as apresentações não passarem para
    // o CMS, uma pessoa criada no painel não aparece sem cara nem texto.
    const doRepositorio = new Map(fallback.map((pessoa) => [pessoa.name.trim().toLowerCase(), pessoa]));
    return deAaZ((docs as unknown as Doc[]).map((raw): TeamMember => {
      const name = text(raw.name);
      const base = doRepositorio.get(name.trim().toLowerCase());
      const papel = localized(raw.role);
      const apresentacao = localized(raw.bio);
      return {
        name,
        role: papel.pt || papel.en ? papel : base?.role,
        bio: apresentacao.pt || apresentacao.en ? apresentacao : base?.bio,
        photo: image(raw.photo as MediaDoc) ?? base?.photo,
        photoColor: image(raw.photoColor as MediaDoc) ?? base?.photoColor,
        linkedin: text(raw.linkedin) || base?.linkedin,
      };
    }));
  }, deAaZ(fallback));
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


/** As linhas de uma lista da vaga: um array de grupos { pt, en }. */
function linhas(valor: unknown): Localized[] {
  return ((valor as { item?: unknown }[] | null) ?? [])
    .map((linha) => localized(linha?.item))
    .filter((linha) => linha.pt);
}

export function fetchDepartments(fallback: Department[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({ collection: "departments", sort: "order", limit: 0, depth: 0 });
    return (docs as unknown as Doc[]).map((raw): Department => ({
      slug: text(raw.slug),
      name: localized({ pt: raw.namePt, en: raw.nameEn }),
      order: typeof raw.order === "number" ? raw.order : 100,
    }));
  }, fallback);
}

/**
 * As vagas que o site mostra.
 *
 * Só as abertas, e só as que ainda estão dentro do prazo: uma vaga com data
 * limite passada sai da lista sozinha. Deixar uma vaga fechada à vista é pior do
 * que não a ter — alguém candidata-se e fica à espera.
 *
 * O filtro é feito aqui e não na consulta porque a leitura fica guardada por
 * etiqueta e sem prazo: uma condição de data escrita na consulta ficava
 * congelada no dia em que o cache foi escrito.
 */
export function fetchJobs(fallback: Job[]) {
  return fromCms(async (payload) => {
    const { docs } = await payload.find({
      collection: "jobs",
      where: { status: { equals: "aberta" } },
      sort: "-createdAt",
      limit: 0,
      depth: 2,
    });

    return (docs as unknown as Doc[]).map((raw): Job => {
      const funcao = raw.function as Doc | number | null;
      const departamento =
        funcao && typeof funcao === "object" ? (funcao.department as Doc | number | null) : null;

      return {
        slug: text(raw.slug),
        slugEn: text(raw.slugEn) || undefined,
      oldSlugs: Array.isArray(raw.oldSlugs) ? raw.oldSlugs.map(String) : undefined,
        title: localized({ pt: raw.titlePt, en: raw.titleEn }),
        department:
          departamento && typeof departamento === "object"
            ? {
                slug: text(departamento.slug),
                name: localized({ pt: departamento.namePt, en: departamento.nameEn }),
              }
            : { slug: "", name: { pt: "Jelly", en: "Jelly" } },
        functionName:
          funcao && typeof funcao === "object"
            ? localized({ pt: funcao.namePt, en: funcao.nameEn })
            : { pt: "", en: "" },
        contract: (text(raw.contract) || undefined) as Job["contract"],
        regime: (text(raw.regime) || undefined) as Job["regime"],
        seniority: (text(raw.seniority) || undefined) as Job["seniority"],
        location: text(raw.location) || undefined,
        deadline: text(raw.deadline).slice(0, 10) || undefined,
        intro: localized(raw.intro),
        responsibilities: linhas(raw.responsibilities),
        requirements: linhas(raw.requirements),
        niceToHave: linhas(raw.niceToHave),
        benefits: linhas(raw.benefits),
        closing: localized(raw.closing),
        questions: ((raw.questions as Doc[] | null) ?? []).map((pergunta): JobQuestion => ({
          type: (text(pergunta.type) || "curto") as JobQuestion["type"],
          required: pergunta.required !== false,
          label: localized(pergunta.label),
          options: ((pergunta.options as { value?: unknown }[] | null) ?? [])
            .map((opcao) => localized(opcao?.value))
            .filter((opcao) => opcao.pt),
        })),
        legacyPath: text(raw.legacyPath) || undefined,
      };
    });
  }, fallback);
}


/**
 * Uma ficha de autor pelo nome.
 *
 * Pelo nome e não pelo id: quem escreve a página sabe o nome de quem cunhou o
 * termo, e um número no código não diz nada a quem o lê depois. Se a ficha não
 * existir, devolve nada e a página segue sem ela — não se parte uma página por
 * causa de uma fotografia.
 */
export async function fetchAuthorByName(name: string): Promise<Autor | undefined> {
  const payload = await getCms();
  if (!payload) return undefined;
  try {
    const { docs } = await payload.find({
      collection: "authors",
      where: { name: { equals: name } },
      limit: 1,
      depth: 1,
    });
    const raw = docs[0] as unknown as Doc | undefined;
    if (!raw) return undefined;
    const foto = image(raw.photo as MediaDoc);
    return {
      name: text(raw.name) || name,
      ...(text(raw.role) ? { role: text(raw.role) } : {}),
      ...(text(raw.bio) ? { bio: text(raw.bio) } : {}),
      ...(foto ? { photo: foto } : {}),
    };
  } catch (error) {
    console.error("[payload] a ficha do autor não veio:", error);
    return undefined;
  }
}
