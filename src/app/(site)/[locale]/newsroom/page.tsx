import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getNews } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "newsroom" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/newsroom", locale) };
}

export default async function NewsroomPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("newsroom");
  const items = await getNews();
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short" });
  const year = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { year: "numeric" });

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="mt-5 text-display">{t("title")}</h1>
        </div>
        <p className="text-md text-slate">{t("lead")}</p>
      </div>

      {/* Feed cronológico: a data manda, o tipo assinala-se à direita. */}
      <div className="mt-14 border-t border-ink">
        {items.map((item) => (
          <article
            key={item.slug}
            className="grid grid-cols-[78px_minmax(0,1fr)] items-baseline gap-4 border-b border-paper-2 py-5 sm:grid-cols-[110px_minmax(0,1fr)_110px] sm:gap-6"
          >
            <time dateTime={item.date} className="text-sm font-semibold tabular-nums text-red">
              {formatter.format(new Date(item.date))}
              <span className="block text-xs font-normal text-mute">{year.format(new Date(item.date))}</span>
            </time>
            <div>
              <h2 className="font-display text-xl lg:text-2xl">{item.title[locale]}</h2>
              {item.summary ? <p className="mt-2 max-w-[62ch] text-sm text-slate">{item.summary[locale]}</p> : null}
              {item.outlet ? <p className="mt-2 text-sm text-mute">{item.outlet}</p> : null}
            </div>
            <span className="hidden text-right text-xs font-semibold uppercase tracking-[0.08em] text-mute sm:block">
              {t(`kinds.${item.kind}`)}
            </span>
          </article>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-t border-ink pt-8">
        <div>
          <h2 className="text-chapter">{t("press")}</h2>
          <p className="mt-3 max-w-[46ch] text-md text-slate">{t("pressBody")}</p>
        </div>
        <span className="btn btn-ghost">{t("pressCta")}</span>
      </div>
    </section>
  );
}
