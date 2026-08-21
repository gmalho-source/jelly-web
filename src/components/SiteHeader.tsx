import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getArchivedProjects, getPosts, getProjects, getServices } from "@/lib/cms";
import { SiteNav, type NavEntry, type PaletteItem } from "./SiteNav";

/** Monta o índice no servidor; a interação vive no SiteNav. */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const [nav, home] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "home" }),
  ]);
  const [projects, services, posts, archive] = await Promise.all([
    getProjects(),
    getServices(),
    getPosts(),
    getArchivedProjects(),
  ]);

  const url = (href: Parameters<typeof getPathname>[0]["href"]) => getPathname({ href, locale });

  // As miniaturas do menu vêm do conteúdo: capa de projeto e capa de artigo.
  // Onde não há imagem, a linha leva uma cor plana da marca.
  const projectCover = archive.find((project) => project.cover?.src)?.cover ?? undefined;
  const postCover = posts.find((post) => post.cover?.src)?.cover ?? undefined;

  const entries: NavEntry[] = [
    { key: "sobre", label: nav("about"), href: url("/sobre"), tone: "red" },
    {
      key: "servicos",
      label: nav("services"),
      href: url("/servicos"),
      tone: "lavender",
      children: services.map((service) => ({
        label: service.link[locale] || service.name[locale],
        href: url({ pathname: "/servicos/[slug]", params: { slug: service.slug } }),
      })),
    },
    {
      key: "projetos",
      label: nav("work"),
      href: url("/projetos"),
      tone: "chartreuse",
      thumb: projectCover?.src ? { src: projectCover.src } : undefined,
      children: projects.slice(0, 2).map((project) => ({
        label: project.client,
        href: url({ pathname: "/projetos/[slug]", params: { slug: project.slug } }),
      })),
    },
    { key: "clientes", label: nav("clients"), href: url("/clientes"), tone: "coral" },
    {
      key: "blog",
      label: nav("blog"),
      href: url("/blog"),
      tone: "slate",
      thumb: postCover?.src ? { src: postCover.src } : undefined,
    },
    { key: "newsroom", label: nav("newsroom"), href: url("/newsroom"), tone: "slate" },
    { key: "contactos", label: locale === "pt" ? "Contactos" : "Contact", href: url("/contactos"), tone: "red" },
  ];

  const palette: PaletteItem[] = [
    ...entries.map((entry) => ({ label: entry.label, hint: locale === "pt" ? "página" : "page", href: entry.href, group: "Jelly" })),
    ...services.map((service) => ({
      label: service.name[locale],
      hint: locale === "pt" ? "serviço" : "service",
      href: url({ pathname: "/servicos/[slug]", params: { slug: service.slug } }),
      group: nav("services"),
    })),
    ...projects.map((project) => ({
      label: project.client,
      hint: project.year,
      href: url({ pathname: "/projetos/[slug]", params: { slug: project.slug } }),
      group: nav("work"),
    })),
    ...archive.map((project) => ({
      label: project.client,
      hint: project.disciplines[0] ?? project.year,
      href: url({ pathname: "/projetos/[slug]", params: { slug: project.slug } }),
      group: nav("work"),
    })),
    ...posts.map((post) => ({
      label: post.title[locale],
      hint: post.category[locale],
      href: url({ pathname: "/blog/[slug]", params: { slug: post.slug } }),
      group: nav("blog"),
    })),
  ];

  const other = routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;

  return (
    <SiteNav
      entries={entries}
      palette={palette}
      contactHref={url("/contactos")}
      homeHref={url("/")}
      languageHref={getPathname({ href: "/", locale: other })}
      social={[
        { label: "LinkedIn", href: "https://www.linkedin.com/company/jellypt/" },
        { label: "Instagram", href: "https://www.instagram.com/jelly.pt/" },
      ]}
      copy={{
        menu: locale === "pt" ? "Navegação" : "Navigation",
        open: locale === "pt" ? "Abrir o índice do site" : "Open the site index",
        close: locale === "pt" ? "Fechar o índice" : "Close the index",
        contact: nav("contact"),
        signature: home("signature"),
        here: locale === "pt" ? "estás aqui" : "you are here",
        searchLabel: locale === "pt" ? "Procurar em todo o site" : "Search the whole site",
        searchPlaceholder: locale === "pt" ? "Cliente, serviço, artigo…" : "Client, service, article…",
        empty: locale === "pt" ? "Sem resultados. Tenta outro termo." : "No results. Try another term.",
        language: other === "en" ? "English" : "Português",
      }}
    />
  );
}
