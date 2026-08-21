import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates } from "@/lib/seo";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.name[locale],
    description: service.claim[locale],
    alternates: alternates({ pathname: "/servicos/[slug]", params: { slug } }, locale),
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = await getService(slug);
  if (!service) notFound();

  const t = await getTranslations("services");
  const [cases, all] = await Promise.all([getProjectsBySlugs(service.caseSlugs), getServices()]);
  const others = all.filter((item) => item.slug !== service.slug);
  const accent = service.accent === "lavender";

  return (
    <div className="surface-paper">
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="mt-5 text-display">{service.name[locale]}</h1>
          </div>
          <div>
            <p className="subtitle">{service.claim[locale]}</p>
            <Link href="/contactos" className="btn btn-hero mt-6">
              {t("cta")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

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
                href={{ pathname: "/projetos/[slug]", params: { slug: project.slug } }}
                className="group grid grid-cols-[minmax(0,1fr)_76px] items-baseline gap-4 border-b border-line py-4 transition-[padding,background] duration-200 ease-out hover:bg-white hover:pl-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px]"
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

      <section className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-8">
        <h2 className="eyebrow">{t("others")}</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {others.map((item) => (
            <Link
              key={item.slug}
              href={{ pathname: "/servicos/[slug]", params: { slug: item.slug } }}
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
