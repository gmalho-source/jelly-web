import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getMilestones, getProjects, getTeam } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/sobre", locale) };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const [team, milestones, projects] = await Promise.all([getTeam(), getMilestones(), getProjects()]);

  const stats = [
    { value: "15", label: t("stats.years") },
    { value: String(team.length), label: t("stats.people") },
    { value: "68", label: t("stats.projects") },
    { value: "40+", label: t("stats.clients") },
  ];

  return (
    <div className="surface-paper">
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="mt-5 text-display">{t("title")}</h1>
          </div>
          <p className="subtitle">{t("lead")}</p>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-px bg-paper-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-paper py-6 pr-6">
              <dt className="font-display text-4xl leading-none tabular-nums text-red">{stat.value}</dt>
              <dd className="mt-2 text-sm text-fg-soft">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Manifesto em bloco ink: um momento de impacto, uma só mensagem. */}
      <section className="surface-ink py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] items-end gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow text-chartreuse">{t("manifestoEyebrow")}</span>
            <h2 className="mt-4 text-chapter text-paper">{t("manifestoTitle")}</h2>
          </div>
          <p className="text-md text-paper/75">{t("manifestoBody")}</p>
        </div>
      </section>

      {/* Linha do tempo: a sequência é informação, por isso o ano manda. */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <h2 className="eyebrow">{t("timeline")}</h2>
        <ol className="mt-6 border-t border-line">
          {milestones.map((milestone) => (
            <li
              key={milestone.year}
              className="grid grid-cols-[70px_minmax(0,1fr)] items-baseline gap-5 border-b border-line py-5 sm:grid-cols-[120px_minmax(0,1fr)]"
            >
              <span className="font-display text-xl tabular-nums text-red">{milestone.year}</span>
              <p className="max-w-[60ch] text-md text-fg-soft">{locale === "pt" ? milestone.pt : milestone.en}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Equipa: nomes reais; cargos e retratos entram pelo CMS. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-chapter">{t("team")}</h2>
          <span className="text-sm text-fg-soft">{t("teamNote")}</span>
        </div>
        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-line pt-6">
          {team.map((member) => (
            <li key={member.name} className="font-display text-lg lg:text-xl">
              {member.name}
              {member.role ? <span className="ml-2 font-sans text-xs uppercase tracking-[0.08em] text-red">{member.role[locale]}</span> : null}
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-24 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-8">
            <h3 className="text-xl">{t("method")}</h3>
            <p className="mt-3 text-sm text-fg-soft">{t("methodBody")}</p>
          </div>
          <div className="card p-8">
            <h3 className="text-xl">{t("careers")}</h3>
            <p className="mt-3 text-sm text-fg-soft">{t("careersBody")}</p>
          </div>
          <Link href="/projetos" className="card flex flex-col justify-between bg-chartreuse p-8 shadow-none">
            <h3 className="text-xl">{projects.length + 63} projetos desde 2010</h3>
            <span className="mt-6 text-sm font-semibold text-red-deep">Ver o trabalho →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
