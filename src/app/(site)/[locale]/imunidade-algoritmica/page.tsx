import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ServiceHero } from "@/components/ServiceHero";
import { alternates, SITE_URL } from "@/lib/seo";
import { getAuthorByName } from "@/lib/cms";
import { imunidade } from "@/content/imunidade";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: imunidade.titulo[locale],
    description: imunidade.descricao[locale],
    alternates: alternates("/imunidade-algoritmica", locale),
    openGraph: {
      type: "article",
      title: imunidade.titulo[locale],
      description: imunidade.descricao[locale],
      images: [{ url: `${SITE_URL}/media/imunidade-cupula-poster.webp` }],
    },
  };
}

/**
 * As cores que marcam as camadas, escritas por inteiro porque o Tailwind lê o
 * código à procura delas.
 *
 * O número é contornado, e a cor do contorno entra por variável e não por uma
 * classe de cor: `type-outline` põe o `color` a transparente, e uma classe
 * `text-red` a seguir ganha-lhe e enche o número. Foi o que aconteceu à
 * primeira — cinco números sólidos onde deviam estar cinco contornos.
 */
const CORES = {
  red: { contorno: "[--outline-color:var(--color-red)]", texto: "text-red", borda: "border-red/40" },
  coral: { contorno: "[--outline-color:var(--color-coral)]", texto: "text-coral", borda: "border-coral/40" },
  lavender: { contorno: "[--outline-color:var(--color-lavender)]", texto: "text-lavender", borda: "border-lavender/40" },
  chartreuse: { contorno: "[--outline-color:var(--color-chartreuse)]", texto: "text-chartreuse", borda: "border-chartreuse/40" },
  paper: { contorno: "[--outline-color:var(--color-paper)]", texto: "text-paper", borda: "border-paper/40" },
} as const;

export default async function ImunidadePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("nav");
  // Quem cunhou o termo tem ficha de autor: a fotografia e a função saem de lá,
  // e mudam no painel sem passar por aqui.
  const autor = await getAuthorByName("Gonçalo Malho Rodrigues");

  /**
   * O que a máquina lê. Numa página cujo tema é ser lida corretamente pelas
   * máquinas, a marcação não é um extra técnico — é o argumento a praticar-se.
   * `DefinedTerm` declara o conceito e quem o cunhou; `FAQPage` entrega as dez
   * perguntas de forma que um motor de respostas as possa citar.
   */
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "DefinedTerm",
      name: imunidade.titulo[locale],
      description: imunidade.definicao.paragrafos[0]![locale],
      inDefinedTermSet: { "@type": "DefinedTermSet", name: "Jelly", url: SITE_URL },
      ...(autor ? { creator: { "@type": "Person", name: autor.name, ...(autor.role ? { jobTitle: autor.role } : {}) } } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: imunidade.faq.map((item) => ({
        "@type": "Question",
        name: item.pergunta[locale],
        acceptedAnswer: { "@type": "Answer", text: item.resposta[locale] },
      })),
    },
  ];

  const paragrafo = (texto: string) => (
    <p key={texto.slice(0, 24)} className="reading mt-6 max-w-[64ch] text-md first:mt-0">
      {texto}
    </p>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <ServiceHero
        eyebrow={imunidade.eyebrow[locale]}
        title={imunidade.titulo[locale]}
        claim={imunidade.claim[locale]}
        video="/media/imunidade-cupula.mp4"
        poster={{ src: "/media/imunidade-cupula-poster.webp" }}
        height="alto"
        cta={
          <Link href="/contactos" className="btn btn-hero">
            {imunidade.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </Link>
        }
      />

      {/* O conceito, e a frase que é a tese. Em papel, medida larga, sem nada a
          competir com ela — é o momento da página. */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="text-chapter max-w-[24ch]">{imunidade.definicao.titulo[locale]}</h2>
          <div className="mt-8 statement-in">
            <div>{imunidade.definicao.paragrafos.map((item) => paragrafo(item[locale]))}</div>
            <hr className="my-12 border-line" />
            <blockquote className="editorial max-w-[34ch] font-display text-[clamp(26px,3.6vw,50px)] leading-[1.08] tracking-[-0.02em] text-ink">
              {imunidade.definicao.tese[locale]}
            </blockquote>
          </div>

          {/* Um conceito cunhado tem autor, e dizê-lo é meio argumento. */}
          {autor ? (
            <div className="mt-14 flex items-start gap-5 border-t border-line pt-8">
              {autor.photo?.src ? (
                <Image
                  src={autor.photo.src}
                  alt={autor.photo.alt ?? autor.name}
                  width={128}
                  height={128}
                  sizes="64px"
                  className="size-16 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <div>
                <span className="eyebrow text-fg-soft">{imunidade.autor.rotulo[locale]}</span>
                <p className="reading mt-2 max-w-[58ch] text-md">
                  <strong className="font-semibold text-ink">{autor.name}</strong>
                  {autor.role ? <span className="text-fg-soft">, {autor.role}, </span> : " "}
                  {imunidade.autor.texto[locale]}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* A tempestade por fora, a calma por dentro. A imagem tem coluna própria e
          não fundo: é vertical, e numa faixa larga o corte deixava de fora a
          pessoa serena e os alertas na janela — ou seja, a metáfora toda.
          Mostrada inteira, faz o trabalho que um diagrama faria pior. */}
      <section className="surface-ink">
        <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,36%)] lg:gap-16 lg:py-28">
          <div>
            <h2 className="text-chapter max-w-[26ch]">{imunidade.contraste.titulo[locale]}</h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              {[imunidade.contraste.velho, imunidade.contraste.novo].map((lado, indice) => (
                <div
                  key={lado.rotulo.pt}
                  className={`border-t pt-6 ${indice === 0 ? "border-line" : "border-red"}`}
                >
                  <span className={`eyebrow ${indice === 0 ? "text-fg-soft" : "text-red"}`}>
                    {lado.rotulo[locale]}
                  </span>
                  <p className="mt-3 text-md text-fg">{lado.texto[locale]}</p>
                </div>
              ))}
            </div>
          </div>

          <Image
            src="/media/imunidade-tempestade.webp"
            alt={
              locale === "pt"
                ? "Alguém a trabalhar com calma num escritório enquanto, do outro lado da janela, ecrãs anunciam alterações de algoritmo e alertas de mercado."
                : "Someone working calmly in an office while, beyond the window, screens announce algorithm changes and market alerts."
            }
            width={941}
            height={1672}
            sizes="(max-width: 1024px) 100vw, 420px"
            className="w-full rounded-[20px] object-cover"
          />
        </div>
      </section>

      {/* Como se constrói: as camadas, com o fio a desenhar-se. */}
      <section className="surface-ink border-t border-line/40">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="text-chapter">{imunidade.comoIntro.titulo[locale]}</h2>
          <p className="subtitle mt-4 max-w-[48ch]">{imunidade.comoIntro.texto[locale]}</p>

          <ol className="relative mt-16 grid gap-14 sm:pl-10">
            {/* O fio, atrás de tudo, tão alto quanto a lista. */}
            <span
              aria-hidden="true"
              className="camada-fio absolute left-0 top-2 hidden h-[calc(100%-1rem)] w-px bg-gradient-to-b from-red via-lavender to-paper/60 sm:block"
            />

            {imunidade.camadas.map((camada) => {
              const cor = CORES[camada.cor];
              return (
                <li key={camada.numero} className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10">
                  <span
                    aria-hidden="true"
                    className={`type-outline font-display text-[clamp(56px,7vw,104px)] leading-[0.8] ${cor.contorno}`}
                  >
                    {camada.numero}
                  </span>

                  <div>
                    <h3 className="editorial text-2xl lg:text-3xl">{camada.nome[locale]}</h3>
                    <p className="mt-4 max-w-[58ch] text-md text-fg-soft">{camada.corpo[locale]}</p>

                    {/* O critério de saída sai do parágrafo e ganha marca
                        própria: é o que separa isto de um manifesto — uma
                        condição que se pode verificar. */}
                    <p className={`mt-6 inline-flex max-w-[52ch] flex-col gap-1 border-l-2 pl-4 ${cor.borda}`}>
                      <span className={`eyebrow ${cor.texto}`}>{imunidade.comoIntro.criterioRotulo[locale]}</span>
                      <span className="text-md text-fg">{camada.criterio[locale]}</span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* As camadas em texto corrido, antes das perguntas: os dois blocos de
          argumento que a página tem e que não caberiam nas camadas. */}
      <section className="surface-paper">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {[imunidade.camadasIntro, imunidade.tecnica].map((bloco) => (
            <div key={bloco.titulo.pt}>
              <h2 className="editorial text-xl lg:text-2xl">{bloco.titulo[locale]}</h2>
              <div className="mt-4">{bloco.paragrafos.map((item) => paragrafo(item[locale]))}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Dez perguntas abertas de uma vez são um muro; fechadas, um convite. */}
      <section className="surface-paper border-t border-line">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="text-chapter">{imunidade.faqTitulo[locale]}</h2>
          <div className="mt-10 border-t border-line">
            {imunidade.faq.map((item) => (
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

      <section className="surface-ink">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-end justify-between gap-8 px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="text-chapter max-w-[26ch]">{imunidade.fecho.titulo[locale]}</h2>
          <Link href="/contactos" className="btn btn-hero">
            {imunidade.fecho.cta[locale]} <span aria-hidden="true">→</span>
          </Link>
          <p className="w-full text-sm text-fg-soft">{t("contact")} · hello@jelly.pt</p>
        </div>
      </section>
    </>
  );
}
