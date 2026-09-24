import type { MetadataRoute } from "next";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { PILARES } from "@/content/pilares";
import { SERVICOS_DE_MARKETING } from "@/content/marketing-servicos";
import { SERVICOS_DE_TECNOLOGIA } from "@/content/tecnologia-servicos";
import { getArchivedProjects, getPosts, getProjects, getServices } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/** Só conteúdo. Taxonomias e páginas de sistema ficam fora, por decisão. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, services, posts, arquivo] = await Promise.all([
    getProjects(),
    getServices(),
    getPosts(),
    getArchivedProjects(),
  ]);

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
  // Os serviços de Marketing, debaixo da página-mãe.
  for (const servico of SERVICOS_DE_MARKETING) {
    add((locale) => ({ pathname: "/servicos/marketing/[sub]", params: { sub: servico.slug[locale] } }), 0.8);
  }
  // E os de Tecnologia, debaixo da sua.
  for (const servico of SERVICOS_DE_TECNOLOGIA) {
    add((locale) => ({ pathname: "/servicos/tecnologia/[sub]", params: { sub: servico.slug[locale] } }), 0.8);
  }
  for (const project of projects) {
    add((locale) => ({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }), 0.7);
  }
  /*
   * E o arquivo, que estava de fora e não devia. São páginas de verdade — têm
   * história escrita, capa, vídeo — e são a maior parte do trabalho que esta
   * casa mostra: cinco casos escritos contra cinquenta e tal arquivados. Ficar
   * fora do mapa era dizer ao Google que só existem cinco.
   *
   * Prioridade abaixo da dos casos escritos, que esses é que são a montra. O
   * `getArchivedProjects` já tira os que também estão escritos, por isso não há
   * endereços repetidos.
   */
  for (const peca of arquivo) {
    add((locale) => ({ pathname: "/projetos/[slug]", params: { slug: slugFor(peca, locale) } }), 0.5);
  }
  for (const post of posts) {
    add((locale) => ({ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }), 0.5, post.date);
  }

  return entries;
}
