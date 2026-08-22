import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getArchivedProjects, getPosts, getServices } from "@/lib/cms";
import { slugFor } from "@/lib/slugs";
import { IndexSheet, type SheetTile } from "./IndexSheet";

const tones = ["bg-red", "bg-lavender", "bg-chartreuse", "bg-coral"];

/**
 * Não há menu: há um índice em folha de contacto. Este componente monta os
 * mosaicos no servidor — páginas, serviços, projetos com capa e artigos — e a
 * interação vive no IndexSheet.
 */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const nav = await getTranslations({ locale, namespace: "nav" });
  const [services, posts, archive] = await Promise.all([getServices(), getPosts(), getArchivedProjects()]);
  const pt = locale === "pt";

  const url = (href: Parameters<typeof getPathname>[0]["href"]) => getPathname({ href, locale });
  // Os projetos entram do mais recente para o mais antigo. O arquivo vem
  // ordenado como se mostra na página de trabalho, que não é por data.
  const withCover = archive
    .filter((project) => project.cover?.src)
    .sort((a, b) => b.date.localeCompare(a.date));

  const tiles: SheetTile[] = [
    { label: nav("about"), kind: pt ? "página" : "page", href: url("/sobre"), tone: "bg-slate" },
    ...services.map((service, index) => ({
      label: service.name[locale],
      kind: pt ? "serviço" : "service",
      href: url({ pathname: "/servicos/[slug]", params: { slug: slugFor(service, locale) } }),
      tone: tones[index % tones.length],
    })),
    ...withCover.slice(0, 12).map((project) => ({
      label: project.client,
      kind: project.disciplines[0] ?? (pt ? "projeto" : "project"),
      href: url({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }),
      image: project.cover!.src,
    })),
    ...posts.slice(0, 12).map((post) => ({
      label: post.title[locale],
      kind: pt ? "artigo" : "article",
      href: url({ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }),
      image: post.cover?.src,
      tone: "bg-slate",
    })),
    { label: nav("clients"), kind: pt ? "página" : "page", href: url("/clientes"), tone: "bg-coral" },
    { label: nav("blog"), kind: pt ? "página" : "page", href: url("/blog"), tone: "bg-slate" },
    { label: nav("newsroom"), kind: pt ? "página" : "page", href: url("/newsroom"), tone: "bg-slate" },
    { label: nav("contact"), kind: pt ? "página" : "page", href: url("/contactos"), tone: "bg-red" },
  ];

  const other = routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  return (
    <IndexSheet
      tiles={tiles}
      homeHref={url("/")}
      contactHref={url("/contactos")}
      languageHref={getPathname({ href: "/", locale: other })}
      copy={{
        index: pt ? "Índice" : "Index",
        placeholder: pt ? "escreve para encontrar — cliente, serviço, artigo" : "type to find — client, service, article",
        filterLabel: pt ? "Filtrar o índice" : "Filter the index",
        empty: pt ? "Nada com esse nome. Apaga uma letra." : "Nothing by that name. Delete a letter.",
        of: pt ? "de" : "of",
        close: pt ? "Fechar o índice" : "Close the index",
        // A mesma nas duas línguas: é assinatura de marca, não copy corrente.
        contact: "Start The Change",
        language: other === "en" ? "English" : "Português",
      }}
    />
  );
}
