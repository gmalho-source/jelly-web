import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { AnatomiaDaMarca } from "@/components/AnatomiaDaMarca";
import { ObrasComAcento } from "@/components/ObrasComAcento";
import { branding } from "@/content/branding";
import { getService, getServices } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * A página de Branding.
 *
 * Uma rota fixa que ganha à dinâmica `[slug]`: a página de serviço genérica
 * descrevia branding com quatro bullets, e para a disciplina cujo argumento é
 * tornar reconhecível isso era uma contradição. Esta faz o que anuncia — o
 * manifesto no topo, o trabalho em matéria com a cor a mudar por marca, e a
 * anatomia onde se desligam as decisões para se ver o que sobra.
 *
 * As fases continuam a vir do serviço no painel: é a parte que a casa edita.
 */
const SLUG = "branding";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const service = await getService(SLUG);
  return {
    title: service?.name[locale] ?? "Branding",
    description: branding.descricao[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: service ? slugFor(service, candidate) : SLUG } }),
      locale,
    ),
    openGraph: { type: "website", title: service?.name[locale] ?? "Branding", description: branding.descricao[locale], images: [{ url: `${SITE_URL}/media/branding-clinica.webp` }] },
  };
}

export default async function BrandingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const [service, all] = await Promise.all([getService(SLUG), getServices()]);
  const outros = all.filter((item) => item.slug !== SLUG);
  const b = branding;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service?.name[locale] ?? "Branding",
    description: b.descricao[locale],
    provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
    areaServed: "PT",
  };

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {b.cta[locale]} <span aria-hidden="true">→</span>
    </Link>
  );

  // A frase entra palavra a palavra; `--vez` é a ordem de cada uma.
  const palavras = [
    ...b.manifesto.forte.map((p) => ({ p, fraca: false })),
    ...b.manifesto.fraco.map((p) => ({ p, fraca: true })),
    { p: b.manifesto.fecho, fraca: false },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── O manifesto ─────────────────────────────────────────────────────
          Sem vídeo: a frase é a imagem. Acima da dobra, e por isso a entrada é
          uma animação de tempo ao carregar e não de scroll. A fita por baixo é
          o trabalho em matéria — cartões, garrafa, relevo — a dizer desde o
          primeiro ecrã que isto se pega na mão. */}
      <header className="surface-ink relative -mt-6 flex min-h-[92svh] flex-col justify-end overflow-hidden pb-10 pt-[140px] sm:-mt-24">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-red">{b.eyebrow[locale]}</span>
          <h1
            className="mt-6 max-w-[12ch] font-display text-[clamp(46px,9.2vw,148px)] leading-[0.94] tracking-[-0.035em]"
            aria-label={`${b.manifesto.forte.join(" ")} ${b.manifesto.fraco.join(" ")} ${b.manifesto.fecho}`}
          >
            {palavras.map(({ p, fraca }, i) => (
              <span key={p + i} aria-hidden="true">
                <span
                  className={`manifesto-palavra ${fraca ? "text-paper/40" : ""}`}
                  style={{ "--vez": i } as React.CSSProperties}
                >
                  {p}
                </span>{" "}
              </span>
            ))}
          </h1>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
            <p className="subtitle max-w-[48ch]">{b.claim[locale]}</p>
            {chamada}
          </div>
        </div>
        <div aria-hidden="true" className="mx-auto mt-10 grid w-full max-w-[1200px] grid-cols-3 gap-0.5 px-5 sm:px-8">
          {b.obras.map((obra) => (
            <Image
              key={obra.slug}
              src={obra.imagem.src}
              alt=""
              width={640}
              height={480}
              sizes="(max-width: 1200px) 33vw, 400px"
              className="aspect-[4/3] w-full object-cover"
            />
          ))}
        </div>
      </header>

      {/* ── A tese, em vermelho ──────────────────────────────────────────── */}
      <section className="surface-red py-20 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="max-w-[22ch] font-display text-[clamp(30px,5vw,72px)] leading-[1.0] tracking-[-0.025em]">{b.tese.a[locale]}</p>
          <span aria-hidden="true" className="mt-9 block h-px w-full max-w-[420px] bg-ink/30" />
          <p className="mt-9 max-w-[30ch] font-display text-[clamp(20px,2.6vw,34px)] leading-[1.14] text-fg-soft">{b.tese.b[locale]}</p>
        </div>
      </section>

      {/* ── O trabalho, em matéria ───────────────────────────────────────────
          A cor do cabeçalho segue a marca que está no ecrã: ver ObrasComAcento. */}
      <ObrasComAcento className="obras surface-ink">
        <div className="mx-auto max-w-[1200px] px-5 pb-6 pt-24 sm:px-8 lg:pt-28">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
            <div>
              <span className="eyebrow acento-vivo">{b.materia.eyebrow[locale]}</span>
              <h2 className="mt-4 max-w-[22ch] text-chapter">{b.materia.titulo[locale]}</h2>
            </div>
            <span aria-hidden="true" className="acento-vivo-contorno font-display text-[clamp(40px,6vw,88px)] leading-[0.85]">
              {String(b.obras.length).padStart(2, "0")}
            </span>
          </div>

          {b.obras.map((obra, i) => (
            <article
              key={obra.slug}
              data-acento={obra.acento}
              style={{ "--acento": obra.acento } as React.CSSProperties}
              className="grid items-center gap-7 border-b border-line/60 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-16 lg:py-20"
            >
              <div className={`entra ${i % 2 ? "md:order-2" : ""}`}>
                <span aria-hidden="true" className="varre block h-0.5 w-[72px] bg-[var(--acento)]" />
                <span className="eyebrow mt-6 block text-[var(--acento)]">{obra.rotulo[locale]}</span>
                <h3 className="editorial mt-3 text-[clamp(28px,3.6vw,50px)] leading-[1.02] tracking-[-0.02em]">{obra.cliente}</h3>
                <p className="mt-4 max-w-[44ch] text-md text-fg-soft">{obra.corpo[locale]}</p>
                <ul className="mt-6 flex flex-wrap gap-2">
                  {obra.etiquetas.map((e) => (
                    <li key={e.pt} className="rounded-full border border-line px-3 py-1.5 text-[11.5px] uppercase tracking-[0.06em] text-fg-soft">
                      {e[locale]}
                    </li>
                  ))}
                </ul>
              </div>
              <figure className={`entra-tarde group relative m-0 overflow-hidden rounded-[6px] ${i % 2 ? "md:order-1" : ""}`}>
                <Image
                  src={obra.imagem.src}
                  alt={obra.imagem.alt[locale]}
                  width={obra.imagem.width}
                  height={obra.imagem.height}
                  sizes="(max-width: 768px) 100vw, 660px"
                  className="aspect-[4/3] w-full scale-[1.02] object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--acento)]" />
              </figure>
            </article>
          ))}
        </div>
      </ObrasComAcento>

      {/* ── Anatomia ─────────────────────────────────────────────────────── */}
      <section className="surface-paper py-24 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-red">{b.anatomia.eyebrow[locale]}</span>
          <h2 className="entra mt-4 max-w-[18ch] font-display text-[clamp(30px,4.4vw,60px)] leading-[1.0] tracking-[-0.025em]">{b.anatomia.titulo[locale]}</h2>
          <p className="entra mt-5 max-w-[58ch] text-md text-fg-soft">{b.anatomia.texto[locale]}</p>
          <AnatomiaDaMarca locale={locale} />
        </div>
      </section>

      {/* ── As fases, com o fio ──────────────────────────────────────────── */}
      {service?.phases?.length ? (
        <section className="surface-ink py-24 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <span className="eyebrow text-red">{b.fases.eyebrow[locale]}</span>
            <h2 className="mt-4 text-chapter">{b.fases.titulo[locale]}</h2>
            <ol className="relative mt-14 grid gap-14 pl-7 sm:pl-10">
              <span aria-hidden="true" className="camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-red to-lavender" />
              {service.phases.map((fase, i) => (
                <li key={fase.name.pt} className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10">
                  <span aria-hidden="true" className="type-outline font-display text-[clamp(48px,6vw,88px)] leading-[0.8] [--outline-color:var(--color-red)]">
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

      {/* ── O que fazemos ────────────────────────────────────────────────── */}
      <section className="surface-paper py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-red">{b.servicos.eyebrow[locale]}</span>
          <h2 className="entra mt-4 max-w-[20ch] text-chapter">{b.servicos.titulo[locale]}</h2>
          <div className="mt-11 grid gap-9 border-t border-line pt-9 md:grid-cols-3 md:gap-12">
            {b.servicos.colunas.map((col, i) => (
              <div key={col.nome.pt} className={i % 2 ? "entra-tarde" : "entra"}>
                <h3 className="flex items-center gap-3 font-display text-xl">
                  <span aria-hidden="true" className="block h-0.5 w-7 bg-red" />
                  {col.nome[locale]}
                </h3>
                <ul className="mt-4 flex flex-col gap-2 text-[15.5px] text-fg-soft">
                  {col.itens.map((it) => (
                    <li key={it.pt}>{it[locale]}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fecho e outras disciplinas ───────────────────────────────────── */}
      <section className="surface-ink py-24">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-8 px-5 sm:px-8">
          <div className="entra">
            <h2 className="max-w-[16ch] font-display text-[clamp(30px,4.6vw,64px)] leading-[1.0] tracking-[-0.025em]">{b.fecho.titulo[locale]}</h2>
            <p className="mt-4 max-w-[44ch] text-md text-fg-soft">{b.fecho.texto[locale]}</p>
          </div>
          {chamada}
        </div>
        <div className="mx-auto max-w-[1200px] px-5 pt-24 sm:px-8">
          <h2 className="entra-perto eyebrow">{t("others")}</h2>
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
