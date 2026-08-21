import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getProjects } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "work" });
  return { title: t("title"), description: t("lead"), alternates: alternates("/projetos", locale) };
}

export default async function WorkIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("work");
  const projects = await getProjects();

  return (
    <section className="grid gap-6 px-5 py-12 sm:px-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-11 lg:px-14 lg:py-16">
      <p className="eyebrow text-mute">
        {t("title")}
        <br />
        <span className="text-red">{projects.length} / 68</span>
      </p>
      <div>
        <h1 className="text-chapter">{t("title")}</h1>
        <p className="subtitle mt-4 max-w-[52ch]">{t("lead")}</p>
        <div className="mt-10 border-t border-paper-3-strong">
          {projects.map((project) => (
            <Link
              key={project.slug}
              href={{ pathname: "/projetos/[slug]", params: { slug: project.slug } }}
              className="group grid grid-cols-[minmax(0,1fr)_70px] items-baseline gap-4 border-b border-paper-3 py-4 transition-[padding,background] duration-300 hover:bg-white hover:pl-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_86px]"
            >
              <span className="font-display text-xl tracking-tight transition-colors group-hover:text-red lg:text-[28px]">
                {project.client}
              </span>
              <span className="hidden text-[13px] text-mute sm:block">{project.title[locale]}</span>
              <span className="text-right font-display tabular-nums text-red lg:text-lg">
                {project.headline.value}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
