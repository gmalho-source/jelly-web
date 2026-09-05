import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { marketing } from "@/content/marketing";
import { SERVICOS_DE_MARKETING, irmaos, servicoDeMarketing } from "@/content/marketing-servicos";
import { getService } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * Um serviço de Marketing, em página própria.
 *
 * Dez páginas de uma família, com o mesmo esqueleto: abertura em duas colunas
 * (o problema e a abordagem), o que fazemos, os formatos quando existem, como
 * trabalhamos com o fio a crescer, as perguntas, o fecho em vermelho, e o
 * caminho de volta à página-mãe e aos irmãos da mesma área. O texto vive em
 * `content/marketing-servicos.ts`; uma entrada lá é uma página aqui.
 */
const MAE = "marketing";

const AREAS = Object.fromEntries(marketing.lista.map((area) => [area.chave, area])) as Record<
  (typeof marketing.lista)[number]["chave"],
  (typeof marketing.lista)[number]
>;

const TONS = {
  performance: { fio: "from-red to-red-deep", contorno: "[--outline-color:var(--color-red)]" },
  conteudo: { fio: "from-red to-lavender", contorno: "[--outline-color:var(--color-lavender)]" },
  influencia: { fio: "from-red to-coral", contorno: "[--outline-color:var(--color-coral)]" },
  dados: { fio: "from-red to-chartreuse", contorno: "[--outline-color:var(--color-chartreuse)]" },
} as const;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = (params.locale as Locale) ?? "pt";
  return SERVICOS_DE_MARKETING.map((s) => ({ sub: s.slug[locale] ?? s.slug.pt }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; sub: string }> }): Promise<Metadata> {
  const { locale, sub } = await params;
  const servico = servicoDeMarketing(sub);
  if (!servico) return {};
  return {
    title: servico.nome[locale],
    description: servico.descricao[locale],
    alternates: alternates((candidate) => ({ pathname: "/servicos/marketing/[sub]" as const, params: { sub: servico.slug[candidate] } }), locale),
    openGraph: { type: "website", title: servico.nome[locale], description: servico.descricao[locale], images: [{ url: `${SITE_URL}${marketing.topo.poster.src}` }] },
  };
}

export default async function ServicoDeMarketingPage({ params }: { params: Promise<{ locale: Locale; sub: string }> }) {
  const { locale, sub } = await params;
  setRequestLocale(locale);
  const servico = servicoDeMarketing(sub);
  if (!servico) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  if (servico.slug[locale] !== sub) {
    permanentRedirect(getPathname({ href: { pathname: "/servicos/marketing/[sub]", params: { sub: servico.slug[locale] } }, locale }));
  }

  const nav = await getTranslations("nav");
  const t = await getTranslations("services");
  const mae = await getService(MAE);
  const slugMae = mae ? slugFor(mae, locale) : MAE;
  const area = AREAS[servico.area];
  const tom = TONS[servico.area];
  const outros = irmaos(servico);
  const hrefMae = { pathname: "/servicos/[slug]" as const, params: { slug: slugMae } };

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: servico.nome[locale],
      description: servico.descricao[locale],
      serviceType: area.nome[locale],
      provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
      areaServed: "PT",
      url: `${SITE_URL}${getPathname({ href: { pathname: "/servicos/marketing/[sub]", params: { sub: servico.slug[locale] } }, locale })}`,
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: servico.faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta[locale],
        acceptedAnswer: { "@type": "Answer", text: item.resposta[locale] },
      })),
    },
  ];

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {marketing.cta[locale]} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Abertura em tinta ─────────────────────────────────────────────────
          Sem vídeo: nenhum destes serviços tem imagem própria ainda, e um fundo
          repetido em dez páginas deixava de dizer alguma coisa. A área e a sua
          unidade de medida ficam por cima do título, para se saber onde se
          está no mapa. Acima da dobra, e por isso não se anima. */}
      <header className="surface-ink relative -mt-6 flex flex-col justify-end pb-12 pt-[136px] sm:-mt-24 lg:pb-14 lg:pt-[176px]">
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
            <span className="eyebrow text-red">{mae?.name[locale] ?? "Marketing"} · {area.nome[locale]}</span>
            <span className="font-display text-[22px] leading-none text-paper/60 tabular-nums">{area.medida[locale]}</span>
          </div>
          <h1 className="mt-6 max-w-[22ch] font-display text-[clamp(38px,5.6vw,84px)] leading-[0.98] tracking-[-0.03em]">{servico.titulo[locale]}</h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
            <p className="subtitle max-w-[52ch]">{servico.claim[locale]}</p>
            {chamada}
          </div>
        </div>
      </header>

      {/* ── Abertura em papel: o problema e a abordagem ─────────────────────── */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
              { label: t("eyebrow"), href: "/servicos", path: getPathname({ href: "/servicos", locale }) },
              { label: mae?.name[locale] ?? "Marketing", href: hrefMae, path: getPathname({ href: hrefMae, locale }) },
              { label: servico.nome[locale] },
            ]}
          />
          <h2 className="mt-12 max-w-[24ch] text-chapter">{servico.abertura.titulo[locale]}</h2>
          <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="entra">
              <span aria-hidden="true" className="varre block h-0.5 w-[72px] bg-ink/30" />
              {servico.abertura.problema.map((p) => (
                <p key={p.pt} className="reading mt-5 max-w-[58ch] text-md text-fg-soft">{p[locale]}</p>
              ))}
            </div>
            <div className="entra-tarde">
              <span aria-hidden="true" className="varre block h-0.5 w-[72px] bg-red" />
              {servico.abertura.abordagem.map((p) => (
                <p key={p.pt} className="reading mt-5 max-w-[58ch] text-md">{p[locale]}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── O que fazemos ─────────────────────────────────────────────────────
          A grelha de fios das áreas de um serviço: um padrão de papel, com cada
          célula a repor o fundo. */}
      <section className="surface-paper border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{servico.nome[locale]}</span>
          <h2 className="entra mt-4 max-w-[26ch] text-chapter">{servico.fazemos.titulo[locale]}</h2>
          <div className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {servico.fazemos.itens.map((item, i) => (
              <article key={item.nome.pt} className={`${i % 2 ? "entra-tarde" : "entra"} bg-paper p-6 lg:p-8`}>
                <h3 className="editorial text-xl lg:text-2xl">{item.nome[locale]}</h3>
                <p className="mt-3 max-w-[40ch] text-[15px] text-fg-soft">{item.corpo[locale]}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Os formatos, quando existem ─────────────────────────────────────── */}
      {servico.formatos ? (
        <section className="surface-ink">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
              <h2 className="entra max-w-[22ch] text-chapter">{servico.formatos.titulo[locale]}</h2>
              <p className="entra-tarde max-w-[44ch] text-md text-fg-soft lg:justify-self-end">{servico.formatos.nota[locale]}</p>
            </div>
            <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-12">
              {servico.formatos.itens.map((f, i) => (
                <div key={f.nome.pt} className={`${i % 2 ? "entra-tarde" : "entra"} border-t border-line pt-6`}>
                  <span aria-hidden="true" className={`type-outline font-display text-[clamp(40px,5vw,72px)] leading-[0.8] ${tom.contorno}`}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="editorial mt-4 text-2xl">{f.nome[locale]}</h3>
                  <p className="mt-3 text-[15px] text-fg-soft">{f.ideal[locale]}</p>
                  <ul className="mt-5 flex flex-col gap-2 border-t border-line pt-5 text-[15px]">
                    {f.itens.map((it) => (
                      <li key={it.pt} className="flex gap-3">
                        <span aria-hidden="true" className="mt-[0.7em] block h-px w-4 shrink-0 bg-red" />
                        <span>{it[locale]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* ── Como trabalhamos, com o fio ─────────────────────────────────────── */}
      <section className={servico.formatos ? "surface-paper" : "surface-ink"}>
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{t("phases")}</span>
          <h2 className="mt-4 max-w-[26ch] text-chapter">{servico.passos.titulo[locale]}</h2>
          <ol className="relative mt-14 grid gap-12 pl-7 sm:pl-10">
            <span aria-hidden="true" className={`camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b ${tom.fio}`} />
            {servico.passos.itens.map((passo, i) => (
              <li key={passo.nome.pt} className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10">
                <span aria-hidden="true" className={`type-outline font-display text-[clamp(48px,6vw,88px)] leading-[0.8] ${servico.formatos ? "type-outline-ink" : tom.contorno}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="editorial text-2xl lg:text-3xl">{passo.nome[locale]}</h3>
                  <p className="mt-3 max-w-[58ch] text-md text-fg-soft">{passo.corpo[locale]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Fecho em vermelho ───────────────────────────────────────────────── */}
      <section className="surface-red py-16 lg:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="max-w-[28ch] font-display text-[clamp(26px,3.6vw,52px)] leading-[1.04] tracking-[-0.025em]">{servico.fecho.titulo[locale]}</p>
            <p className="mt-4 max-w-[52ch] text-md">{servico.fecho.texto[locale]}</p>
          </div>
          <Link href="/contactos" className="btn-pill btn-pill-ink shrink-0">
            {marketing.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* ── Perguntas ───────────────────────────────────────────────────────── */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="entra text-chapter">{t("faq")}</h2>
          <div className="entra mt-10 border-t border-line">
            {servico.faq.map((item) => (
              <details key={item.pergunta.pt} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 text-md font-semibold text-ink transition-colors duration-200 group-hover:text-red">
                  <span className="flex-1">{item.pergunta[locale]}</span>
                  <span aria-hidden="true" className="shrink-0 text-red transition-transform duration-200 group-open:rotate-45">+</span>
                </summary>
                <p className="reading mt-4 max-w-[68ch] text-md text-fg-soft">{item.resposta[locale]}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── A área, e o caminho de volta ────────────────────────────────────── */}
      <section className="surface-ink">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
          <h2 className="entra-perto eyebrow">{area.nome[locale]}</h2>
          <div className="entra-perto mt-5 border-t border-line">
            {outros.map((s) => (
              <Link
                key={s.slug.pt}
                href={{ pathname: "/servicos/marketing/[sub]", params: { sub: s.slug[locale] } }}
                className="row-flip group grid items-baseline gap-x-6 gap-y-2 border-b border-line py-6 hover:pl-3 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)_auto]"
              >
                <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{s.nome[locale]}</span>
                <span className="max-w-[52ch] text-sm text-fg-soft">{s.claim[locale]}</span>
                <span className="text-sm font-semibold text-red">→</span>
              </Link>
            ))}
            <Link href={hrefMae} className="row-flip group grid items-baseline gap-x-6 gap-y-2 border-b border-line py-6 hover:pl-3 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)_auto]">
              <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{mae?.name[locale] ?? "Marketing"}</span>
              <span className="max-w-[52ch] text-sm text-fg-soft">{marketing.lead[locale]}</span>
              <span className="text-sm font-semibold text-red">{t("back")} →</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

