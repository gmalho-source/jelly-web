import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import type { Client } from "@/content/types";
import { getClients, getProjects } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "clients" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/clientes", locale) };
}

const order: Client["sector"][] = ["financeiro", "retalho", "industria", "servicos", "lazer", "tecnologia"];

export default async function ClientsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("clients");
  const [clients, projects] = await Promise.all([getClients(), getProjects()]);

  return (
    <>
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="mt-5 text-display">{t("title")}</h1>
          </div>
          <p className="subtitle">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        {order.map((sector) => {
          const inSector = clients.filter((client) => client.sector === sector);
          if (!inSector.length) return null;
          return (
            <div key={sector} className="border-t border-paper-3 py-8 first:border-ink">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="eyebrow">{t(`sectors.${sector}`)}</h2>
                <span className="text-sm tabular-nums text-mute">
                  {inSector.length} {t("count")}
                </span>
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
                {inSector.map((client) => (
                  <li key={client.name} className="font-display text-lg lg:text-2xl">
                    {client.name}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      <section className="bg-ink py-16 text-paper lg:py-20">
        <div className="mx-auto grid max-w-[1200px] items-end gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between">
          <div>
            <span className="eyebrow text-chartreuse">{t("longTerm")}</span>
            <h2 className="mt-4 text-chapter text-paper">{t("longTermBody")}</h2>
          </div>
          <Link href="/projetos" className="btn w-fit">
            {projects.length + 63} {locale === "pt" ? "projetos" : "projects"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </>
  );
}
