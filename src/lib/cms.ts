import logoGalleries from "@/content/generated/client-logos.json";
import generated from "@/content/generated/posts.json";
import archived from "@/content/generated/projects.json";
import { news, posts } from "@/content/editorial";
import { projects } from "@/content/projects";
import { clients, milestones, services, team } from "@/content/site";
import type { ArchivedProject, LogoGallery, MigratedPost, NewsItem, Post, Project } from "@/content/types";

/**
 * Camada de conteúdo. Hoje lê o conteúdo local versionado no repositório;
 * quando NEXT_PUBLIC_SANITY_PROJECT_ID estiver definido, estas funções passam a
 * consultar o Sanity com as mesmas assinaturas — as páginas não mudam.
 */
export const sanityConfigured = Boolean(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID);

export async function getProjects(): Promise<Project[]> {
  return [...projects].sort((a, b) => a.order - b.order);
}

export async function getProject(slug: string): Promise<Project | undefined> {
  return projects.find((project) => project.slug === slug);
}

export async function getNextProject(slug: string): Promise<Project> {
  const all = await getProjects();
  const index = all.findIndex((project) => project.slug === slug);
  return all[(index + 1) % all.length];
}

export async function getServices() {
  return services;
}

export async function getClients() {
  return clients;
}

export async function getService(slug: string) {
  return services.find((service) => service.slug === slug);
}

export async function getProjectsBySlugs(slugs: string[] = []) {
  return slugs.map((slug) => projects.find((project) => project.slug === slug)).filter((project): project is Project => Boolean(project));
}

export async function getTeam() {
  return team;
}

export async function getMilestones() {
  return milestones;
}

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
    author: post.author,
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

export async function getPosts(): Promise<Post[]> {
  const source = postsAreMigrated ? migrated.map(fromMigrated) : posts;
  return [...source].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const all = await getPosts();
  return all.find((post) => post.slug === slug);
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const all = await getPosts();
  const current = all.find((post) => post.slug === slug);
  const sameCategory = all.filter((post) => post.slug !== slug && post.category.pt === current?.category.pt);
  const rest = all.filter((post) => post.slug !== slug && post.category.pt !== current?.category.pt);
  return [...sameCategory, ...rest].slice(0, limit);
}

export async function getNews(): Promise<NewsItem[]> {
  return [...news].sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Arquivo do portfolio antigo: 64 projetos com cliente, ano, disciplinas e capa.
 * O export do WordPress não trazia narrativa — as histórias e os números entram
 * à mão nos casos escolhidos, e esses passam a viver em content/projects.ts.
 */
const archive = archived as ArchivedProject[];

export async function getArchivedProjects(): Promise<ArchivedProject[]> {
  const featured = new Set(projects.map((project) => project.slug));
  return archive.filter((project) => !featured.has(project.slug));
}

export async function getArchivedProject(slug: string): Promise<ArchivedProject | undefined> {
  return archive.find((project) => project.slug === slug);
}

/** Logos de clientes, das galerias Smart Logo do site antigo. */
export async function getClientLogos(gallery = "Clientes") {
  const galleries = logoGalleries as LogoGallery[];
  return galleries.find((item) => item.gallery.toLowerCase() === gallery.toLowerCase())?.logos ?? [];
}
