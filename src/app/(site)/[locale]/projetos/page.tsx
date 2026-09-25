import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";
import Image from "next/image";
import { getArchivedProjects, getProjects } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return { title: t("title"), description: t("lead"), alternates: alternates("/projetos", locale) };
}

export default async function WorkIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("work");
  const [projects, archive] = await Promise.all([getProjects(), getArchivedProjects()]);

  return (
    <section className="surface-ink grid gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-11 lg:px-14 lg:py-16">
      <p className="eyebrow text-fg-soft">
        {t("title")}
        <br />
        <span className="text-red">
          {projects.length} / {projects.length + archive.length}
        </span>
      </p>
      <div>
        <h1 className="text-chapter">{t("title")}</h1>
        <p className="subtitle mt-4 max-w-[52ch]">{t("lead")}</p>
        <div className="mt-10 border-t border-line-strong">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
              className="group grid grid-cols-[minmax(0,1fr)_70px] items-baseline gap-4 border-b border-line py-4 row-flip hover:pl-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_86px]"
            >
              <span className="font-display text-xl tracking-tight transition-colors group-hover:text-red lg:text-[28px]">
                {project.client}
              </span>
              <span className="hidden text-[13px] text-fg-soft sm:block">{project.title[locale]}</span>
              <span className="text-right font-display tabular-nums text-red lg:text-lg">
                {project.headline.value}
              </span>
            </Link>
          ))}
        </div>

        {/* Arquivo: 64 projetos do portfolio antigo. Cliente, ano, disciplinas e
            capa — sem narrativa, que o export não trazia. */}
        <div className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="eyebrow">{locale === "pt" ? "Arquivo" : "Archive"}</h2>
            <span className="text-sm tabular-nums text-fg-soft">
              {archive.length} {locale === "pt" ? "projetos" : "projects"} · 2016—2026
            </span>
          </div>
          {/* O cartão é a imagem. Tinha uma faixa branca por baixo com o nome, e
              numa grelha de cinquenta e tal projetos essa faixa repetia-se
              cinquenta vezes: metade da grelha era papel. Agora o nome assenta
              na fotografia, sobre um véu que sobe até aos dois terços dela — com
              menos, metade das capas desta casa deixava o nome por ler.

              O hover aproxima a imagem e não pinta o nome de vermelho: vermelho
              sobre fotografia escura é a pior combinação das duas. */}
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {archive.map((project) => (
              <li key={project.slug}>
                <Link
                  href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
                  className="group relative isolate block aspect-[4/3] overflow-hidden rounded-[20px] bg-slate"
                >
                  {project.cover?.src ? (
                    <Image
                      src={project.cover.src}
                      alt={project.cover.alt || project.client}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                    />
                  ) : null}
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/90 via-ink/55 to-transparent"
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                    <span className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-xl text-paper">{project.client}</h3>
                      <span className="truncate text-sm text-paper/75">{project.disciplines.slice(0, 3).join(" · ")}</span>
                    </span>
                    <span className="shrink-0 text-sm tabular-nums text-paper/60">{project.year}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
