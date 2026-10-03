import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CoverHeader } from "@/components/CoverHeader";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getDownloads, getNewsroom, getPosts } from "@/lib/cms";
import { BotaoDeDownload } from "@/components/BotaoDeDownload";
import { SubscribeForm } from "@/app/(site)/[locale]/subscrever/SubscribeForm";
import { copyDaSubscricao } from "@/app/(site)/[locale]/subscrever/copy";
import { ROTA_DO_ARTIGO } from "@/lib/seccao";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsroom" });
  return {
    title: t("eyebrow"),
    description: t("lead"),
    alternates: alternates("/newsroom", locale),
  };
}

export default async function NewsroomPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const nav = await getTranslations("nav");
  const t = await getTranslations("newsroom");
  const [items, posts, downloads] = await Promise.all([getNewsroom(), getPosts(), getDownloads()]);
  const tSub = await getTranslations("subscricao");
  const pressKit = downloads.find((ficheiro) => ficheiro.uso === "press-kit");
  const logos = downloads.find((ficheiro) => ficheiro.uso === "logos");
  // «ZIP, 97 MB»: o formato e o peso, para ninguém descobrir os 97 MB depois
  // de carregar num telemóvel.
  const detalhe = (ficheiro: { tipo: string; bytes: number }) =>
    `${ficheiro.tipo.includes("pdf") ? "PDF" : "ZIP"}, ${Math.max(1, Math.round(ficheiro.bytes / 1_000_000))} MB`;

  // A capa do cabeçalho é a do artigo mais recente que a newsroom aponta — a
  // notícia mais nova da casa, e não uma imagem escolhida à parte.
  const capa = items
    .map((item) => posts.find((post) => post.slug === item.postSlug)?.cover)
    .find((cover) => cover?.src);
  const formatter = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-PT" : "en-GB",
    { day: "numeric", month: "short" },
  );
  const year = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    year: "numeric",
  });

  return (
    <>
      <CoverHeader
        image={capa}
        crumbs={[
          {
            label: nav("home"),
            href: "/",
            path: locale === "pt" ? "/" : "/en",
          },
          { label: t("eyebrow") },
        ]}
        title={t("title")}
        lead={t("lead")}
      />

      <section className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          {/* Feed cronológico: a data manda, o tipo assinala-se à direita. */}
          <div className="border-t border-line">
            {items.map((item) => {
              // Uma linha só é clicável quando tem para onde levar: o artigo do
              // blog, se existir, senão o endereço de fora. Sem nenhum dos dois
              // fica texto, que é honesto — melhor do que um clique que não faz nada.
              const linha =
                "grid grid-cols-[78px_minmax(0,1fr)] items-baseline gap-4 border-b border-line py-5 sm:grid-cols-[110px_minmax(0,1fr)_110px] sm:gap-6";
              const conteudo = (
                <>
                  <time
                    dateTime={item.date}
                    className="text-sm font-semibold tabular-nums text-red"
                  >
                    {formatter.format(new Date(item.date))}
                    <span className="block text-xs font-normal text-fg-soft">
                      {year.format(new Date(item.date))}
                    </span>
                  </time>
                  <div>
                    <h2 className="editorial text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
                      {item.title[locale]}
                    </h2>
                    {item.summary ? (
                      <p className="mt-2 max-w-[62ch] text-sm text-fg-soft">
                        {item.summary[locale]}
                      </p>
                    ) : null}
                    {item.outlet ? (
                      <p className="mt-2 text-sm text-fg-soft">{item.outlet}</p>
                    ) : null}
                  </div>
                  <span className="hidden text-right text-xs font-semibold uppercase tracking-[0.08em] text-fg-soft sm:block">
                    {t(`kinds.${item.kind}`)}
                  </span>
                </>
              );

              if (item.postSlug) {
                return (
                  <Link
                    key={item.slug}
                    href={{
                      // O artigo apontado diz onde vive: os do newsroom em
                      // /newsroom/…, e um do blog que uma notícia aponte fica
                      // no blog.
                      pathname: ROTA_DO_ARTIGO[item.postSeccao ?? "blog"],
                      params: {
                        slug:
                          locale === "en" && item.postSlugEn
                            ? item.postSlugEn
                            : item.postSlug,
                      },
                    }}
                    className={`${linha} row-flip group hover:pl-3`}
                  >
                    {conteudo}
                  </Link>
                );
              }

              if (item.link) {
                return (
                  <a
                    key={item.slug}
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className={`${linha} row-flip group hover:pl-3`}
                  >
                    {conteudo}
                  </a>
                );
              }

              return (
                <article key={item.slug} className={linha}>
                  {conteudo}
                </article>
              );
            })}
          </div>

          {/* O press kit, aberto: quem o descarrega é quase sempre um
              jornalista com prazo, e o que lá está já é público. Os
              ficheiros vêm do painel (Downloads); o clique vai para o GTM;
              e ao lado, sem obrigar ninguém, a subscrição dos comunicados. */}
          <div className="mt-12 grid gap-10 border-t border-line pt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
            <div>
              <h2 className="text-chapter">{t("press")}</h2>
              <p className="mt-3 max-w-[46ch] text-md text-fg-soft">
                {t("pressBody")}
              </p>
              {pressKit || logos ? (
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  {pressKit ? (
                    <BotaoDeDownload href={pressKit.url} rotulo={t("pressCta")} detalhe={detalhe(pressKit)} uso="press-kit" bytes={pressKit.bytes} principal />
                  ) : null}
                  {logos ? (
                    <BotaoDeDownload href={logos.url} rotulo={t("pressLogos")} detalhe={detalhe(logos)} uso="logos" bytes={logos.bytes} />
                  ) : null}
                </div>
              ) : (
                <p className="mt-6 text-sm text-fg-soft">{t("pressContact")}</p>
              )}
            </div>
            <div>
              <h3 className="editorial text-lg">{t("pressSubscribe")}</h3>
              <p className="mt-2 text-sm text-fg-soft">{t("pressSubscribeBody")}</p>
              <div className="mt-5">
                <SubscribeForm copy={copyDaSubscricao(tSub)} lingua={locale} origem="newsroom-press-kit" compacto superficie="papel" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
