import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { getPosts, getProjects, getServices } from "@/lib/cms";
import { SiteNav, type NavEntry, type PaletteItem } from "./SiteNav";

/** Monta os dados do índice no servidor; a interação vive no SiteNav. */
export async function SiteHeader({ locale }: { locale: Locale }) {
  const [nav, home, work, blogT, newsroom] = await Promise.all([
    getTranslations({ locale, namespace: "nav" }),
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "work" }),
    getTranslations({ locale, namespace: "blog" }),
    getTranslations({ locale, namespace: "newsroom" }),
  ]);
  const [projects, services, posts] = await Promise.all([getProjects(), getServices(), getPosts()]);

  const url = (href: Parameters<typeof getPathname>[0]["href"]) => getPathname({ href, locale });

  const entries: NavEntry[] = [
    { label: nav("about"), href: url("/sobre"), context: home("eyebrow"), tone: "red" },
    {
      label: nav("services"),
      href: url("/servicos"),
      context: home("servicesTitle"),
      tone: "lavender",
      children: services.map((service) => ({
        label: service.name[locale],
        href: url({ pathname: "/servicos/[slug]", params: { slug: service.slug } }),
      })),
    },
    {
      label: nav("work"),
      href: url("/projetos"),
      context: work("lead"),
      tone: "chartreuse",
      children: projects.slice(0, 3).map((project) => ({
        label: `${project.client} · ${project.headline.value}`,
        href: url({ pathname: "/projetos/[slug]", params: { slug: project.slug } }),
      })),
    },
    { label: nav("clients"), href: url("/clientes"), context: home("clientsLabel"), tone: "coral" },
    { label: nav("blog"), href: url("/blog"), context: blogT("lead"), tone: "slate" },
    { label: nav("newsroom"), href: url("/newsroom"), context: newsroom("lead"), tone: "slate" },
    { label: nav("contact"), href: url("/contactos"), context: home("lead"), tone: "red" },
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
      hint: project.headline.value,
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
      languageHref={getPathname({ href: "/", locale: other })}
      copy={{
        index: locale === "pt" ? "Índice" : "Index",
        close: locale === "pt" ? "Fechar" : "Close",
        contact: nav("contact"),
        searchHint: locale === "pt" ? "Procurar" : "Search",
        searchLabel: locale === "pt" ? "Procurar em todo o site" : "Search the whole site",
        searchPlaceholder: locale === "pt" ? "Cliente, serviço, artigo…" : "Client, service, article…",
        empty: locale === "pt" ? "Sem resultados. Tenta outro termo." : "No results. Try another term.",
        language: other === "en" ? "English" : "Português",
      }}
    />
  );
}
