import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { GraficoDeArea } from "@/components/GraficoDeArea";
import { marketing } from "@/content/marketing";
import { getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * A página-mãe de Marketing.
 *
 * Uma rota fixa que ganha à dinâmica `[slug]`, como a de Branding. A genérica
 * descrevia o serviço com quatro bullets e quatro fases; este é o serviço pelo
 * qual mais nos procuram, e a página tem de ser o chapéu de tudo o que cabe
 * nele: dez serviços em quatro áreas, cada área com a sua unidade de medida.
 *
 * As fases e a frase de promessa continuam a vir do serviço no painel — é a
 * parte que a casa edita. O mapa e as áreas vivem em `content/marketing.ts`
 * até haver página para cada serviço.
 */
const SLUG = "marketing";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const service = await getService(SLUG);
  const nome = service?.name[locale] ?? "Marketing";
  return {
    title: nome,
    description: marketing.descricao[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: service ? slugFor(service, candidate) : SLUG } }),
      locale,
    ),
    openGraph: { type: "website", title: nome, description: marketing.descricao[locale] },
  };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const m = marketing;
  const [service, all] = await Promise.all([getService(SLUG), getServices()]);
  const casos = await getProjectsBySlugs(service?.caseSlugs?.length ? service.caseSlugs : [...m.trabalho.casos]);
  const outros = all.filter((item) => item.slug !== SLUG);
  const ia = all.find((item) => item.slug === "inteligencia-artificial");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service?.name[locale] ?? "Marketing",
    description: m.descricao[locale],
    provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
    areaServed: "PT",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: service?.name[locale] ?? "Marketing",
      itemListElement: m.lista.flatMap((area) =>
        area.servicos.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nome[locale], category: area.nome[locale] } })),
      ),
    },
  };

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {m.cta[locale]} <span aria-hidden="true">→</span>
    </Link>
  );

  // O título entra palavra a palavra ao carregar; `--vez` é a ordem de cada uma.
  const palavras = [
    ...m.titulo.forte[locale].split(" ").map((p) => ({ p, vermelha: false })),
    ...m.titulo.vermelho[locale].split(" ").map((p) => ({ p, vermelha: true })),
  ];

  const entradaDeServico = (s: (typeof m.lista)[number]["servicos"][number], classe: string) => {
    const corpo = (
      <>
        <span className="font-display text-[clamp(20px,1.7vw,26px)] leading-[1.15]">{s.nome[locale]}</span>
        {s.novo ? (
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-paper">{m.areas.novo[locale]}</span>
        ) : null}
      </>
    );
    return s.href ? (
      <Link key={s.nome.pt} href={s.href as "/contactos"} className={`${classe} group`}>
        {corpo}
        <span aria-hidden="true" className="ms-auto text-red opacity-0 transition-opacity duration-200 group-hover:opacity-100">→</span>
      </Link>
    ) : (
      <span key={s.nome.pt} className={classe}>
        {corpo}
      </span>
    );
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Abertura ─────────────────────────────────────────────────────────
          Curta e em tinta: uma frase, uma linha. O chapéu está logo a seguir,
          em papel — é ele a imagem desta página. Acima da dobra, e por isso a
          entrada é uma animação de tempo, como no manifesto do Branding. */}
      <header className="surface-ink relative -mt-6 flex flex-col justify-end overflow-hidden pb-14 pt-[140px] sm:-mt-24 lg:pb-16 lg:pt-[168px]">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-red">{m.eyebrow[locale]}</span>
          <h1
            className="mt-6 max-w-[16ch] font-display text-[clamp(44px,7vw,110px)] leading-[0.96] tracking-[-0.03em]"
            aria-label={`${m.titulo.forte[locale]} ${m.titulo.vermelho[locale]}`}
          >
            {palavras.map(({ p, vermelha }, i) => (
              <span key={p + i} aria-hidden="true">
                <span className={`manifesto-palavra ${vermelha ? "text-red" : ""}`} style={{ "--vez": i } as React.CSSProperties}>
                  {p}
                </span>{" "}
              </span>
            ))}
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
            <p className="subtitle max-w-[46ch]">{m.lead[locale]}</p>
            {chamada}
          </div>
        </div>
      </header>

      {/* ── O mapa ──────────────────────────────────────────────────────────
          Quatro colunas, dez serviços, a unidade de medida de cada área. Quem
          chega vê a área de atuação inteira sem descer. Não se anima: pode
          estar no ecrã quando a página abre. */}
      <section className="surface-paper py-14 lg:py-16" aria-labelledby="mapa">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <h2 id="mapa" className="eyebrow text-red">{m.mapa.eyebrow[locale]}</h2>
          <div className="mt-5 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {m.lista.map((area, i) => (
              <div
                key={area.chave}
                className={`flex flex-col border-b border-line py-6 lg:border-b-0 lg:py-7 ${i ? "lg:border-l lg:pl-6" : ""} ${i < 3 ? "lg:pr-6" : ""} ${i % 2 ? "sm:border-l sm:pl-6 lg:border-l" : ""}`}
              >
                <a href={`#${area.chave}`} className="flex flex-col gap-1.5 border-b border-line pb-4">
                  <span className="eyebrow text-red">{area.nome[locale]}</span>
                  <span className="font-display text-[22px] text-fg-soft">{area.medida[locale]}</span>
                </a>
                <div className="mt-1 flex flex-col">
                  {area.servicos.map((s) =>
                    entradaDeServico(s, "flex items-baseline gap-3 border-b border-line py-3 last:border-b-0 transition-colors duration-200 hover:text-red"),
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── As áreas ───────────────────────────────────────────────────────── */}
      <section className="surface-paper bg-white py-24 lg:py-28 [--color-line:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-end lg:gap-14">
            <div>
              <span className="eyebrow text-red">{m.areas.eyebrow[locale]}</span>
              <h2 className="mt-4 font-display text-[clamp(34px,4vw,60px)] leading-[1.0] tracking-[-0.025em]">{m.areas.titulo[locale]}</h2>
            </div>
            <p className="max-w-[52ch] text-md text-fg-soft">{m.areas.nota[locale]}</p>
          </div>

          <div className="mt-6">
            {m.lista.map((area) => (
              <article
                key={area.chave}
                id={area.chave}
                className="grid gap-8 border-t border-line py-16 lg:grid-cols-[320px_minmax(0,1fr)_380px] lg:items-start lg:gap-14 lg:py-20"
              >
                <div className="entra">
                  <span className="varre block h-0.5 w-[72px] bg-red" />
                  <p className="mt-6 font-display text-[clamp(40px,4vw,56px)] leading-none tracking-[-0.02em] tabular-nums">{area.medida[locale]}</p>
                  <span className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-soft">{area.medidaNota[locale]}</span>
                </div>
                <div className="entra">
                  <span className="eyebrow text-red">{area.nome[locale]}</span>
                  <h3 className="mt-2 max-w-[18ch] font-display text-[clamp(28px,3vw,42px)] leading-[1.04] tracking-[-0.02em]">{area.titulo[locale]}</h3>
                  <p className="mt-4 max-w-[40ch] text-md text-fg-soft">{area.posicao[locale]}</p>
                  <div className="mt-7 border-t border-line">
                    {area.servicos.map((s) => {
                      const classe = "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 border-b border-line py-4 transition-[padding] duration-300 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_auto] hover:pl-2";
                      const conteudo = (
                        <>
                          <span className="flex flex-wrap items-center gap-2 text-[16px] font-medium text-fg">
                            {s.nome[locale]}
                            {s.novo ? (
                              <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-paper">{m.areas.novo[locale]}</span>
                            ) : null}
                          </span>
                          <span className="col-span-2 text-[13.5px] text-fg-soft sm:col-span-1">{s.linha[locale]}</span>
                          <span
                            aria-hidden="true"
                            className={`row-start-1 grid h-[34px] w-[34px] place-items-center rounded-full text-fg shadow-[inset_0_0_0_1px_var(--color-line)] sm:row-auto ${s.href ? "" : "opacity-40"}`}
                          >
                            {s.href ? "→" : "·"}
                          </span>
                        </>
                      );
                      return s.href ? (
                        <Link key={s.nome.pt} href={s.href as "/contactos"} className={`${classe} group`} title={s.nome[locale]}>
                          {conteudo}
                        </Link>
                      ) : (
                        <div key={s.nome.pt} className={classe} title={m.areas.emBreve[locale]}>
                          {conteudo}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <figure className="entra-tarde m-0 rounded-[6px] bg-[#1d2126] p-4 text-paper lg:sticky lg:top-24">
                  <GraficoDeArea tipo={area.chave} />
                  <figcaption className="mt-3 flex justify-between text-[11.5px] text-paper/55">
                    <span>{area.legenda[locale]}</span>
                    <span className="tabular-nums">{area.alcance[locale]}</span>
                  </figcaption>
                </figure>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── O método, em vermelho ───────────────────────────────────────────
          As fases vêm do painel. É a única secção vermelha antes do fecho: o
          meio da página tem de ter uma cor a mais que papel e tinta. */}
      {service?.phases?.length ? (
        <section className="surface-red py-24 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-end lg:gap-14">
              <div>
                <span className="eyebrow text-ink/70">{m.metodo.eyebrow[locale]}</span>
                <h2 className="mt-4 font-display text-[clamp(34px,4vw,60px)] leading-[1.0] tracking-[-0.025em]">{m.metodo.titulo[locale]}</h2>
              </div>
              <p className="max-w-[52ch] text-md text-fg-soft">{m.metodo.nota[locale]}</p>
            </div>
            <ol className="relative mt-14 grid gap-12 pl-7 sm:pl-10">
              <span aria-hidden="true" className="camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-ink to-ink/30" />
              {service.phases.map((fase, i) => (
                <li key={fase.name.pt} className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10">
                  <span aria-hidden="true" className="type-outline type-outline-ink font-display text-[clamp(48px,6vw,88px)] leading-[0.8]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="editorial text-2xl lg:text-3xl">{fase.name[locale]}</h3>
                    <p className="mt-3 max-w-[58ch] text-md text-fg-soft">{fase.body[locale]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── Trabalho e parceiros ────────────────────────────────────────────── */}
      <section className="surface-paper py-24 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
            <div className="entra">
              <span className="eyebrow text-red">{m.trabalho.eyebrow[locale]}</span>
              <h2 className="mt-4 max-w-[20ch] text-chapter">{m.trabalho.titulo[locale]}</h2>
            </div>
            <Link href="/projetos" className="btn-pill btn-pill-ink">
              {m.trabalho.todos[locale]} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {casos.length ? (
            <div>
              {casos.map((project) => (
                <Link
                  key={project.slug}
                  href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
                  className="entra group grid grid-cols-[minmax(0,1fr)_76px] items-baseline gap-4 border-b border-line py-4 row-flip hover:pl-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px]"
                >
                  <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{project.client}</span>
                  <span className="hidden text-sm text-fg-soft sm:block">{project.title[locale]}</span>
                  {/* O número só vai para o ecrã depois de validado com o cliente. */}
                  <span className="text-right font-display tabular-nums text-red lg:text-lg">{project.numbersValidated ? project.headline.value : ""}</span>
                </Link>
              ))}
            </div>
          ) : null}
          <div className="entra mt-12">
            <span className="eyebrow text-red">{m.trabalho.parceirosEyebrow[locale]}</span>
            <ul className="mt-4 flex flex-wrap gap-x-9 gap-y-3 text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-soft">
              {m.trabalho.parceiros.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── A IA, transversal ──────────────────────────────────────────────── */}
      <section className="surface-ink py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="entra">
            <span className="eyebrow text-red">{m.ia.eyebrow[locale]}</span>
            <h2 className="mt-4 max-w-[18ch] font-display text-[clamp(30px,3.6vw,54px)] leading-[1.02] tracking-[-0.025em]">{m.ia.titulo[locale]}</h2>
            <p className="mt-5 max-w-[46ch] text-md text-fg-soft">{m.ia.texto[locale]}</p>
            {ia ? (
              <Link href={{ pathname: "/servicos/[slug]", params: { slug: slugFor(ia, locale) } }} className="btn-pill mt-7">
                {m.ia.cta[locale]} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
          <ul className="entra-tarde border-t border-line">
            {m.ia.itens.map((item) => (
              <li key={item.nome.pt} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4">
                {"href" in item && item.href ? (
                  <Link href={item.href as "/contactos"} className="font-medium transition-colors duration-200 hover:text-red">
                    {item.nome[locale]}
                  </Link>
                ) : (
                  <span className="font-medium">{item.nome[locale]}</span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-red">{item.area[locale]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Fecho e outras disciplinas ───────────────────────────────────── */}
      <section className="surface-paper py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="surface-red grid gap-8 rounded-[6px] px-8 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-16 lg:py-16">
            <div className="entra-perto">
              <h2 className="max-w-[14ch] font-display text-[clamp(32px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.fecho.titulo[locale]}</h2>
              <p className="mt-4 max-w-[46ch] text-md text-fg-soft">{m.fecho.texto[locale]}</p>
            </div>
            <Link href="/contactos" className="btn-pill btn-pill-ink">
              {m.fecho.cta[locale]} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <h2 className="entra-perto eyebrow mt-24 text-red">{t("others")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {outros.map((item) => (
              <Link
                key={item.slug}
                href={{ pathname: "/servicos/[slug]", params: { slug: slugFor(item, locale) } }}
                className="entra-perto card flex flex-col gap-2 p-6"
              >
                <h3 className="text-xl">{item.name[locale]}</h3>
                <p className="text-sm text-fg-soft">{item.claim[locale]}</p>
                <span className="mt-auto pt-4 text-sm font-semibold text-red">{item.link[locale]} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
