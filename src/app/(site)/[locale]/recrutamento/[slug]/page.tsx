import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPathname, Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { alternates, SITE_URL } from "@/lib/seo";
import { getJob, getJobs } from "@/lib/cms";
import { slugFor } from "@/lib/slugs";
import { ApplicationForm } from "../ApplicationForm";
import { formCopy } from "../copy";

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const jobs = await getJobs();
  return jobs.map((job) => ({ slug: slugFor(job, params.locale as Locale) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const job = await getJob(slug);
  if (!job) return {};
  return {
    title: job.title[locale],
    description: job.intro[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/recrutamento/[slug]" as const, params: { slug: slugFor(job, candidate) } }),
      locale,
    ),
  };
}

export default async function JobPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const job = await getJob(slug);
  if (!job) notFound();

  // Quem chega pelo endereço da outra língua leva 308 para o certo: um endereço
  // só, por vaga e por língua.
  const canonico = slugFor(job, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/recrutamento/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("careers");
  const nav = await getTranslations("nav");

  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const etiquetas = [
    job.location,
    job.regime ? t(`regimeOptions.${job.regime}`) : "",
    job.contract ? t(`contractOptions.${job.contract}`) : "",
    job.seniority ? t(`seniorityOptions.${job.seniority}`) : "",
  ].filter(Boolean);

  // O Google mostra vagas com esta marcação, e é de graça.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title[locale],
    description: [job.intro[locale], ...job.responsibilities.map((linha) => linha[locale])].join(" "),
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    employmentType:
      job.contract === "estagio" ? "INTERN" : job.contract === "freelancer" ? "CONTRACTOR" : "FULL_TIME",
    hiringOrganization: { "@type": "Organization", name: "Jelly", sameAs: SITE_URL },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location ?? "Lisboa",
        addressCountry: "PT",
      },
    },
    ...(job.regime === "remoto" ? { jobLocationType: "TELECOMMUTE" } : {}),
  };

  const lista = (titulo: string, linhas: { pt: string; en: string }[]) =>
    linhas.length ? (
      <div className="mt-10">
        <h2 className="eyebrow text-fg-soft">{titulo}</h2>
        <ul className="mt-4 grid gap-3">
          {linhas.map((linha) => (
            <li key={linha.pt} className="flex gap-3 text-md text-fg">
              <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-red" />
              {linha[locale]}
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="surface-ink">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
              { label: t("eyebrow"), href: "/recrutamento", path: getPathname({ href: "/recrutamento", locale }) },
              { label: job.department.name[locale] },
            ]}
          />
          <h1 className="mt-8 max-w-[24ch] text-display">{job.title[locale]}</h1>
          <p className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-fg-soft">
            {etiquetas.map((etiqueta) => (
              <span key={etiqueta}>{etiqueta}</span>
            ))}
            <span className="text-red">
              {job.deadline ? `${t("deadline")} ${formatter.format(new Date(job.deadline))}` : t("noDeadline")}
            </span>
          </p>
          <a href="#candidatura" className="btn mt-10 w-fit">
            {t("applyTo")} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="surface-paper">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,58%)_minmax(0,34%)] lg:justify-between lg:py-24">
          <div>
            {job.intro[locale] ? <p className="reading max-w-[62ch] text-lg">{job.intro[locale]}</p> : null}
            {lista(t("responsibilities"), job.responsibilities)}
            {lista(t("requirements"), job.requirements)}
            {lista(t("niceToHave"), job.niceToHave)}
            {lista(t("benefits"), job.benefits)}
            {job.closing[locale] ? (
              <p className="reading mt-10 max-w-[62ch] border-t border-line pt-8 text-md">{job.closing[locale]}</p>
            ) : null}
          </div>

          <aside className="flex flex-col gap-4 self-start rounded-[20px] border border-line bg-white p-6">
            <h2 className="eyebrow text-fg-soft">{t("about")}</h2>
            <dl className="grid gap-3 text-sm">
              {[
                { rotulo: t("area"), valor: job.department.name[locale] },
                { rotulo: t("role"), valor: job.functionName[locale] },
                { rotulo: t("deadline"), valor: job.deadline ? formatter.format(new Date(job.deadline)) : "" },
              ]
                .filter((linha) => linha.valor)
                .map((linha) => (
                  <div key={linha.rotulo}>
                    <dt className="text-fg-soft">{linha.rotulo}</dt>
                    <dd className="text-ink">{linha.valor}</dd>
                  </div>
                ))}
            </dl>
            <Link href="/recrutamento" className="btn-ghost mt-2 w-fit">
              {t("backToRoles")}
            </Link>
          </aside>
        </div>
      </section>

      <section id="candidatura" data-pagina="recrutamento" className="surface-ink scroll-mt-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,40%)_minmax(0,52%)] lg:justify-between lg:py-24">
          <div>
            <h2 className="text-chapter">{t("applyTo")}</h2>
            <p className="mt-4 max-w-[42ch] text-md text-fg-soft">{t("sentBody")}</p>
          </div>

          <ApplicationForm
            copy={await formCopy(locale)}
            jobSlug={job.slug}
            jobTitle={job.title[locale]}
            questions={job.questions.map((pergunta) => ({
              type: pergunta.type,
              required: pergunta.required,
              label: pergunta.label[locale],
              options: pergunta.options.map((opcao) => opcao[locale]),
            }))}
          />
        </div>
      </section>
    </>
  );
}
