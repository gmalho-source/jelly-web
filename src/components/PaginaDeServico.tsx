import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import type { PaginaDeServico as Servico } from "@/content/pagina-de-servico";
import type { Localized } from "@/content/types";
import { SITE_URL } from "@/lib/seo";

/**
 * Um serviço dentro de uma área, em página própria.
 *
 * Marketing e Tecnologia têm cada uma a sua família de páginas, e as famílias
 * partilham o esqueleto: abertura em duas colunas (o problema e a abordagem),
 * o que fazemos, os formatos quando existem, como trabalhamos com o fio a
 * crescer, as perguntas, o fecho em vermelho, e o caminho de volta à página-mãe
 * e aos irmãos da mesma área. Uma família nova é uma rota e um registo; o
 * desenho é este, para as duas se lerem como a mesma casa.
 */

/** As rotas que sabem servir uma destas páginas. Uma família nova entra aqui. */
export type RotaDeServico = "/servicos/marketing/[sub]" | "/servicos/tecnologia/[sub]";

export type Tom = { fio: string; contorno: string };

type Props = {
  locale: Locale;
  servico: Servico;
  rota: RotaDeServico;
  area: { nome: Localized; medida: Localized };
  tom: Tom;
  irmaos: Servico[];
  /** A página-mãe: como se chama, para onde vai, o que diz de si. */
  mae: { nome: string; slug: string; lead: string };
  /** Os textos dos botões, já na língua da página. */
  cta: { topo: string; fecho: string };
};

export async function PaginaDeServico({ locale, servico, rota, area, tom, irmaos, mae, cta }: Props) {
  const nav = await getTranslations("nav");
  const t = await getTranslations("services");
  const hrefMae = { pathname: "/servicos/[slug]" as const, params: { slug: mae.slug } };
  const hrefDe = (sub: string) => ({ pathname: rota, params: { sub } }) as const;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: servico.nome[locale],
      description: servico.descricao[locale],
      serviceType: area.nome[locale],
      provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
      areaServed: "PT",
      url: `${SITE_URL}${getPathname({ href: hrefDe(servico.slug[locale]), locale })}`,
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
      {cta.topo} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Abertura ──────────────────────────────────────────────────────────
          Em tinta por defeito: a maioria destes serviços não tem imagem própria,
          e um fundo repetido em catorze páginas deixava de dizer alguma coisa.
          Quando o serviço traz vídeo, abre em cheio como a página-mãe: vídeo
          como textura, escurecido até o título mandar, e o primeiro fotograma
          de capa. Nos dois casos a área e a sua unidade de medida ficam por cima
          do título, para se saber onde se está no mapa. Acima da dobra, e por
          isso não se anima. */}
      {servico.topo ? (
        <header className="surface-cover relative isolate -mt-6 flex min-h-[100lvh] flex-col justify-end overflow-hidden bg-ink pb-32 pt-[140px] sm:-mt-24 sm:pb-14 lg:pb-16">
          <Image src={servico.topo.poster.src} alt="" fill priority sizes="100vw" className="topo-paralaxe -z-30 object-cover" />
          <video
            className="video-fundo topo-paralaxe absolute inset-0 -z-20 h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={servico.topo.poster.src}
            aria-hidden="true"
            tabIndex={-1}
          >
            {servico.topo.webm ? <source src={servico.topo.webm} type="video/webm" /> : null}
            <source src={servico.topo.video} type="video/mp4" />
          </video>
          <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/97 via-ink/80 to-ink/55" />
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="eyebrow text-red">{mae.nome} · {area.nome[locale]}</span>
              <span className="font-display text-[22px] leading-none text-paper/60 tabular-nums">{area.medida[locale]}</span>
            </div>
            <h1 className="mt-6 max-w-[22ch] font-display text-[clamp(38px,5.6vw,84px)] leading-[0.98] tracking-[-0.03em]">{servico.titulo[locale]}</h1>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
              <p className="subtitle max-w-[52ch]">{servico.claim[locale]}</p>
              {chamada}
            </div>
          </div>
        </header>
      ) : (
        <header className="surface-ink relative -mt-6 flex flex-col justify-end pb-12 pt-[136px] sm:-mt-24 lg:pb-14 lg:pt-[176px]">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
            <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2">
              <span className="eyebrow text-red">{mae.nome} · {area.nome[locale]}</span>
              <span className="font-display text-[22px] leading-none text-paper/60 tabular-nums">{area.medida[locale]}</span>
            </div>
            <h1 className="mt-6 max-w-[22ch] font-display text-[clamp(38px,5.6vw,84px)] leading-[0.98] tracking-[-0.03em]">{servico.titulo[locale]}</h1>
            <div className="mt-10 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
              <p className="subtitle max-w-[52ch]">{servico.claim[locale]}</p>
              {chamada}
            </div>
          </div>
        </header>
      )}

      {/* ── Abertura em papel: o problema e a abordagem ─────────────────────── */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
              { label: t("eyebrow"), href: "/servicos", path: getPathname({ href: "/servicos", locale }) },
              { label: mae.nome, href: hrefMae, path: getPathname({ href: hrefMae, locale }) },
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
            {cta.fecho} <span aria-hidden="true">→</span>
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
            {irmaos.map((s) => (
              <Link
                key={s.slug.pt}
                href={hrefDe(s.slug[locale])}
                className="row-flip group grid items-baseline gap-x-6 gap-y-2 border-b border-line py-6 hover:pl-3 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)_auto]"
              >
                <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{s.nome[locale]}</span>
                <span className="max-w-[52ch] text-sm text-fg-soft">{s.claim[locale]}</span>
                <span className="text-sm font-semibold text-red">→</span>
              </Link>
            ))}
            <Link href={hrefMae} className="row-flip group grid items-baseline gap-x-6 gap-y-2 border-b border-line py-6 hover:pl-3 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)_auto]">
              <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{mae.nome}</span>
              <span className="max-w-[52ch] text-sm text-fg-soft">{mae.lead}</span>
              <span className="text-sm font-semibold text-red">{t("back")} →</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
