import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getPosts, getProjects, getServices } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";

/** Só conteúdo. Taxonomias e páginas de sistema ficam fora, por decisão. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services, posts] = await Promise.all([getProjects(), getServices(), getPosts()]);

  const entries: MetadataRoute.Sitemap = [];
  const add = (href: Parameters<typeof getPathname>[0]["href"], priority: number, lastModified?: string) => {
    for (const locale of routing.locales) {
      entries.push({
        url: SITE_URL + getPathname({ href, locale }),
        priority,
        lastModified,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((other) => [other === "pt" ? "pt-PT" : "en", SITE_URL + getPathname({ href, locale: other })]),
          ),
        },
      });
    }
  };

  add("/", 1);
  add("/sobre", 0.8);
  add("/projetos", 0.8);
  add("/clientes", 0.7);
  add("/blog", 0.7);
  add("/newsroom", 0.6);
  add("/contactos", 0.6);
  for (const service of services) add({ pathname: "/servicos/[slug]", params: { slug: service.slug } }, 0.9);
  for (const project of projects) add({ pathname: "/projetos/[slug]", params: { slug: project.slug } }, 0.7);
  for (const post of posts) add({ pathname: "/blog/[slug]", params: { slug: post.slug } }, 0.5, post.date);

  return entries;
}
