import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ObrasComAcento } from "@/components/ObrasComAcento";
import { branding } from "@/content/branding";
import { getProjectGrid, getService, getServices } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * A página de Branding.
 *
 * Uma rota fixa que ganha à dinâmica `[slug]`: a página de serviço genérica
 * descrevia branding com quatro bullets, e para a disciplina cujo argumento é
 * tornar reconhecível isso era uma contradição. Esta faz o que anuncia — o
 * manifesto no topo, uma frase sobre o que fazemos, e as marcas mais recentes
 * com a cor da secção a mudar de uma para a outra.
 *
 * Do painel vêm as fases do serviço e as marcas: os projetos com a disciplina
 * Branding, os mais recentes primeiro.
 */
const SLUG = "branding";

/** Quantas marcas mostra o bloco do trabalho. */
const MARCAS = 3;

/*
 * As cores da casa que a secção do trabalho vai tomando, uma por marca. Eram
 * cores de cada cliente quando as marcas estavam escritas à mão; vindas do
 * painel não trazem cor, e as da casa rodam pela mesma ordem do menu.
 */
const ACENTOS = ["var(--color-lavender)", "var(--color-chartreuse)", "var(--color-coral)"];

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
  const [service, all, projetos] = await Promise.all([getService(SLUG), getServices(), getProjectGrid()]);
  const outros = all.filter((item) => item.slug !== SLUG);
  // A grelha já vem do mais recente para o mais antigo. «Brand Activation» não
  // conta: é ativação de marca no terreno, não construção de marca.
  const marcas = projetos
    .filter((projeto) => projeto.cover?.src && projeto.disciplines.some((d) => d.trim().toLowerCase() === "branding"))
    .slice(0, MARCAS);
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
          A citação por cima do vídeo da equipa, que corre mudo e em ciclo. O
          véu escurece mais em baixo, onde está o texto: o vídeo tem papel
          branco em plano, e a frase branca tem de se ler por cima dele.
          Acima da dobra, e por isso a entrada é uma animação de tempo ao
          carregar e não de scroll. */}
      <header className="surface-ink relative isolate -mt-6 flex min-h-[86svh] flex-col justify-end overflow-hidden pb-8 pt-[140px] sm:-mt-24 lg:pb-10">
        {/* O primeiro fotograma serve de capa enquanto o vídeo chega, e é o que
            fica a quem pediu menos movimento. */}
        <Image src={b.topo.poster.src} alt="" fill priority fetchPriority="high" sizes="100vw" className="-z-30 object-cover" />
        <video
          className="video-fundo absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={b.topo.poster.src}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={b.topo.video} type="video/mp4" />
        </video>
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/95 via-ink/75 to-ink/50" />
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
          {/* A assinatura da citação: a frase é de Frank Chimero, não da casa. */}
          {/* Com respiro: a última linha da citação tem descendentes («people»),
              e colada a ela a assinatura lia-se como mais uma linha da frase. */}
          <p className="mt-9 text-sm uppercase tracking-[0.12em] text-fg-soft sm:mt-12">
            — <cite className="not-italic">{b.manifesto.autor}</cite>
          </p>
          <div className="mt-12 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
            <p className="subtitle max-w-[48ch]">{b.remate.titulo[locale]}</p>
            {chamada}
          </div>
        </div>
      </header>

      {/* ── O que acreditamos ───────────────────────────────────────────────
          O remate do título do topo, em lilás: a página é tinta de cima a
          baixo, e este é o bloco que tem de se ver. O parágrafo diz como
          trabalhamos; a última frase, no mesmo corpo e a negrito, diz porquê. */}
      <section className="surface-accent-lavender py-20 lg:py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <p className="entra max-w-[60ch] text-lg leading-relaxed">{b.remate.texto[locale]}</p>
          <p className="entra-tarde mt-6 max-w-[60ch] text-lg font-bold leading-relaxed">{b.remate.fecho[locale]}</p>
        </div>
      </section>

      {/* ── As marcas mais recentes ─────────────────────────────────────────
          A cor do cabeçalho segue a marca que está no ecrã: ver ObrasComAcento.
          Cada marca é um link para a página do projeto. */}
      {marcas.length ? (
        <ObrasComAcento className="obras surface-ink">
          <div className="mx-auto max-w-[1200px] px-5 pb-6 pt-24 sm:px-8 lg:pt-28">
            <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
              <div>
                <span className="eyebrow acento-vivo">{b.materia.eyebrow[locale]}</span>
                <h2 className="mt-4 max-w-[22ch] text-chapter">{b.materia.titulo[locale]}</h2>
              </div>
              <span aria-hidden="true" className="acento-vivo-contorno font-display text-[clamp(40px,6vw,88px)] leading-[0.85]">
                {String(marcas.length).padStart(2, "0")}
              </span>
            </div>

            {marcas.map((projeto, i) => {
              const acento = ACENTOS[i % ACENTOS.length];
              return (
                <article
                  key={projeto.slug}
                  data-acento={acento}
                  style={{ "--acento": acento } as React.CSSProperties}
                  className="border-b border-line/60"
                >
                  <Link
                    href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(projeto, locale) } }}
                    className="group grid items-center gap-7 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-16 lg:py-20"
                  >
                    <div className={`entra ${i % 2 ? "md:order-2" : ""}`}>
                      <span aria-hidden="true" className="varre block h-0.5 w-[72px] bg-[var(--acento)]" />
                      {projeto.subtitle ? (
                        <span className="eyebrow mt-6 block text-[var(--acento)]">{projeto.subtitle}</span>
                      ) : null}
                      <h3 className="editorial mt-3 text-[clamp(28px,3.6vw,50px)] leading-[1.02] tracking-[-0.02em]">{projeto.client}</h3>
                      <ul className="mt-6 flex flex-wrap gap-2">
                        {projeto.disciplines.slice(0, 4).map((disciplina) => (
                          <li key={disciplina} className="rounded-full border border-line px-3 py-1.5 text-[11.5px] uppercase tracking-[0.06em] text-fg-soft">
                            {disciplina}
                          </li>
                        ))}
                      </ul>
                      <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--acento)]">
                        {b.materia.ver[locale]}
                        <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </span>
                    </div>
                    <figure className={`entra-tarde relative m-0 aspect-[4/3] overflow-hidden rounded-[6px] ${i % 2 ? "md:order-1" : ""}`}>
                      <Image
                        src={projeto.cover!.src}
                        alt={projeto.cover!.alt || projeto.client}
                        fill
                        sizes="(max-width: 768px) 100vw, 660px"
                        className="scale-[1.02] object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                      />
                      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--acento)]" />
                    </figure>
                  </Link>
                </article>
              );
            })}
          </div>
        </ObrasComAcento>
      ) : null}

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

      {/* ── O fecho, em vermelho a toda a largura ────────────────────────────
          O único vermelho da página, no fim. Aqui não há parágrafo por baixo
          do título — a esta altura quem lê não precisa de mais uma explicação,
          precisa de uma porta. */}
      <section className="surface-red py-20 lg:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-8 px-5 sm:px-8">
          <h2 className="entra-perto max-w-[18ch] font-display text-[clamp(32px,5vw,72px)] leading-[1.0] tracking-[-0.025em]">
            {b.fecho.titulo[locale]}
          </h2>
          {/* Pastilha de tinta sobre o vermelho: a branca desaparecia nele. */}
          <Link href="/contactos" className="btn-pill btn-pill-ink entra-perto">
            {b.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* ── Outras áreas ─────────────────────────────────────────────────── */}
      <section className="surface-ink py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
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
