import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Grelha } from "@/components/Grelha";
import { ServiceHero } from "@/components/ServiceHero";
import { jellycare } from "@/content/jellycare";
import { FormularioJellyCare } from "./FormularioJellyCare";
import { campanhaDe, emEuros } from "@/lib/campanha";
import { getCarePlans, getService } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

const ROTA = "/jellycare" as const;
/** A área debaixo da qual esta página vive. */
const SERVICO = "tecnologia";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: `JellyCARE — ${jellycare.titulo[locale]}`,
    description: jellycare.descricao[locale],
    alternates: alternates(ROTA, locale),
    openGraph: {
      type: "website",
      title: `JellyCARE — ${jellycare.titulo[locale]}`,
      description: jellycare.descricao[locale],
      images: [{ url: `${SITE_URL}${jellycare.imagem.src}` }],
    },
  };
}

export default async function JellyCarePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const nav = await getTranslations("nav");
  const t = await getTranslations("services");
  // A migalha sobe até à área, e o slug da área muda de língua para língua.
  const [servico, planos] = await Promise.all([getService(SERVICO), getCarePlans()]);
  const slugServico = servico ? slugFor(servico, locale) : SERVICO;

  const campos = jellycare.formulario.campos;

  // A campanha escreve-se num sítio só, e daqui vai para o cartão e para os
  // emails da subscrição: ver `lib/campanha.ts`.
  const promo = (plano: (typeof planos)[number]) => campanhaDe(plano, locale);

  /*
   * O que a máquina lê. Um plano com preço é uma oferta, e é assim que se
   * escreve: `Service` com dois `Offer`, cada um com o seu preço mensal e a
   * nota de que o IVA não está incluído. Sem isto, dois números grandes numa
   * página são dois números grandes numa página.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "JellyCARE",
    serviceType: jellycare.titulo[locale],
    description: jellycare.descricao[locale],
    provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
    areaServed: "PT",
    url: `${SITE_URL}${getPathname({ href: ROTA, locale })}`,
    offers: planos.map((plano) => ({
      "@type": "Offer",
      name: plano.name,
      price: plano.price,
      priceCurrency: "EUR",
      valueAddedTaxIncluded: false,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: plano.price,
        priceCurrency: "EUR",
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    })),
  };

  // As duas chamadas da página levam ao formulário e não a contactos: o que se
  // pede aqui é uma subscrição com um plano, e isso pergunta-se aqui mesmo.
  const chamada = (
    <a href="#subscrever" className="btn-pill">
      {jellycare.fecho.cta[locale]} <span aria-hidden="true">→</span>
    </a>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* O topo é uma fotografia e não um vídeo: é a mesma do site antigo, e o
          que ela mostra é o assunto da página — alguém que não tem de se
          preocupar com o site. */}
      <ServiceHero
        eyebrow={jellycare.eyebrow[locale]}
        title={jellycare.titulo[locale]}
        claim={jellycare.claim[locale]}
        poster={{ src: jellycare.imagem.src, alt: jellycare.imagem.alt[locale] }}
        height="alto"
        cta={chamada}
      />

      {/* A abertura, em papel: a frase de um lado, o que ela quer dizer do
          outro. Sem imagem — a fotografia já foi o topo. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
              { label: t("eyebrow"), href: "/servicos", path: getPathname({ href: "/servicos", locale }) },
              {
                label: servico?.name[locale] ?? "Tecnologia",
                href: { pathname: "/servicos/[slug]", params: { slug: slugServico } },
                path: getPathname({
                  href: { pathname: "/servicos/[slug]", params: { slug: slugServico } },
                  locale,
                }),
              },
              { label: jellycare.tituloCurto[locale] },
            ]}
          />

          <div className="mt-12 grid gap-10 border-t border-line pt-12 lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:gap-20">
            <h2 className="max-w-[16ch] font-display text-[clamp(30px,4.2vw,60px)] leading-[0.98] tracking-[-0.03em] text-ink">
              {jellycare.abertura.titulo[locale]}
            </h2>
            <div>
              <span aria-hidden="true" className="block h-px w-full max-w-[72px] bg-red" />
              <p className="reading mt-6 max-w-[52ch] text-md text-fg-soft">{jellycare.abertura.texto[locale]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Os nove serviços, na grelha de fios que se desenham. Nove células em
          três colunas: três linhas cheias, sem buracos no fim. */}
      <section className="surface-paper border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{jellycare.servicos.eyebrow[locale]}</span>
          <h2 className="entra mt-4 max-w-[26ch] text-chapter">{jellycare.servicos.titulo[locale]}</h2>
          <Grelha
            className="mt-12"
            colunas={3}
            celulas={jellycare.servicos.itens.map((item) => ({
              chave: item.nome.pt,
              titulo: item.nome[locale],
              corpo: item.corpo[locale],
            }))}
          />
        </div>
      </section>

      {/* Os dois planos. Em tinta, que é onde esta casa põe o que se decide:
          dois cartões lado a lado, o segundo com selo. */}
      <section className="surface-ink">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{jellycare.planos.eyebrow[locale]}</span>
          <h2 className="entra mt-4 max-w-[24ch] text-chapter">{jellycare.planos.titulo[locale]}</h2>

          {/* A grelha acompanha o número de planos: dois ficam lado a lado,
              três passam a três colunas. O painel pode acrescentar um sem que
              a página fique com um cartão órfão a ocupar meia largura. */}
          <div
            className={`mt-12 grid gap-6 border-t border-line pt-12 lg:gap-8 ${
              planos.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
            }`}
          >
            {planos.map((plano, indice) => {
              const campanha = promo(plano);
              const destaque = Boolean(plano.badge?.[locale]);
              return (
                <article
                  key={plano.key}
                  className={`relative flex flex-col rounded-[6px] border p-8 lg:p-10 ${
                    indice % 2 ? "entra-tarde" : "entra"
                  } ${destaque ? "border-red" : "border-line"}`}
                >
                  {plano.badge?.[locale] ? (
                    <span className="absolute -top-3 left-8 rounded-full bg-red px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-paper">
                      {plano.badge[locale]}
                    </span>
                  ) : null}

                  <h3 className="font-display text-2xl">{plano.name}</h3>
                  {/* O preço em letra de cartaz, com a moeda e o período em
                      corpo pequeno: o que se lê primeiro é o número. */}
                  <p className="mt-5 flex items-baseline gap-2 font-display leading-none tracking-[-0.03em] tabular-nums text-red">
                    <span className="text-[clamp(48px,6vw,84px)]">{plano.price}</span>
                    <span className="text-[clamp(20px,2.4vw,32px)]">€</span>
                    <span className="text-sm font-normal text-fg-soft">/ {jellycare.planos.periodo[locale]}</span>
                  </p>

                  {/* A campanha, quando há: uma linha coral por baixo do preço.
                      Coral e não vermelho — o preço já é vermelho, e duas
                      coisas da mesma cor uma debaixo da outra leem-se como uma
                      só. */}
                  {campanha ? (
                    <p className="mt-3 flex flex-wrap items-baseline gap-x-2 text-sm text-coral">
                      <span className="font-semibold">{campanha.frase}</span>
                      {plano.campaign?.firstPrice !== undefined ? (
                        <span className="text-fg-soft line-through">{campanha.normal}</span>
                      ) : null}
                    </p>
                  ) : null}

                  <ul className="mt-8 flex flex-col gap-3 border-t border-line pt-8 text-md text-fg-soft">
                    {plano.features.map((item) => (
                      <li key={item.pt} className="flex items-baseline gap-3">
                        <span aria-hidden="true" className="mt-[2px] block h-px w-4 shrink-0 bg-red" />
                        <span>{item[locale]}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Leva ao formulário logo abaixo, com este plano já
                      escolhido: um botão que salta para o sítio onde se
                      subscreve é melhor do que um que muda de página. */}
                  <a
                    href={`#subscrever-${plano.key}`}
                    className={`btn-pill mt-auto self-start pt-3 ${destaque ? "bg-red text-paper hover:bg-red-deep" : ""}`}
                  >
                    {jellycare.planos.cta[locale]} <span aria-hidden="true">→</span>
                  </a>
                </article>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-fg-soft">{jellycare.planos.nota[locale]}</p>

          {/* Os addons, debaixo dos planos: é aí que a pergunta «e isto está
              incluído?» aparece. */}
          <div className="mt-16 border-t border-line pt-12">
            <h3 className="entra-perto eyebrow">{jellycare.addons.titulo[locale]}</h3>
            <div className="mt-6 grid gap-8 sm:grid-cols-2 sm:gap-12">
              {jellycare.addons.itens.map((item, indice) => (
                <div key={item.nome.pt} className={indice % 2 ? "entra-tarde" : "entra"}>
                  <span aria-hidden="true" className="varre block h-px w-full max-w-[64px] bg-red" />
                  <h4 className="mt-5 text-lg text-fg">{item.nome[locale]}</h4>
                  <p className="mt-2 max-w-[42ch] text-md text-fg-soft">{item.corpo[locale]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* O formulário. Em papel e a seguir aos planos: escolhe-se ali em cima,
          preenche-se aqui, e o botão de cada cartão salta para o rótulo do
          plano certo. Duas colunas no desktop — o texto de um lado, os campos
          do outro — para o formulário não ficar com a largura de um artigo. */}
      <section id="subscrever" className="surface-paper scroll-mt-24 border-t border-line">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,38%)_minmax(0,1fr)] lg:gap-20 lg:py-24">
          <div>
            <span className="eyebrow text-red">{jellycare.formulario.eyebrow[locale]}</span>
            <h2 className="mt-4 max-w-[16ch] font-display text-[clamp(28px,3.6vw,52px)] leading-[1.02] tracking-[-0.025em] text-ink">
              {jellycare.formulario.titulo[locale]}
            </h2>
            <p className="reading mt-5 max-w-[44ch] text-md text-fg-soft">{jellycare.formulario.texto[locale]}</p>
          </div>

          <FormularioJellyCare
            planos={planos.map((plano) => ({
              key: plano.key,
              name: plano.name,
              preco: `${emEuros(plano.price, locale)} / ${jellycare.planos.periodo[locale]}`,
              ...(promo(plano) ? { promo: promo(plano)!.frase } : {}),
            }))}
            privacidadeHref={getPathname({
              href: { pathname: "/legal/[slug]", params: { slug: "politica-de-privacidade" } },
              locale,
            })}
            copy={{
              plano: campos.plano[locale],
              site: campos.site[locale],
              siteHint: campos.siteHint[locale],
              infetado: campos.infetado[locale],
              name: campos.name[locale],
              company: campos.company[locale],
              email: campos.email[locale],
              phone: campos.phone[locale],
              phoneHint: campos.phoneHint[locale],
              notas: campos.notas[locale],
              notasHint: campos.notasHint[locale],
              consent: campos.consent[locale],
              privacidade: campos.privacidade[locale],
              submit: campos.submit[locale],
              sending: campos.sending[locale],
              sent: campos.sent[locale],
              sentBody: campos.sentBody[locale],
              error: campos.error[locale],
              erros: {
                name: campos.erros.name[locale],
                email: campos.erros.email[locale],
                emailInvalid: campos.erros.emailInvalid[locale],
                phone: campos.erros.phone[locale],
                phoneShort: campos.erros.phoneShort[locale],
                site: campos.erros.site[locale],
                consent: campos.erros.consent[locale],
              },
            }}
          />
        </div>
      </section>

      {/* Como começar: três passos, com os números contornados e o fio a
          desenhar-se. É o gesto que a casa usa para o que se acumula. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{jellycare.comecar.eyebrow[locale]}</span>
          <h2 className="mt-4 max-w-[26ch] text-chapter">{jellycare.comecar.titulo[locale]}</h2>

          <ol className="relative mt-16 grid gap-14 pl-7 sm:pl-10">
            <span
              aria-hidden="true"
              className="camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-red to-chartreuse"
            />
            {jellycare.comecar.itens.map((passo, indice) => (
              <li
                key={passo.nome.pt}
                className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10"
              >
                <span
                  aria-hidden="true"
                  className="type-outline type-outline-ink font-display text-[clamp(48px,6vw,88px)] leading-[0.8]"
                >
                  {String(indice + 1).padStart(2, "0")}
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

      {/* A chamada, em vermelho. */}
      <section className="surface-red py-16 lg:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="max-w-[28ch] font-display text-[clamp(26px,3.6vw,52px)] leading-[1.04] tracking-[-0.025em]">
              {jellycare.fecho.titulo[locale]}
            </p>
            <p className="mt-4 max-w-[54ch] text-md">{jellycare.fecho.texto[locale]}</p>
          </div>
          <a href="#subscrever" className="btn-pill btn-pill-ink shrink-0">
            {jellycare.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      {/* O caminho de volta. Esta página não está no menu: quem chegou por uma
          pesquisa tem de ter por onde subir. */}
      {servico ? (
        <section className="surface-ink">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
            <h2 className="entra-perto eyebrow">{t("eyebrow")}</h2>
            <Link
              href={{ pathname: "/servicos/[slug]", params: { slug: slugServico } }}
              className="entra-perto row-flip group mt-5 grid items-baseline gap-x-6 gap-y-2 border-t border-line py-6 hover:pl-3 sm:grid-cols-[minmax(0,22ch)_minmax(0,1fr)_auto]"
            >
              <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
                {servico.name[locale]}
              </span>
              <span className="max-w-[52ch] text-sm text-fg-soft">{servico.claim[locale]}</span>
              <span className="text-sm font-semibold text-red">{servico.link[locale]} →</span>
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
