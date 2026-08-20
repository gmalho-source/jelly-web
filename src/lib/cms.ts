import { news, posts } from "@/content/editorial";
import { projects } from "@/content/projects";
import { clients, milestones, services, team } from "@/content/site";
import type { NewsItem, Post, Project } from "@/content/types";

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

export async function getPosts(): Promise<Post[]> {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export async function getPost(slug: string): Promise<Post | undefined> {
  return posts.find((post) => post.slug === slug);
}

export async function getRelatedPosts(slug: string, limit = 3): Promise<Post[]> {
  const all = await getPosts();
  return all.filter((post) => post.slug !== slug).slice(0, limit);
}

export async function getNews(): Promise<NewsItem[]> {
  return [...news].sort((a, b) => b.date.localeCompare(a.date));
}
