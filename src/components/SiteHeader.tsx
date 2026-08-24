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
  // Do mais recente para o mais antigo, que é a ordem em que o arquivo já vem.
  const withCover = archive.filter((project) => project.cover?.src);

  /*
   * A folha em três bandas, e por esta ordem: o que a Jelly faz, o que a Jelly
   * fez, e a casa. Antes eram trinta e cinco mosaicos numa lista só — cinco
   * serviços, doze projetos, doze artigos e sete páginas todos ao mesmo nível —
   * e uma lista dessas não é um índice, é um monte. Agora são quinze, e cada um
   * está debaixo de um título que diz o que é.
   *
   * O que sai da folha não sai do índice: os restantes projetos e os artigos
   * ficam a ser procuráveis (`hidden`), e aparecem à primeira letra escrita. É
   * o que permite arrumar o menu sem perder o «escreva para encontrar».
   */
  const servicos = pt ? "Serviços" : "Services";
  const trabalho = pt ? "Trabalho" : "Work";
  const casa = pt ? "A casa" : "The house";

  const tiles: SheetTile[] = [
    // ── O que fazemos ──────────────────────────────────────────────────────
    ...services.map((service, index) => ({
      group: servicos,
      label: service.name[locale],
      kind: pt ? "serviço" : "service",
      href: url({ pathname: "/servicos/[slug]", params: { slug: slugFor(service, locale) } }),
      tone: tones[index % tones.length],
    })),

    // ── O que fizemos: três projetos e a porta para o arquivo ──────────────
    // Três, e não quatro: no desktop a grelha tem quatro colunas, e o quarto
    // lugar é do link para todos. Uma linha, sem sobras.
    ...withCover.slice(0, 3).map((project) => ({
      group: trabalho,
      label: project.client,
      kind: project.disciplines[0] ?? (pt ? "projeto" : "project"),
      href: url({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }),
      image: project.cover!.src,
    })),
    {
      group: trabalho,
      // Sem número: a página junta os casos e o arquivo, e um número aqui que
      // não fosse o de lá era pior do que nenhum.
      label: pt ? "Ver todos os projetos" : "See all projects",
      kind: pt ? "arquivo" : "archive",
      href: url("/projetos"),
      tone: "bg-red",
    },

    // ── A casa ─────────────────────────────────────────────────────────────
    { group: casa, label: nav("blog"), kind: pt ? "página" : "page", href: url("/blog"), tone: "bg-slate" },
    { group: casa, label: nav("newsroom"), kind: pt ? "página" : "page", href: url("/newsroom"), tone: "bg-slate" },
    { group: casa, label: nav("careers"), kind: pt ? "página" : "page", href: url("/recrutamento"), tone: "bg-chartreuse" },
    { group: casa, label: nav("about"), kind: pt ? "página" : "page", href: url("/sobre"), tone: "bg-slate" },
    { group: casa, label: nav("clients"), kind: pt ? "página" : "page", href: url("/clientes"), tone: "bg-coral" },
    {
      group: casa,
      label: nav("immunity"),
      kind: pt ? "conceito" : "concept",
      href: url("/imunidade-algoritmica"),
      tone: "bg-lavender",
    },
    { group: casa, label: nav("contact"), kind: pt ? "página" : "page", href: url("/contactos"), tone: "bg-red" },

    // ── Fora da folha, dentro da procura ───────────────────────────────────
    ...withCover.slice(3, 40).map((project) => ({
      hidden: true,
      label: project.client,
      kind: project.disciplines[0] ?? (pt ? "projeto" : "project"),
      href: url({ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }),
      image: project.cover!.src,
    })),
    ...posts.slice(0, 40).map((post) => ({
      hidden: true,
      label: post.title[locale],
      kind: pt ? "artigo" : "article",
      href: url({ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }),
      image: post.cover?.src,
      tone: "bg-slate",
    })),
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
        placeholder: pt ? "escreva para encontrar — cliente, serviço, artigo" : "type to find — client, service, article",
        filterLabel: pt ? "Filtrar o índice" : "Filter the index",
        empty: pt ? "Nada com esse nome. Apague uma letra." : "Nothing by that name. Delete a letter.",
        of: pt ? "de" : "of",
        close: pt ? "Fechar o índice" : "Close the index",
        // As duas nas mesmas línguas: são assinatura de marca, não copy corrente.
        contact: "Start The Change",
        arrived: "The Change is about to start",
        language: other === "en" ? "English" : "Português",
      }}
    />
  );
}
