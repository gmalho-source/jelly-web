import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ServiceHero } from "@/components/ServiceHero";
import { getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const services = await getServices();
  return services.map((service) => ({ slug: slugFor(service, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.name[locale],
    description: service.claim[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: slugFor(service, candidate) } }),
      locale,
    ),
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = await getService(slug);
  if (!service) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  const canonico = slugFor(service, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/servicos/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("services");
  const [cases, all] = await Promise.all([getProjectsBySlugs(service.caseSlugs), getServices()]);
  const others = all.filter((item) => item.slug !== service.slug);
  const accent = service.accent === "lavender";

  const chamada = (
    <Link href="/contactos" className="btn btn-hero">
      {t("cta")} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <div className="surface-paper">
      {/* Com vídeo de topo o serviço abre em cheio; sem ele, abre como sempre
          abriu. As duas formas convivem: nem toda a página precisa de teatro. */}
      {service.heroVideo || service.heroPoster ? (
        <ServiceHero
          eyebrow={t("eyebrow")}
          title={service.heroTitle?.[locale] || service.name[locale]}
          claim={service.claim[locale]}
          video={service.heroVideo}
          poster={service.heroPoster}
          cta={chamada}
        />
      ) : (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
            <div>
              <span className="eyebrow">{t("eyebrow")}</span>
              <h1 className="mt-5 text-display">{service.name[locale]}</h1>
            </div>
            <div>
              <p className="subtitle">{service.claim[locale]}</p>
              <div className="mt-6">{chamada}</div>
            </div>
          </div>
        </section>
      )}

      {/* A frase que dá a volta: primeira linha afirma, segunda vira. */}
      {service.statement ? (
        <section className="surface-red py-16 lg:py-24">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <p className="max-w-[26ch] font-display text-[clamp(30px,5vw,72px)] leading-[1.0] tracking-[-0.025em]">
              {service.statement.first[locale]}
            </p>
            <p className="mt-6 max-w-[34ch] font-display text-[clamp(20px,2.6vw,34px)] leading-[1.14] text-fg-soft">
              {service.statement.second[locale]}
            </p>
          </div>
        </section>
      ) : null}

      {service.areas?.length ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="eyebrow">{t("areas")}</h2>
          <div className="mt-8 grid gap-px border-t border-line bg-line sm:grid-cols-2">
            {service.areas.map((area) => (
              <div key={area.title.pt} className="surface-paper flex flex-col gap-3 px-0 py-7 sm:px-7">
                <h3 className="max-w-[26ch] text-xl">{area.title[locale]}</h3>
                <p className="max-w-[46ch] text-md text-fg-soft">{area.body[locale]}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {service.promise ? (
        <section className={`py-14 lg:py-20 ${accent ? "surface-accent-lavender" : "surface-ink"}`}>
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <span className={`eyebrow ${accent ? "text-red-deep" : "text-chartreuse"}`}>{t("promise")}</span>
            <p className="mt-4 max-w-[34ch] font-display text-chapter text-fg">
              {service.promise[locale]}
            </p>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,36%)_minmax(0,58%)] lg:justify-between">
          {/* Numa página longa as áreas já disseram o que inclui; aqui entra o
              texto, que é o que falta dizer. */}
          {service.essay?.length ? (
            <div>
              {service.essayTitle ? <h2 className="text-chapter">{service.essayTitle[locale]}</h2> : null}
              <div className="mt-5 flex flex-col gap-4">
                {service.essay.map((paragraph) => (
                  <p key={paragraph.pt} className="max-w-[46ch] text-md text-fg-soft">
                    {paragraph[locale]}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h2 className="eyebrow">{t("includes")}</h2>
              <ul className="mt-5 flex flex-col gap-3">
                {service.includes?.map((item) => (
                  <li key={item.pt} className="flex gap-3 text-md text-fg-soft">
                    <span aria-hidden="true" className="mt-3 block h-px w-4 shrink-0 bg-red" />
                    {item[locale]}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div>
            <h2 className="eyebrow">{t("phases")}</h2>
            {/* A numeração é real: é a sequência de entrega. */}
            <ol className="mt-5 border-t border-line">
              {service.phases?.map((phase, index) => (
                <li key={phase.name.pt} className="grid grid-cols-[36px_minmax(0,1fr)] gap-4 border-b border-line py-5">
                  <span className="font-sans text-xs font-semibold tabular-nums text-red">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-xl">{phase.name[locale]}</h3>
                    <p className="mt-2 max-w-[56ch] text-sm text-fg-soft">{phase.body[locale]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {cases.length ? (
        <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
          <h2 className="eyebrow">{t("cases")}</h2>
          <div className="mt-5 border-t border-line">
            {cases.map((project) => (
              <Link
                key={project.slug}
                href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
                className="group grid grid-cols-[minmax(0,1fr)_76px] items-baseline gap-4 border-b border-line py-4 row-flip hover:pl-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px]"
              >
                <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
                  {project.client}
                </span>
                <span className="hidden text-sm text-fg-soft sm:block">{project.title[locale]}</span>
                <span className="text-right font-display tabular-nums text-red lg:text-lg">{project.headline.value}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {service.closing ? (
        <section className="surface-ink py-16 lg:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="max-w-[28ch] font-display text-[clamp(26px,3.6vw,52px)] leading-[1.04] tracking-[-0.02em]">
                {service.closing.question[locale]}
              </p>
              <p className="mt-4 text-md text-fg-soft">{service.closing.answer[locale]}</p>
            </div>
            {chamada}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
        <h2 className="eyebrow">{t("others")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {others.map((item) => (
            <Link
              key={item.slug}
              href={{ pathname: "/servicos/[slug]", params: { slug: slugFor(item, locale) } }}
              className="card flex flex-col gap-2 p-6"
            >
              <h3 className="text-xl">{item.name[locale]}</h3>
              <p className="text-sm text-fg-soft">{item.claim[locale]}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-red">{item.link[locale]} →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
