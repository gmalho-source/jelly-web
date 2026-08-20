import { projects } from "@/content/projects";
import { clients, services } from "@/content/site";
import type { Project } from "@/content/types";

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
