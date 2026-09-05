import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { GraficoDeArea, type Grafico } from "@/components/GraficoDeArea";
import { tecnologia, type AreaDeTecnologia } from "@/content/tecnologia";
import { servicoDeTecnologia } from "@/content/tecnologia-servicos";
import { getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * A página-mãe de Tecnologia.
 *
 * Uma rota fixa que ganha à dinâmica `[slug]`, como as de Branding e de
 * Marketing, e com a fórmula desta última: o topo em vídeo, o mapa, um capítulo
 * por serviço com a sua unidade de medida e o seu gráfico, o método em
 * vermelho, o trabalho, e uma faixa em tinta para o que vem depois de publicar.
 * Aqui o mapa tem quatro serviços e não quatro áreas: cada capítulo é uma
 * página, e as faixas dentro dele são o que cabe lá — todas levam à mesma
 * página, porque é a lista do serviço e não uma lista de serviços.
 *
 * As fases e a frase de promessa continuam a vir do serviço no painel.
 */
const SLUG = "tecnologia";
const ROTA = "/servicos/tecnologia/[sub]" as const;

/*
 * A cor que varre cada capítulo ao passar o rato: as quatro da homepage, pela
 * mesma ordem que no Marketing. Sobre as claras o texto fica em tinta. As
 * classes vão escritas por inteiro porque o Tailwind lê o código à procura delas.
 */
const TONS = [
  { fundo: "bg-red", texto: "hover:text-paper", linha: "group-hover:text-paper/80", seta: "group-hover:text-paper" },
  { fundo: "bg-lavender", texto: "hover:text-ink", linha: "group-hover:text-ink/70", seta: "group-hover:text-ink" },
  { fundo: "bg-coral", texto: "hover:text-ink", linha: "group-hover:text-ink/70", seta: "group-hover:text-ink" },
  { fundo: "bg-chartreuse", texto: "hover:text-ink", linha: "group-hover:text-ink/70", seta: "group-hover:text-ink" },
];

/** O desenho de cada serviço: o gesto da sua unidade de medida. */
const GRAFICOS: Record<AreaDeTecnologia, Grafico> = {
  web: "conversao",
  apps: "retencao",
  dados: "integracao",
  performance: "velocidade",
};

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const service = await getService(SLUG);
  const nome = service?.name[locale] ?? "Tecnologia";
  return {
    title: nome,
    description: tecnologia.descricao[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: service ? slugFor(service, candidate) : SLUG } }),
      locale,
    ),
    openGraph: { type: "website", title: nome, description: tecnologia.descricao[locale], images: [{ url: `${SITE_URL}${tecnologia.topo.poster.src}` }] },
  };
}

export default async function TecnologiaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const m = tecnologia;
  const [service, all] = await Promise.all([getService(SLUG), getServices()]);
  const casos = await getProjectsBySlugs(service?.caseSlugs?.length ? service.caseSlugs : [...m.trabalho.casos]);
  const outros = all.filter((item) => item.slug !== SLUG);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service?.name[locale] ?? "Tecnologia",
    description: m.descricao[locale],
    provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
    areaServed: "PT",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: service?.name[locale] ?? "Tecnologia",
      itemListElement: m.lista.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nome[locale] } })),
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

  // A página de um serviço, pelo slug português do registo.
  const paginaDe = (sub: string) => {
    const pagina = servicoDeTecnologia(sub);
    return pagina ? ({ pathname: ROTA, params: { sub: pagina.slug[locale] } } as const) : undefined;
  };
  const manutencao = paginaDe("performance-acessibilidade-migracoes");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Abertura ─────────────────────────────────────────────────────────
          A mesma da página de Marketing: vídeo como textura, título palavra a
          palavra, o mapa logo a seguir em papel. */}
      <header className="surface-cover relative isolate -mt-6 flex min-h-[100lvh] flex-col justify-end overflow-hidden bg-ink pb-32 pt-[140px] sm:-mt-24 sm:pb-14 lg:pb-16">
        <Image src={m.topo.poster.src} alt="" fill priority sizes="100vw" className="topo-paralaxe -z-30 object-cover" />
        <video
          className="video-fundo topo-paralaxe absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={m.topo.poster.src}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={m.topo.video} type="video/mp4" />
        </video>
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/97 via-ink/86 to-ink/72" />
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
          Quatro colunas, um serviço em cada, com a unidade de medida e o que
          cabe lá dentro. Tudo liga à página do serviço. Não se anima: pode
          estar no ecrã quando a página abre. */}
      <section className="surface-paper py-14 lg:py-16" aria-labelledby="mapa">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <h2 id="mapa" className="eyebrow text-red">{m.mapa.eyebrow[locale]}</h2>
          <div className="mt-5 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {m.lista.map((s, i) => {
              const href = paginaDe(s.sub);
              const cabeca = (
                <>
                  <span className="eyebrow text-red">{s.nome[locale]}</span>
                  <span className="font-display text-[22px] text-fg-soft">{s.medida[locale]}</span>
                </>
              );
              return (
                <div
                  key={s.chave}
                  className={`flex flex-col border-b border-line py-6 lg:border-b-0 lg:py-7 ${i ? "lg:border-l lg:pl-6" : ""} ${i < 3 ? "lg:pr-6" : ""} ${i % 2 ? "sm:border-l sm:pl-6 lg:border-l" : ""}`}
                >
                  {href ? (
                    <Link href={href} className="group flex flex-col gap-1.5 border-b border-line pb-4 transition-colors duration-200 hover:text-red">
                      {cabeca}
                    </Link>
                  ) : (
                    <a href={`#${s.chave}`} className="flex flex-col gap-1.5 border-b border-line pb-4">
                      {cabeca}
                    </a>
                  )}
                  <div className="mt-1 flex flex-col">
                    {s.capacidades.map((c) => {
                      const classe = "flex items-baseline gap-3 border-b border-line py-3 last:border-b-0 transition-colors duration-200 hover:text-red group";
                      const corpo = <span className="font-display text-[clamp(20px,1.7vw,26px)] leading-[1.15]">{c.nome[locale]}</span>;
                      return href ? (
                        <Link key={c.nome.pt} href={href} className={classe}>
                          {corpo}
                          <span aria-hidden="true" className="ms-auto text-red opacity-0 transition-opacity duration-200 group-hover:opacity-100">→</span>
                        </Link>
                      ) : (
                        <span key={c.nome.pt} className={classe}>
                          {corpo}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Os serviços, um capítulo cada ─────────────────────────────────── */}
      <section className="surface-paper bg-white py-24 lg:py-28 [--color-line:var(--color-paper-2)]">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
            <div>
              <span className="eyebrow text-red">{m.areas.eyebrow[locale]}</span>
              <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(34px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.areas.titulo[locale]}</h2>
            </div>
            <p className="max-w-[44ch] text-md text-fg-soft lg:justify-self-end">{m.areas.nota[locale]}</p>
          </div>

          <div className="mt-10">
            {m.lista.map((s, ordem) => {
              const href = paginaDe(s.sub);
              const tom = TONS[ordem % TONS.length];
              return (
                <article key={s.chave} id={s.chave} className="border-t border-line py-16 lg:py-20">
                  <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-16">
                    <div className="entra">
                      <span className="varre block h-0.5 w-[72px] bg-red" />
                      <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                        <span className="eyebrow text-red">{s.nome[locale]}</span>
                        <span className="font-display text-[clamp(26px,2.4vw,34px)] leading-none tracking-[-0.02em] tabular-nums text-fg">{s.medida[locale]}</span>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-soft">{s.medidaNota[locale]}</span>
                      </div>
                      <h3 className="mt-5 max-w-[24ch] font-display text-[clamp(30px,3.6vw,54px)] leading-[1.02] tracking-[-0.022em]">{s.titulo[locale]}</h3>
                      <p className="mt-5 max-w-[52ch] text-md text-fg-soft">{s.posicao[locale]}</p>
                      {href ? (
                        <Link href={href} className="btn-pill btn-pill-ink mt-7">
                          {s.nome[locale]} <span aria-hidden="true">→</span>
                        </Link>
                      ) : null}
                    </div>
                    <figure className="entra-tarde m-0 rounded-[6px] bg-[#1d2126] p-4 text-paper">
                      <GraficoDeArea tipo={GRAFICOS[s.chave]} />
                      <figcaption className="mt-3 flex justify-between text-[11.5px] text-paper/55">
                        <span>{s.legenda[locale]}</span>
                        <span className="tabular-nums">{s.alcance[locale]}</span>
                      </figcaption>
                    </figure>
                  </div>

                  {/* O que cabe no serviço, em faixas a toda a largura, com a cor
                      a varrer da esquerda ao passar o rato. Todas levam à página
                      do serviço: são a lista do que ele inclui. */}
                  <div className="entra mt-12 border-t border-line">
                    {s.capacidades.map((c) => {
                      const dentro = (
                        <span className="relative grid gap-x-8 gap-y-2 px-4 py-6 sm:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_40px] sm:items-center sm:px-6 lg:py-7">
                          <span className="font-display text-[clamp(24px,2.6vw,38px)] leading-[1.05] tracking-[-0.02em]">{c.nome[locale]}</span>
                          <span className={`text-[15px] text-fg-soft transition-colors duration-300 ${tom.linha}`}>{c.linha[locale]}</span>
                          <span aria-hidden="true" className={`hidden text-right text-2xl sm:block ${href ? `text-red transition-colors duration-300 ${tom.seta}` : "text-fg-soft/40"}`}>
                            {href ? "→" : "·"}
                          </span>
                        </span>
                      );
                      const varredura = (
                        <span
                          aria-hidden="true"
                          className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${tom.fundo}`}
                        />
                      );
                      const classe = `relative block overflow-hidden border-b border-line group transition-colors duration-300 ${tom.texto}`;
                      return href ? (
                        <Link key={c.nome.pt} href={href} className={classe}>
                          {varredura}
                          {dentro}
                        </Link>
                      ) : (
                        <div key={c.nome.pt} className={classe}>
                          {varredura}
                          {dentro}
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── O método, em vermelho ─────────────────────────────────────────── */}
      {service?.phases?.length ? (
        <section className="surface-red py-24 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
              <div>
                <span className="eyebrow text-ink/70">{m.metodo.eyebrow[locale]}</span>
                <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(34px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.metodo.titulo[locale]}</h2>
              </div>
              <p className="max-w-[44ch] text-md text-fg-soft lg:justify-self-end">{m.metodo.nota[locale]}</p>
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

      {/* ── Trabalho, parceiros e stack ───────────────────────────────────── */}
      <section className="surface-paper py-24 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
            <div className="entra">
              <span className="eyebrow text-red">{m.trabalho.eyebrow[locale]}</span>
              <h2 className="mt-4 max-w-[26ch] text-chapter">{m.trabalho.titulo[locale]}</h2>
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

      {/* ── Depois de publicar: o JellyCARE ───────────────────────────────── */}
      <section className="surface-ink py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="entra">
            <span className="eyebrow text-red">{m.cuidar.eyebrow[locale]}</span>
            <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(30px,3.6vw,54px)] leading-[1.02] tracking-[-0.025em]">{m.cuidar.titulo[locale]}</h2>
            <p className="mt-5 max-w-[46ch] text-md text-fg-soft">{m.cuidar.texto[locale]}</p>
            {manutencao ? (
              <Link href={manutencao} className="btn-pill mt-7">
                {m.cuidar.cta[locale]} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
          <ul className="entra-tarde border-t border-line">
            {m.cuidar.itens.map((item) => (
              <li key={item.nome.pt} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4">
                <span className="font-medium">{item.nome[locale]}</span>
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
              <h2 className="max-w-[18ch] font-display text-[clamp(32px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.fecho.titulo[locale]}</h2>
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
