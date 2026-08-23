import { unstable_cache } from "next/cache";
import { cache } from "react";
import logoGalleries from "@/content/generated/client-logos.json";
import generated from "@/content/generated/posts.json";
import archived from "@/content/generated/projects.json";
import { news, posts } from "@/content/editorial";
import { projects } from "@/content/projects";
import { clients, milestones, services, team } from "@/content/site";
import type { ArchivedProject, Department, Job, LogoGallery, MigratedPost, NewsItem, Post, Project } from "@/content/types";
import { findBySlug } from "@/lib/slugs";
import {
  fetchArchivedProjects,
  fetchPageCopy,
  fetchClients,
  fetchLogoGalleries,
  fetchMilestones,
  fetchNews,
  fetchDepartments,
  fetchJobs,
  fetchPostBody,
  fetchPosts,
  fetchProjects,
  fetchServices,
  fetchTeam,
} from "@/lib/payload/content";
import { payloadConfigured } from "@/lib/payload/client";

/**
 * Camada de conteúdo — a única porta entre as páginas e a origem dos dados.
 *
 * Com DATABASE_URL definido, lê do Payload pela API local, sem rede pelo meio;
 * sem ele, ou com uma coleção vazia, ou com a leitura a falhar, devolve o
 * conteúdo local versionado em src/content. A troca é coleção a coleção, o que
 * deixa o site de pé mesmo a meio de uma migração.
 */
export const cmsConfigured = payloadConfigured;

/**
 * Uma leitura por coleção e por deploy, não uma por página.
 *
 * O `cache` do React só junta as chamadas dentro do mesmo desenho, e este site
 * desenha 513 páginas: cada uma voltava a pedir os 179 artigos com o corpo
 * inteiro. Medido numa build: 19 milhões de linhas lidas da base. Com o cache
 * do Next por cima, a leitura acontece uma vez e as páginas seguintes leem o
 * resultado guardado — o que também é o que mantém a fatura da base pequena.
 *
 * A etiqueta é o que os ganchos das coleções limpam ao publicar.
 */
function fromStore<T>(name: string, load: () => Promise<T>) {
  return cache(unstable_cache(load, ["cms", name], { revalidate: false, tags: [CMS_TAG] }));
}

/** Etiqueta única: publicar qualquer coisa manda buscar tudo outra vez. */
export const CMS_TAG = "cms";

const localProjects = [...projects].sort((a, b) => a.order - b.order);

export const getProjects = fromStore("projects", async (): Promise<Project[]> => {
  const all = await fetchProjects(localProjects);
  return [...all].sort((a, b) => a.order - b.order);
});

export async function getProject(slug: string): Promise<Project | undefined> {
  return findBySlug(await getProjects(), slug);
}

export async function getNextProject(slug: string): Promise<Project> {
  const all = await getProjects();
  const atual = findBySlug(all, slug);
  const index = atual ? all.indexOf(atual) : -1;
  return all[(index + 1) % all.length];
}

export const getServices = fromStore("services", async () => fetchServices(services));

export const getClients = fromStore("clients", async () => fetchClients(clients));

export async function getService(slug: string) {
  return findBySlug(await getServices(), slug);
}

export async function getProjectsBySlugs(slugs: string[] = []) {
  const all = await getProjects();
  return slugs.map((slug) => all.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
}

/**
 * Imagens principais de uma página, carregadas no painel. Hoje só a homepage as
 * usa — as fotografias do topo, em fundido quando há mais do que uma — e sem
 * elas o topo cai na capa de um projeto.
 */
/** Copy e imagens das páginas. Usada pelo merge de mensagens e pelo herói. */
export const getPages = fromStore("pages", async () => fetchPageCopy());

export const getPageImages = cache(async (key: string) => {
  const pages = await getPages();
  return pages.find((page) => page.slug === key)?.images ?? [];
});

export const getTeam = fromStore("team", async () => fetchTeam(team));

export const getMilestones = fromStore("milestones", async () => fetchMilestones(milestones));

/**
 * Artigos migrados do WordPress (`npm run migrate`). Enquanto a migração não
 * corre, o site usa os seis artigos de estrutura em `content/editorial.ts`.
 */
const migrated = generated as MigratedPost[];

function fromMigrated(post: MigratedPost): Post {
  return {
    slug: post.slug,
    date: post.date,
    category: { pt: post.category, en: post.category },
    author: { name: post.author },
    readingMinutes: post.readingMinutes,
    title: { pt: post.title, en: post.title },
    excerpt: { pt: post.excerpt, en: post.excerpt },
    blocks: post.body,
    cover: post.cover ?? undefined,
    legacyPath: post.legacyPath,
    lang: post.lang,
  };
}

export const postsAreMigrated = migrated.length > 0;

const localPosts = (postsAreMigrated ? migrated.map(fromMigrated) : posts).sort((a, b) => b.date.localeCompare(a.date));

export const getPosts = fromStore("posts", async (): Promise<Post[]> => {
  const all = await fetchPosts(localPosts);
  return [...all].sort((a, b) => b.date.localeCompare(a.date));
});

export async function getPost(slug: string): Promise<Post | undefined> {
  return findBySlug(await getPosts(), slug);
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const all = await getPosts();
  const current = findBySlug(all, slug);
  const sameCategory = all.filter((post) => post !== current && post.category.pt === current?.category.pt);
  const rest = all.filter((post) => post !== current && post.category.pt !== current?.category.pt);
  return [...sameCategory, ...rest].slice(0, limit);
}

const localNews = [...news].sort((a, b) => b.date.localeCompare(a.date));

export const getNews = fromStore("news", async (): Promise<NewsItem[]> => {
  const all = await fetchNews(localNews);
  return [...all].sort((a, b) => b.date.localeCompare(a.date));
});

/**
 * Arquivo do portfolio antigo: 64 projetos com cliente, ano, disciplinas e capa.
 * O export do WordPress não trazia narrativa — as histórias e os números entram
 * à mão nos casos escolhidos, e esses passam a viver como casos escritos.
 */
const localArchive = archived as ArchivedProject[];

const getArchive = fromStore("archive", async () => fetchArchivedProjects(localArchive));

export async function getArchivedProjects(): Promise<ArchivedProject[]> {
  const [archive, featured] = await Promise.all([getArchive(), getProjects()]);
  const written = new Set(featured.map((project) => project.slug));
  return archive.filter((project) => !written.has(project.slug));
}

export async function getArchivedProject(slug: string): Promise<ArchivedProject | undefined> {
  const archive = await getArchive();
  return archive.find((project) => project.slug === slug);
}

const getLogoGalleries = fromStore("logos", async () => fetchLogoGalleries(logoGalleries as LogoGallery[]));

/** Logos de clientes, das galerias Smart Logo do site antigo. */
export async function getClientLogos(gallery = "Clientes") {
  const galleries = await getLogoGalleries();
  return galleries.find((item) => item.gallery.toLowerCase() === gallery.toLowerCase())?.logos ?? [];
}

/**
 * As vagas abertas, e os departamentos por onde se agrupam.
 *
 * O prazo filtra-se aqui, na leitura, e não na consulta: a leitura fica
 * guardada por etiqueta e sem prazo, e uma condição de data escrita na consulta
 * ficava congelada no dia em que o cache foi escrito. Assim a data compara-se a
 * cada pedido, com o cache a servir os dados e não a decisão.
 */
export const getDepartments = fromStore("departments", async (): Promise<Department[]> => {
  const all = await fetchDepartments([]);
  return [...all].sort((a, b) => a.order - b.order);
});

const allJobs = fromStore("jobs", async (): Promise<Job[]> => fetchJobs([]));

export async function getJobs(): Promise<Job[]> {
  const hoje = new Date().toISOString().slice(0, 10);
  return (await allJobs()).filter((job) => !job.deadline || job.deadline >= hoje);
}

export async function getJob(slug: string): Promise<Job | undefined> {
  return findBySlug(await getJobs(), slug);
}

/**
 * O corpo de um artigo, guardado por endereço.
 *
 * Uma entrada por artigo, e cada uma cabe nos 2 MB que o cache do Next aceita —
 * ao contrário da entrada única com os 179 corpos, que não cabia e por isso
 * nunca era escrita. A etiqueta é a mesma, portanto publicar continua a largar
 * tudo de uma vez.
 */
export async function getPostBody(slug: string) {
  // A chave leva o endereço, e não o nome só: é o que faz uma entrada por
  // artigo. Não passa pelo `fromStore` porque aquele embrulha em `cache()` do
  // React, e um embrulho novo a cada chamada não junta nada.
  const ler = unstable_cache(() => fetchPostBody(slug), ["cms", "post-body", slug], {
    revalidate: false,
    tags: [CMS_TAG],
  });
  return ler();
}
