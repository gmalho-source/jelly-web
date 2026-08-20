import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getClients, getProjects, getServices } from "@/lib/cms";

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [projects, services, clients] = await Promise.all([getProjects(), getServices(), getClients()]);

  return (
    <>
      {/* Herói: a tese antes de qualquer imagem. */}
      <section className="grid gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-11 lg:px-14 lg:py-20">
        <div className="label flex flex-col gap-2.5">
          <span>{t("eyebrow")}</span>
          <span className="text-red">{t("signature")}</span>
          <span className="mt-2 leading-relaxed">
            {services.map((service) => (
              <span key={service.slug} className="block">
                {service.name[locale]}
              </span>
            ))}
          </span>
        </div>
        <div>
          <h1 className="text-display">
            {t("headlineLead")}{" "}
            <span className="relative inline-block">
              {t("headlineStrike")}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-[56%] h-[4px] -rotate-1 bg-red lg:h-[6px]"
              />
            </span>
            <br />
            <em className="text-red">{t("headlineEm")}</em> {t("headlineRest")}
          </h1>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6 border-t border-line-strong pt-5">
            <p className="max-w-[44ch] text-lede text-navy">{t("lead")}</p>
            <Link href="/projetos" className="label flex items-center gap-2 text-ink">
              <span aria-hidden="true" className="block h-px w-8 bg-red" />
              {t("workCta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Índice de trabalho: linhas, não cartões. */}
      <section className="px-5 sm:px-8 lg:px-14">
        <h2 className="label border-b border-line pb-3">{t("workIndex")}</h2>
        {projects.map((project) => (
          <Link
            key={project.slug}
            href={{ pathname: "/projetos/[slug]", params: { slug: project.slug } }}
            className="group grid grid-cols-[minmax(0,1fr)_70px] items-baseline gap-4 border-b border-line py-4 transition-[padding,background] duration-300 hover:bg-white hover:pl-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_86px]"
          >
            <span className="font-display text-2xl tracking-tight transition-colors group-hover:text-red lg:text-[34px]">
              {project.client}
            </span>
            <span className="hidden text-[13px] text-mute sm:block">{project.disciplines[locale]}</span>
            <span className="text-right font-display text-lg tabular-nums text-red lg:text-xl">
              {project.headline.value}
            </span>
          </Link>
        ))}
      </section>

      {/* Quatro serviços, quatro quadrantes. */}
      <section className="mt-12 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service) => (
          <div key={service.slug} className="flex min-h-[190px] flex-col gap-2 bg-bone p-6 lg:p-7">
            <h3 className="text-chapter">{service.name[locale]}</h3>
            <p className="text-[13px] text-navy">{service.claim[locale]}</p>
            <span className="label mt-auto text-red">{service.link[locale]} →</span>
          </div>
        ))}
      </section>

      {/* Parede de clientes em texto corrido: 15 anos de companhia. */}
      <section className="px-5 pt-12 sm:px-8 lg:px-14">
        <h2 className="label">{t("clientsLabel")}</h2>
        <p className="mt-3 font-display text-xl leading-snug tracking-tight lg:text-3xl">
          {clients.map((client) => (
            <span key={client.name}>
              {client.name} <span className="text-line">·</span>{" "}
            </span>
          ))}
          <span className="text-mute">{t("clientsTail")}</span>
        </p>
      </section>
    </>
  );
}
