import type { Metadata } from "next";
import type React from "react";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Odometer } from "@/components/Odometer";
import { ServiceHero } from "@/components/ServiceHero";
import { agentesLeads } from "@/content/agentes-leads";
import { getService } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

const ROTA = "/pre-qualificacao-leads-agentes-ia" as const;
/** O serviço debaixo do qual esta página vive. */
const SERVICO = "inteligencia-artificial";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: agentesLeads.titulo[locale],
    description: agentesLeads.descricao[locale],
    alternates: alternates(ROTA, locale),
    openGraph: {
      type: "article",
      title: agentesLeads.titulo[locale],
      description: agentesLeads.descricao[locale],
      images: [{ url: `${SITE_URL}/media/agentes-topo-poster.webp` }],
    },
  };
}

/**
 * As cores que marcam os verticais.
 *
 * Escritas por inteiro porque o Tailwind lê o código à procura delas: montada
 * com um template, a classe não chega à folha de estilos. E a cor do contorno
 * entra por variável e não por uma classe de cor — `type-outline` põe o `color`
 * a transparente, e uma classe `text-…` a seguir ganhava-lhe e enchia o número.
 */
const CORES = {
  coral: { contorno: "[--outline-color:var(--color-coral)]", texto: "text-coral", borda: "border-coral/40" },
  lavender: { contorno: "[--outline-color:var(--color-lavender)]", texto: "text-lavender", borda: "border-lavender/40" },
  chartreuse: {
    contorno: "[--outline-color:var(--color-chartreuse)]",
    texto: "text-chartreuse",
    borda: "border-chartreuse/40",
  },
} as const;

export default async function PreQualificacaoPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const nav = await getTranslations("nav");
  const t = await getTranslations("services");
  // A migalha liga ao serviço pai, e o slug do serviço muda de língua para
  // língua. Sai do CMS, como na página do próprio serviço.
  const servico = await getService(SERVICO);
  const slugServico = servico ? slugFor(servico, locale) : SERVICO;

  /**
   * O que a máquina lê. Uma página pilar existe para ser encontrada e citada:
   * `FAQPage` entrega as sete perguntas de forma que um motor de respostas as
   * possa citar, e `Article` diz de que é a página e a quem pertence.
   */
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: agentesLeads.titulo[locale],
      description: agentesLeads.descricao[locale],
      image: `${SITE_URL}/media/agentes-topo-poster.webp`,
      inLanguage: locale === "pt" ? "pt-PT" : "en",
      mainEntityOfPage: `${SITE_URL}${getPathname({ href: ROTA, locale })}`,
      publisher: { "@type": "Organization", name: "Jelly", url: SITE_URL },
      about: { "@type": "Thing", name: agentesLeads.eyebrow[locale] },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: agentesLeads.faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta[locale],
        acceptedAnswer: { "@type": "Answer", text: item.resposta[locale] },
      })),
    },
  ];

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {agentesLeads.fecho.cta[locale]} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ServiceHero
        eyebrow={agentesLeads.eyebrow[locale]}
        title={agentesLeads.titulo[locale]}
        claim={agentesLeads.claim[locale]}
        video="/media/agentes-topo.mp4"
        poster={{ src: "/media/agentes-topo-poster.webp" }}
        height="alto"
        cta={chamada}
      />

      {/* A abertura, em papel: o problema de um lado, o rosto do outro. A cena
          das 22h47 sai do parágrafo e ganha marca própria — é o argumento todo
          da página numa frase, e a única coisa nesta secção que não é prosa. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <Breadcrumbs
            items={[
              { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
              { label: t("eyebrow"), href: "/servicos", path: getPathname({ href: "/servicos", locale }) },
              {
                label: servico?.name[locale] ?? agentesLeads.eyebrow[locale],
                href: { pathname: "/servicos/[slug]", params: { slug: slugServico } },
                path: getPathname({
                  href: { pathname: "/servicos/[slug]", params: { slug: slugServico } },
                  locale,
                }),
              },
              { label: agentesLeads.tituloCurto[locale] },
            ]}
          />

          {/* Duas colunas de texto e nenhuma imagem.

              Havia aqui um retrato de banco de imagens — o mesmo que o site
              antigo usa — e não pertencia: um rosto sorridente sem nome não
              ilustra «são 22h47 e ninguém respondeu», e ficava a ocupar um
              terço da largura sem dizer nada. O que abre esta página é o
              argumento, e o argumento tem duas partes: a virada, e a cena que a
              prova. Uma de cada lado, à mesma altura. */}
          <div className="mt-12 grid gap-10 border-t border-line pt-12 lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)] lg:gap-20">
            {/* Sem `entra`: com um topo de 78svh isto pode já estar à vista
                quando a página abre num portátil, e um título a 34% de opacidade
                à chegada não é um efeito, é um defeito. */}
            <h2 className="max-w-[16ch] font-display text-[clamp(30px,4.2vw,60px)] leading-[0.98] tracking-[-0.03em] text-ink">
              {agentesLeads.abertura.titulo[locale]}
            </h2>

            <div>
              <span aria-hidden="true" className="block h-px w-full max-w-[72px] bg-red" />
              <p className="reading mt-6 max-w-[46ch] font-display text-[clamp(20px,2.1vw,29px)] leading-[1.26] text-ink">
                {agentesLeads.abertura.cena[locale]}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Os três números. Entram como um compasso só e não um a um: estão à
          mesma altura, e três linhas do tempo iguais não fazem uma coreografia
          — fazem três coisas a acontecer ao mesmo tempo com mais código. */}
      <section className="surface-ink">
        <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
          {/* Os números rodam até ao seu valor, como um contador mecânico. É o
              `Odometer` da homepage e não um contador novo — a casa já tem este
              gesto, e dois contadores diferentes leem-se como dois sites.

              `--vez` escalona-os da esquerda para a direita: sem isso os três
              param ao mesmo tempo e o efeito lê-se como um piscar. A unidade
              (x, %, h) fica de fora do odómetro: não é um algarismo e não roda.

              Sem `animation-timeline` — o Firefox, hoje — ou a quem pediu menos
              movimento, a fita fica parada no dígito certo. Perde-se a rotação,
              não o número. */}
          <div className="grid gap-10 border-t border-line pt-10 sm:grid-cols-3 sm:gap-8">
            {agentesLeads.numeros.map((numero, indice) => (
              <div
                key={numero.valor}
                className="entra"
                style={{ "--vez": indice } as React.CSSProperties}
              >
                <p className="flex items-baseline gap-1 font-display leading-none tracking-[-0.03em] tabular-nums text-red">
                  <span className="text-[clamp(56px,7vw,104px)]">
                    <Odometer value={numero.valor} />
                  </span>
                  <span className="text-[clamp(24px,3vw,44px)]">{numero.unidade}</span>
                </p>
                <p className="mt-4 max-w-[30ch] text-md text-fg-soft">{numero.texto[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* A definição, e a frase que é a tese. Em papel, medida larga, sem nada a
          competir com ela. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="entra text-chapter max-w-[28ch]">{agentesLeads.definicao.titulo[locale]}</h2>
          <div className="mt-8 statement-in">
            <div>
              {agentesLeads.definicao.paragrafos.map((paragrafo) => (
                <p key={paragrafo.pt.slice(0, 24)} className="reading mt-6 max-w-[64ch] text-md first:mt-0">
                  {paragrafo[locale]}
                </p>
              ))}
            </div>
            <hr className="my-12 border-line" />
            <blockquote className="editorial max-w-[34ch] font-display text-[clamp(24px,3.2vw,44px)] leading-[1.1] tracking-[-0.02em] text-ink">
              {agentesLeads.definicao.tese[locale]}
            </blockquote>
          </div>
        </div>
      </section>

      {/* O que isto faz: quatro promessas de um lado, uma fotografia do outro.
          A fotografia deriva devagar contra o texto, que anda com a página — é
          o único movimento contínuo desta página. A deriva mexe a moldura
          dentro da secção e não a imagem dentro da moldura, e por isso não lhe
          corta nada. */}
      <section className="surface-ink">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34%)] lg:gap-16 lg:py-28">
          <div>
            <h2 className="entra text-chapter max-w-[24ch]">{agentesLeads.beneficios.titulo[locale]}</h2>

            {/* Sem a grelha de fios que as áreas de um serviço usam: aquilo é
                um padrão de papel, e sobre tinta os fios ou desaparecem ou
                fazem uma gaiola. Aqui cada promessa tem o seu fio vermelho a
                desenhar-se, que é marca suficiente, e a coluna respira. */}
            <div className="mt-10 grid gap-10 border-t border-line pt-10 sm:grid-cols-2 sm:gap-x-12">
              {agentesLeads.beneficios.itens.map((item, indice) => (
                <div key={item.nome.pt} className={indice % 2 ? "entra-tarde" : "entra"}>
                  <span aria-hidden="true" className="varre block h-px w-full max-w-[64px] bg-red" />
                  <h3 className="mt-5 max-w-[24ch] text-lg text-fg">{item.nome[locale]}</h3>
                  <p className="mt-2 max-w-[42ch] text-md text-fg-soft">{item.corpo[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="paralaxe">
            <Image
              src={agentesLeads.beneficios.imagem.src}
              alt={agentesLeads.beneficios.imagem.alt[locale]}
              width={1100}
              height={1100}
              sizes="(max-width: 1024px) 100vw, 380px"
              className="w-full rounded-[20px] object-cover"
            />
          </div>
        </div>
      </section>

      {/* Como funciona: os cinco passos, com o fio a desenhar-se enquanto se
          desce. É o mesmo fio da Imunidade Algorítmica e das fases de um
          serviço — o gesto da casa para o que se acumula. `camada-fio-curto`
          porque esta lista tem cinco passos e não quinze: com a janela larga o
          fio chegava ao fim com o terceiro ainda por ler. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <span className="eyebrow text-red">{agentesLeads.passos.eyebrow[locale]}</span>
          <h2 className="mt-4 text-chapter max-w-[26ch]">{agentesLeads.passos.titulo[locale]}</h2>

          <ol className="relative mt-16 grid gap-14 pl-7 sm:pl-10">
            <span
              aria-hidden="true"
              className="camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-red to-lavender"
            />

            {agentesLeads.passos.itens.map((passo, indice) => (
              <li
                key={passo.nome.pt}
                className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10"
              >
                {/* `type-outline` desenha o contorno; `type-outline-ink` só lhe
                    diz a cor. Sozinha, a segunda não faz nada — e os números
                    saíam sólidos, a competir com os títulos ao lado. */}
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

          {/* O que vem depois dos cinco, e a pergunta que fica. Dois blocos, e
              nenhum deles é um passo: por isso saem da lista numerada. */}
          <div className="mt-16 grid gap-8 border-t border-line pt-12 lg:grid-cols-2 lg:gap-14">
            {[agentesLeads.passos.desfecho, agentesLeads.passos.nota].map((bloco, indice) => (
              <div key={bloco.nome.pt} className={indice === 0 ? "entra" : "entra-tarde"}>
                <h3 className="editorial text-xl lg:text-2xl">{bloco.nome[locale]}</h3>
                <p className="reading mt-4 max-w-[58ch] text-md text-fg-soft">{bloco.corpo[locale]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Os verticais. Cada um tem a sua cor, o seu número contornado e a sua
          fotografia, e a fotografia troca de lado a cada linha para a página
          não ficar com uma coluna de imagens. */}
      <section className="surface-paper border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="entra text-chapter max-w-[24ch]">{agentesLeads.verticais.titulo[locale]}</h2>

          <div className="mt-14 flex flex-col gap-16 lg:gap-24">
            {agentesLeads.verticais.itens.map((vertical, indice) => {
              const cor = CORES[vertical.cor];
              const imagemPrimeiro = indice % 2 === 1;
              return (
                <article
                  key={vertical.numero}
                  className="grid items-center gap-8 lg:grid-cols-2 lg:gap-16"
                >
                  <div className={`entra ${imagemPrimeiro ? "lg:order-2" : ""}`}>
                    <span
                      aria-hidden="true"
                      className={`type-outline font-display text-[clamp(48px,6vw,88px)] leading-[0.8] ${cor.contorno}`}
                    >
                      {vertical.numero}
                    </span>
                    <h3 className="editorial mt-5 max-w-[26ch] text-2xl lg:text-3xl">{vertical.titulo[locale]}</h3>
                    <p className={`reading mt-5 max-w-[54ch] border-l-2 pl-5 text-md text-fg-soft ${cor.borda}`}>
                      {vertical.corpo[locale]}
                    </p>
                  </div>

                  <div className={`entra-tarde ${imagemPrimeiro ? "lg:order-1" : ""}`}>
                    <Image
                      src={vertical.imagem.src}
                      alt={vertical.imagem.alt[locale]}
                      width={1400}
                      height={1050}
                      sizes="(max-width: 1024px) 100vw, 560px"
                      className="aspect-[4/3] w-full rounded-[20px] object-cover"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* A chamada. Em vermelho, que é a superfície que esta casa reserva para
          uma pergunta a que se quer resposta. */}
      <section className="surface-red py-16 lg:py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="max-w-[28ch] font-display text-[clamp(26px,3.6vw,52px)] leading-[1.04] tracking-[-0.025em]">
              {agentesLeads.fecho.titulo[locale]}
            </p>
            <p className="mt-4 text-md">{agentesLeads.fecho.texto[locale]}</p>
          </div>
          <Link href="/contactos" className="btn-pill btn-pill-ink shrink-0">
            {agentesLeads.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Sete perguntas abertas de uma vez são um muro; fechadas, um convite.
          A lista entra como um bloco só e não pergunta a pergunta: uma lista
          que cresce quando alguém abre uma linha empurra para baixo o que está
          por baixo, e o progresso de uma linha já assente recua à frente de
          quem acabou de carregar. Medido na Imunidade — ver docs/MOVIMENTO.md. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="entra text-chapter">{agentesLeads.faqTitulo[locale]}</h2>
          <div className="entra mt-10 border-t border-line">
            {agentesLeads.faq.map((item) => (
              <details key={item.pergunta.pt} className="group border-b border-line py-5">
                <summary className="flex cursor-pointer list-none items-baseline gap-4 text-md font-semibold text-ink transition-colors duration-200 group-hover:text-red">
                  <span className="flex-1">{item.pergunta[locale]}</span>
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-red transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="reading mt-4 max-w-[68ch] text-md text-fg-soft">{item.resposta[locale]}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* O caminho de volta. Uma página pilar não está no menu: quem chegou aqui
          por uma pesquisa tem de ter por onde subir. */}
      {servico ? (
        <section className="surface-ink">
          <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-20">
            {/* `entra-perto` e não `entra`: é o último bloco antes do rodapé, e
                uma janela larga medida em `cover` não chegaria a fechar. */}
            <h2 className="entra-perto eyebrow">{t("eyebrow")}</h2>
            {/* Sem `card`: essa é a forma de papel, e sobre tinta desenhava um
                retângulo branco no meio da secção escura. Aqui a ligação é uma
                linha que se acende, como as outras listas desta casa. */}
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
