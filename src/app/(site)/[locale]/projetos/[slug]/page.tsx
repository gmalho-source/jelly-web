import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { getArchivedProject, getArchivedProjects, getNextProject, getProject, getProjects } from "@/lib/cms";
import { alternates } from "@/lib/seo";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams() {
  const [projects, archive] = await Promise.all([getProjects(), getArchivedProjects()]);
  return [...projects, ...archive].map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const project = await getProject(slug);
  if (!project) {
    const archived = await getArchivedProject(slug);
    return archived
      ? {
          title: `${archived.client} — ${archived.disciplines.join(", ")}`,
          description: archived.summary || `${archived.client}: ${archived.disciplines.join(", ")}.`,
          alternates: alternates({ pathname: "/projetos/[slug]", params: { slug } }, locale),
        }
      : {};
  }
  return {
    title: `${project.client} — ${project.title[locale]}`,
    description: project.summary[locale],
    alternates: alternates({ pathname: "/projetos/[slug]", params: { slug } }, locale),
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const project = await getProject(slug);
  const archived = project ? null : await getArchivedProject(slug);
  if (!project && !archived) notFound();
  

  const t = await getTranslations("work");

  // Projeto de arquivo: mostramos o que existe — cliente, ano, disciplinas e
  // imagens — sem inventar narrativa nem número.
  if (archived) {
    return (
      <article className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{locale === "pt" ? "Arquivo" : "Archive"}</span>
            <h1 className="mt-5 text-display">{archived.client}</h1>
          </div>
          <dl className="text-sm">
            <div className="flex justify-between gap-4 border-b border-paper-2 py-2.5">
              <dt className="text-mute">{t("year")}</dt>
              <dd className="tabular-nums">{archived.year}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-paper-2 py-2.5">
              <dt className="text-mute">{t("disciplines")}</dt>
              <dd className="text-right">{archived.disciplines.join(", ")}</dd>
            </div>
          </dl>
        </div>

        {archived.cover?.src ? (
          <Image
            src={archived.cover.src}
            alt={archived.cover.alt || archived.client}
            width={1600}
            height={900}
            priority
            sizes="(max-width: 1200px) 100vw, 1140px"
            className="mt-10 w-full rounded-[20px] object-cover"
          />
        ) : null}

        {archived.summary ? <p className="subtitle mt-10 max-w-[62ch]">{archived.summary}</p> : null}

        {archived.images.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {archived.images.slice(0, 4).map((src) => (
              <Image key={src} src={src} alt="" width={800} height={600} sizes="(max-width: 640px) 100vw, 560px" className="w-full rounded-[20px] object-cover" />
            ))}
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-ink pt-8">
          <p className="subtitle max-w-[48ch]">
            {locale === "pt"
              ? "Este projeto está no arquivo: guardámos o trabalho, não a história. Queres saber o que fizemos aqui?"
              : "This project sits in the archive: we kept the work, not the story. Want to know what we did here?"}
          </p>
          <Link href="/contactos" className="btn btn-hero">
            {locale === "pt" ? "Falar connosco" : "Get in touch"} <span aria-hidden="true">→</span>
          </Link>
        </div>

        <Link href="/projetos" className="mt-10 inline-block text-sm font-semibold text-red">
          ← {t("back")}
        </Link>
      </article>
    );
  }
  if (!project) notFound();

  const next = await getNextProject(slug);
  const facts = [
    { term: t("client"), value: project.client },
    { term: t("year"), value: project.year },
    { term: t("disciplines"), value: project.disciplines[locale] },
    { term: t("team"), value: project.team[locale] },
  ];

  return (
    <article>
      <section className="grid gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-11 lg:px-14 lg:py-16">
        <p className="eyebrow text-mute">
          {project.client}
          <br />
          <br />
          {project.year}
        </p>
        <div>
          <h1 className="max-w-[24ch] text-display">{project.title[locale]}</h1>
          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <p className="max-w-[46ch] text-md text-slate">{project.summary[locale]}</p>
            <dl className="text-[13px]">
              {facts.map((fact) => (
                <div key={fact.term} className="flex justify-between gap-4 border-b border-paper-2 py-2.5">
                  <dt className="text-mute">{fact.term}</dt>
                  <dd className="text-right">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* O resultado vem antes da imagem. */}
      <section className="px-5 sm:px-8 lg:px-14">
        <dl className="grid grid-cols-1 border-t border-ink sm:grid-cols-3">
          {[project.headline, ...project.kpis].map((kpi) => (
            <div key={kpi.value} className="border-b border-paper-2 py-6 pr-5 sm:border-b-0 sm:border-r sm:last:border-r-0">
              <dt className="font-display text-4xl leading-none tabular-nums tracking-tight text-red lg:text-[50px]">
                {kpi.value}
              </dt>
              <dd className="mt-2 text-[13px] text-mute">{kpi.label[locale]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {project.quote ? (
        <section className="grid gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-11 lg:px-14">
          <p className="eyebrow text-mute">{t("clientWord")}</p>
          <blockquote>
            <p className="max-w-[34ch] font-display text-2xl leading-snug tracking-[-0.02em] lg:text-[38px]">
              “{project.quote.text[locale]}”
            </p>
            <footer className="eyebrow mt-4 text-mute">
              {project.quote.author} · {project.quote.role[locale]}
            </footer>
          </blockquote>
        </section>
      ) : null}

      <section className="px-5 sm:px-8 lg:px-14">
        <div className="flex items-center justify-between gap-4 border-t border-paper-2 pt-5">
          <span className="eyebrow text-mute">{t("next")}</span>
          <Link
            href={{ pathname: "/projetos/[slug]", params: { slug: next.slug } }}
            className="flex items-center gap-2 text-sm font-semibold text-red"
          >
            <span aria-hidden="true" className="block h-px w-8 bg-red" />
            {next.client} · {next.headline.value}
          </Link>
        </div>
      </section>
    </article>
  );
}
