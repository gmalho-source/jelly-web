import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { CaseStory } from "@/components/CaseStory";
import { getArchivedProject, getArchivedProjects, getNextProject, getProject, getProjects } from "@/lib/cms";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const [projects, archive] = await Promise.all([getProjects(), getArchivedProjects()]);
  return [...projects, ...archive].map((project) => ({ slug: slugFor(project, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const [project, archived] = await Promise.all([getProject(slug), getArchivedProject(slug)]);
  if (!project && !archived) return {};

  const title = project ? `${project.client} — ${project.title[locale]}` : `${archived!.client} — ${archived!.subtitle || archived!.disciplines.join(", ")}`;
  const description = project?.summary[locale] || archived?.summary || `${archived?.client}: ${archived?.disciplines.join(", ")}.`;

  const peca = project ?? archived!;
  return {
    title,
    description,
    alternates: alternates(
      (candidate) => ({ pathname: "/projetos/[slug]" as const, params: { slug: slugFor(peca, candidate) } }),
      locale,
    ),
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Um caso pode ter as duas metades: a ficha escrita (título, equipa, citação)
  // e o registo do portfolio antigo (capa, disciplinas, narrativa). A página é
  // uma só, e usa o que existir.
  const [project, archived] = await Promise.all([getProject(slug), getArchivedProject(slug)]);
  if (!project && !archived) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  const canonico = slugFor(project ?? archived!, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/projetos/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("work");

  const client = project?.client ?? archived!.client;
  const headline = project?.title[locale] ?? client;
  const eyebrow = archived?.subtitle || project?.disciplines[locale] || archived?.disciplines.join(" · ") || "";
  const lead = project?.summary[locale] || archived?.summary || "";
  const cover = archived?.cover?.src;
  const story = archived?.story ?? [];

  const facts = [
    { term: t("client"), value: client },
    { term: t("year"), value: project?.year ?? archived?.year ?? "" },
    { term: t("disciplines"), value: project?.disciplines[locale] ?? archived?.disciplines.join(", ") ?? "" },
    ...(project ? [{ term: t("team"), value: project.team[locale] }] : []),
  ].filter((fact) => fact.value);

  // Os números só aparecem depois de validados com o cliente. Até lá, a página
  // vive da história, que é verdadeira.
  const kpis = project?.numbersValidated ? [project.headline, ...project.kpis] : [];
  const next = project ? await getNextProject(slug) : null;

  return (
    <article className="surface-ink mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
      <header className="grid items-end gap-8 lg:grid-cols-[minmax(0,60%)_minmax(0,34%)] lg:justify-between lg:gap-14">
        <div>
          {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          <h1 className="mt-5 max-w-[22ch] text-display">{headline}</h1>
        </div>
        {facts.length ? (
          <dl className="text-[13px]">
            {facts.map((fact) => (
              <div key={fact.term} className="flex justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-fg-soft">{fact.term}</dt>
                <dd className="text-right">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      {lead ? <p className="subtitle mt-10 max-w-[58ch] text-lg">{lead}</p> : null}

      {cover ? (
        <Image
          src={cover}
          alt={archived?.cover?.alt || client}
          width={1600}
          height={900}
          priority
          sizes="(max-width: 1200px) 100vw, 1140px"
          className="mt-10 w-full rounded-[20px] object-cover"
        />
      ) : null}

      {kpis.length ? (
        <dl className="mt-12 grid grid-cols-1 border-t border-line sm:grid-cols-3">
          {kpis.map((kpi) => (
            <div key={kpi.value} className="border-b border-line py-6 pr-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <dt className="font-display text-4xl leading-none tabular-nums tracking-tight text-red lg:text-[50px]">{kpi.value}</dt>
              <dd className="mt-2 text-[13px] text-fg-soft">{kpi.label[locale]}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <CaseStory blocks={story} client={client} poster={cover} />

      {project?.quote ? (
        <blockquote className="mt-16 border-t border-line pt-8">
          <p className="max-w-[34ch] font-display text-2xl leading-snug tracking-[-0.02em] lg:text-[38px]">
            “{project.quote.text[locale]}”
          </p>
          <footer className="eyebrow mt-4 text-fg-soft">
            {project.quote.author} · {project.quote.role[locale]}
          </footer>
        </blockquote>
      ) : null}

      {!story.length ? (
        <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-8">
          <p className="subtitle max-w-[48ch]">
            {locale === "pt"
              ? "Deste projeto guardámos o trabalho, não a história. Queres saber o que fizemos aqui?"
              : "For this project we kept the work, not the story. Want to know what we did here?"}
          </p>
          <Link href="/contactos" className="btn-pill btn-pill-ink">
            {locale === "pt" ? "Falar connosco" : "Get in touch"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <Link href="/projetos" className="text-sm font-semibold text-red">
          ← {t("back")}
        </Link>
        {next ? (
          <Link
            href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(next, locale) } }}
            className="flex items-center gap-2 text-sm font-semibold text-red"
          >
            <span className="eyebrow text-fg-soft">{t("next")}</span>
            <span aria-hidden="true" className="block h-px w-8 bg-red" />
            {next.client}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
