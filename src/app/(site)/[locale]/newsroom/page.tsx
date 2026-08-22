import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getNews } from "@/lib/cms";

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

  const t = await getTranslations("newsroom");
  const items = await getNews();
  const formatter = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-PT" : "en-GB",
    { day: "numeric", month: "short" },
  );
  const year = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    year: "numeric",
  });

  return (
    <section className="surface-paper mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="editorial mt-5 text-display">{t("title")}</h1>
        </div>
        <p className="subtitle">{t("lead")}</p>
      </div>

      {/* Feed cronológico: a data manda, o tipo assinala-se à direita. */}
      <div className="mt-14 border-t border-line">
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
                  pathname: "/blog/[slug]",
                  params: { slug: locale === "en" && item.postSlugEn ? item.postSlugEn : item.postSlug },
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

      <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-8">
        <div>
          <h2 className="text-chapter">{t("press")}</h2>
          <p className="mt-3 max-w-[46ch] text-md text-fg-soft">
            {t("pressBody")}
          </p>
        </div>
        <span className="btn btn-ghost">{t("pressCta")}</span>
      </div>
    </section>
  );
}
