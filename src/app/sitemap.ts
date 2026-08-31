import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { PILARES } from "@/content/pilares";
import { getPosts, getProjects, getServices } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/** Só conteúdo. Taxonomias e páginas de sistema ficam fora, por decisão. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services, posts] = await Promise.all([getProjects(), getServices(), getPosts()]);

  type Href = Parameters<typeof getPathname>[0]["href"];

  const entries: MetadataRoute.Sitemap = [];
  // O endereço pode mudar de língua para língua: um artigo tem slug inglês.
  const add = (href: Href | ((locale: Locale) => Href), priority: number, lastModified?: string) => {
    const para = (locale: Locale) => (typeof href === "function" ? href(locale) : href);
    for (const locale of routing.locales) {
      entries.push({
        url: SITE_URL + getPathname({ href: para(locale), locale }),
        priority,
        lastModified,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map((other) => [
              other === "pt" ? "pt-PT" : "en",
              SITE_URL + getPathname({ href: para(other), locale: other }),
            ]),
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
  // As páginas longas. Estavam as duas de fora: a Imunidade por esquecimento, e
  // as pilares por não existirem ainda. São as páginas desta casa feitas para
  // serem encontradas — ficarem fora do mapa era o contrário do que servem.
  add("/imunidade-algoritmica", 0.8);
  for (const pilar of PILARES) {
    add(pilar.rota, 0.8);
  }
  for (const service of services) {
    add((locale) => ({ pathname: "/servicos/[slug]", params: { slug: slugFor(service, locale) } }), 0.9);
  }
  for (const project of projects) {
    add((locale) => ({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }), 0.7);
  }
  for (const post of posts) {
    add((locale) => ({ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }), 0.5, post.date);
  }

  return entries;
}
