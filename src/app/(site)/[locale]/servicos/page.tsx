import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getServices } from "@/lib/cms";
import { alternates } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("servicesLabel"), description: t("servicesTitle"), alternates: alternates("/servicos", locale) };
}

export default async function ServicesIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const services = await getServices();

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <span className="eyebrow">{t("servicesLabel")}</span>
      <h1 className="mt-5 max-w-[24ch] text-display">{t("servicesTitle")}</h1>
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {services.map((service) => {
          const accent = service.accent === "lavender";
          return (
            <Link
              key={service.slug}
              href={{ pathname: "/servicos/[slug]", params: { slug: service.slug } }}
              className={`card flex min-h-[240px] flex-col gap-3 p-8 ${accent ? "bg-lavender shadow-none" : ""}`}
            >
              <h2 className="text-chapter">{service.name[locale]}</h2>
              <p className="max-w-[46ch] text-md text-slate">{service.claim[locale]}</p>
              <span className={`mt-auto text-sm font-semibold ${accent ? "text-red-deep" : "text-red"}`}>
                {service.link[locale]} →
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
