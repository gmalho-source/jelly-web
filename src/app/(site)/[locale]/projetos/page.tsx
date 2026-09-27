import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";
import { getProjectGrid, getProjects } from "@/lib/cms";
import { GrelhaDeProjetos, type ProjetoDaGrelha } from "@/components/GrelhaDeProjetos";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  // `pageTitle` e `pageLead`, e não `title` e `lead`: o caderno «Projetos» do
  // painel guardava cópias antigas nessas chaves, que tapariam o texto novo.
  return { title: t("pageTitle"), description: t("pageLead"), alternates: alternates("/projetos", locale) };
}

export default async function WorkIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("work");
  const [projects, archive] = await Promise.all([getProjects(), getProjectGrid()]);
  const pt = locale === "pt";

  // Os casos escritos entram na grelha com os outros, marcados, e com o número
  // principal quando está validado — a mesma regra da página do caso.
  const casos = new Map(projects.map((project) => [project.slug, project]));
  const grelha: ProjetoDaGrelha[] = archive.map((project) => {
    const caso = casos.get(project.slug);
    return {
      slug: slugFor(project, locale),
      cliente: project.client,
      disciplinas: project.disciplines.slice(0, 3).join(" · "),
      ano: project.year,
      capa: project.cover?.src ? { src: project.cover.src, alt: project.cover.alt ?? "" } : null,
      caso: Boolean(caso),
      destaque: caso?.numbersValidated ? caso.headline.value?.trim() || undefined : undefined,
    };
  });

  return (
    // Sem a coluna lateral: repetia o título e contava o que os filtros já
    // contam («Todos 53», «Cases 6»).
    <section className="surface-ink px-5 pb-12 pt-16 sm:px-8 lg:px-14 lg:py-16">
      <div>
        <h1 className="text-chapter">{t("pageTitle")}</h1>
        <p className="subtitle mt-4 max-w-[52ch]">{t("pageLead")}</p>

        {/* Uma grelha só. Havia uma lista dos casos em texto por cima dela, e
            com os casos também na grelha eram seis projetos a aparecer duas
            vezes seguidas; o filtro «Cases» faz o que a lista fazia. */}
        <div className="mt-12">
          <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line pb-3">
            <h2 className="eyebrow">{pt ? "Todos os projetos" : "All projects"}</h2>
            <span className="text-sm tabular-nums text-fg-soft">
              {archive.length} {pt ? "projetos" : "projects"} · 2016—2026
            </span>
          </div>
          <GrelhaDeProjetos
            projetos={grelha}
            textos={{ todos: pt ? "Todos" : "All", casos: "Cases", filtrar: pt ? "Filtrar projetos" : "Filter projects" }}
          />
        </div>
      </div>
    </section>
  );
}
