import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getDepartments, getJobs } from "@/lib/cms";
import { slugFor } from "@/lib/slugs";
import { ServiceHero } from "@/components/ServiceHero";
import { ApplicationForm } from "./ApplicationForm";
import { formCopy } from "./copy";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "careers" });
  return { title: t("eyebrow"), description: t("description"), alternates: alternates("/recrutamento", locale) };
}

export default async function CareersPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("careers");
  const [jobs, departments] = await Promise.all([getJobs(), getDepartments()]);

  // Só as áreas que têm vaga aberta: um filtro com opções que não filtram nada é
  // uma promessa vazia.
  const comVaga = departments.filter((area) => jobs.some((job) => job.department.slug === area.slug));

  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      {/* O mesmo herói das páginas de serviço, com fotografia em vez de vídeo:
          é o desenho que a casa já tem para um topo com imagem, e inventar um
          segundo era ter dois. A fotografia é a do site antigo, com a faixa
          inferior cortada — trazia «be the change» gravado, e duas frases no
          mesmo canto competem em vez de somarem. */}
      <ServiceHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        claim={t("lead")}
        poster={{ src: "/media/recrutamento-capa.webp", alt: t("photoAlt") }}
        height="medio"
        cta={
          <a href={jobs.length ? "#vagas" : "#candidatura"} className="btn-pill">
            {jobs.length ? t("openRoles") : t("apply")} <span aria-hidden="true">→</span>
          </a>
        }
      />

      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <h2 className="text-chapter">{t("openRoles")}</h2>
            {comVaga.length > 1 ? (
              // Os filtros são âncoras e não estado: uma lista com meia dúzia de
              // linhas não precisa de javascript, e assim cada área tem endereço
              // próprio para se partilhar.
              <div className="flex flex-wrap gap-2">
                <a href="#vagas" className="btn-pill btn-pill-ink">
                  {t("allAreas")}
                </a>
                {comVaga.map((area) => (
                  <a key={area.slug} href={`#area-${area.slug}`} className="btn-pill btn-pill-line">
                    {area.name[locale]}
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div id="vagas" className="mt-10 scroll-mt-28">
            {jobs.length ? (
              comVaga.map((area) => (
                <div key={area.slug} id={`area-${area.slug}`} className="mt-10 scroll-mt-28 first:mt-0">
                  <h3 className="eyebrow text-fg-soft">{area.name[locale]}</h3>
                  <ul className="mt-4 border-t border-line">
                    {jobs
                      .filter((job) => job.department.slug === area.slug)
                      .map((job) => (
                        <li key={job.slug} className="border-b border-line">
                          <Link
                            href={{ pathname: "/recrutamento/[slug]", params: { slug: slugFor(job, locale) } }}
                            className="row-flip group grid gap-2 py-6 hover:pl-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
                          >
                            <div>
                              <h4 className="editorial text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
                                {job.title[locale]}
                              </h4>
                              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-soft">
                                {[
                                  job.location,
                                  job.regime ? t(`regimeOptions.${job.regime}`) : "",
                                  job.contract ? t(`contractOptions.${job.contract}`) : "",
                                  job.seniority ? t(`seniorityOptions.${job.seniority}`) : "",
                                ]
                                  .filter(Boolean)
                                  .map((etiqueta) => (
                                    <span key={etiqueta}>{etiqueta}</span>
                                  ))}
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-red">
                              {job.deadline
                                ? `${t("deadline")} ${formatter.format(new Date(job.deadline))}`
                                : t("apply")}
                            </span>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="max-w-[58ch] text-md text-fg-soft">{t("noRoles")}</p>
            )}
          </div>
        </div>
      </section>

      {/* A candidatura espontânea está sempre aberta, com ou sem vagas: é a
          diferença entre uma página de recrutamento e um anúncio. */}
      <section id="candidatura" data-pagina="recrutamento" className="surface-ink scroll-mt-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,44%)_minmax(0,48%)] lg:justify-between lg:py-24">
          <div>
            <h2 className="text-chapter">{t("spontaneous")}</h2>
            <p className="mt-4 max-w-[46ch] text-md text-fg-soft">{t("spontaneousBody")}</p>
            <p className="mt-8 text-sm text-fg-soft">
              talent@jelly.pt
            </p>
          </div>

          <ApplicationForm
            copy={await formCopy(locale)}
            departments={departments.map((area) => ({ slug: area.slug, label: area.name[locale] }))}
          />
        </div>
      </section>
    </>
  );
}
