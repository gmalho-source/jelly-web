import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { HeroReel } from "@/components/HeroReel";
import { Ticker } from "@/components/Ticker";
import { WorkIndex, type WorkRow } from "@/components/WorkIndex";
import { getPathname } from "@/i18n/navigation";
import { getClients, getProjects, getServices } from "@/lib/cms";
import { alternates, organizationJsonLd } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { description: t("lead"), alternates: alternates("/", locale) };
}

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [projects, services, clients] = await Promise.all([getProjects(), getServices(), getClients()]);
  const featured = projects.slice(0, 3);
  const tones: WorkRow["tone"][] = ["slate", "red", "lavender", "chartreuse", "coral"];
  const rows: WorkRow[] = projects.map((project, index) => ({
    client: project.client,
    discipline: project.disciplines[locale],
    value: project.headline.value,
    label: project.headline.label[locale],
    href: getPathname({ href: { pathname: "/projetos/[slug]", params: { slug: project.slug } }, locale }),
    tone: tones[index % tones.length],
  }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      {/* Herói 60/40: a tese à esquerda, o reel na coluna da direita.
          O vídeo nunca fica atrás do texto — o título tem de continuar legível. */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            {/* A palavra riscada é a tese: a estratégia sozinha não muda nada. */}
            <h1 className="mt-5 text-display">
              <span className="relative inline-block">
                Estratégia
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[-2%] top-[54%] h-[5px] -rotate-[1.2deg] bg-red lg:h-[8px]"
                />
              </span>
              <br />
              <span className="text-red">Ação</span> é a nossa estratégia.
            </h1>
            <p className="subtitle mt-8 max-w-[46ch]">{t("lead")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/" className="btn btn-hero">
                {t("contactCta")} <span aria-hidden="true">→</span>
              </Link>
              <Link href="/projetos" className="btn btn-ghost">
                {t("workCta")}
              </Link>
            </div>
          </div>
          <HeroReel
            sources={[{ src: "/media/reel-placeholder.webm", type: "video/webm" }]}
            poster="/media/reel-poster.jpg"
            label={t("reelLabel")}
            caption={t("reelCaption")}
            playLabel={t("reelPlay")}
            pauseLabel={t("reelPause")}
            openLabel={t("reelOpen")}
            closeLabel={t("reelClose")}
          />
        </div>
      </section>

      {/* Parede de clientes: a prova de 15 anos, em texto legível sem imagens. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <h2 className="eyebrow text-mute">{t("clientsLabel")}</h2>
        <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-3 border-t border-paper-3 pt-5">
          {clients.map((client) => (
            <span key={client.name} className="font-display text-lg lg:text-xl">
              {client.name}
            </span>
          ))}
          <span className="text-sm text-mute">{t("clientsTail")}</span>
        </div>
      </section>

      {/* Índice de trabalho: linhas densas com o número à direita. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="eyebrow">{t("workEyebrow")}</span>
            <h2 className="mt-2 text-chapter">{t("workIndex")}</h2>
          </div>
          <span className="text-sm text-mute">{projects.length} · 2010—2026</span>
        </div>
        <WorkIndex rows={rows} />

        {/* Três casos em cartão: raio 20, sombra sm, cor plana no lugar da fotografia. */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((project, index) => (
            <Link
              key={project.slug}
              href={{ pathname: "/projetos/[slug]", params: { slug: project.slug } }}
              className="card flex flex-col overflow-hidden"
            >
              <div
                className={`flex h-[150px] items-end p-4 text-xs font-semibold uppercase tracking-[0.08em] ${
                  [
                    "bg-slate text-white",
                    "bg-red text-white",
                    "bg-lavender text-ink",
                  ][index]
                }`}
              >
                {project.client}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-xl">{project.title[locale]}</h3>
                <span className="font-display text-3xl leading-none tabular-nums text-red">
                  {project.headline.value}
                </span>
                <span className="text-sm text-mute">{project.headline.label[locale]}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Faixa de cor plana: uma mensagem, um acento. */}
      <section className="bg-chartreuse py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] items-end justify-between gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,58%)_minmax(0,34%)]">
          <div>
            <span className="eyebrow text-red-deep">{t("bandEyebrow")}</span>
            <h2 className="mt-4 text-chapter">{t("bandTitle")}</h2>
          </div>
          <p className="text-md text-ink/80">{t("bandBody")}</p>
        </div>
      </section>

      <Ticker
        items={[
          "be the change",
          t("eyebrow"),
          locale === "pt" ? "quando a visão é clara, a estratégia é fácil" : "when the vision is clear, strategy is easy",
        ]}
      />

      {/* Bloco ink: os quatro pilares, com um único acento na IA. */}
      <section className="bg-ink py-16 text-paper lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-chartreuse">{t("servicesLabel")}</span>
          <h2 className="mt-4 max-w-[24ch] text-chapter text-paper">{t("servicesTitle")}</h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => {
              const accent = service.slug === "inteligencia-artificial";
              return (
                <div
                  key={service.slug}
                  className={`flex min-h-[200px] flex-col gap-3 rounded-[20px] p-6 ${
                    accent ? "bg-lavender text-ink" : "bg-slate text-paper"
                  }`}
                >
                  <h3 className={`text-xl ${accent ? "text-ink" : "text-paper"}`}>{service.name[locale]}</h3>
                  <p className={`text-sm ${accent ? "text-ink/80" : "text-paper/70"}`}>{service.claim[locale]}</p>
                  <span className={`mt-auto text-sm font-semibold ${accent ? "text-red-deep" : "text-chartreuse"}`}>
                    {service.link[locale]} →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
