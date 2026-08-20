import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getPosts } from "@/lib/cms";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/blog", locale) };
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const posts = await getPosts();
  const [featured, ...rest] = posts;
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "short", year: "numeric" });

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="mt-5 text-display">{t("title")}</h1>
        </div>
        <p className="text-md text-slate">{t("lead")}</p>
      </div>

      <Link
        href={{ pathname: "/blog/[slug]", params: { slug: featured.slug } }}
        className="card mt-14 grid gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34%)]"
      >
        <div>
          <span className="eyebrow">{featured.category[locale]}</span>
          <h2 className="mt-3 max-w-[24ch] text-chapter">{featured.title[locale]}</h2>
          <p className="mt-4 max-w-[56ch] text-md text-slate">{featured.excerpt[locale]}</p>
        </div>
        <div className="flex flex-col justify-end gap-1 text-sm text-mute lg:items-end">
          <span>{featured.author}</span>
          <span>{formatter.format(new Date(featured.date))}</span>
          <span>
            {featured.readingMinutes} {t("minutes")}
          </span>
        </div>
      </Link>

      <h2 className="eyebrow mt-14 border-b border-ink pb-3">{t("latest")}</h2>
      {rest.map((post) => (
        <Link
          key={post.slug}
          href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
          className="group grid grid-cols-[minmax(0,1fr)_84px] items-baseline gap-4 border-b border-paper-2 py-5 transition-[padding,background] duration-200 ease-out hover:bg-white hover:pl-3"
        >
          <div>
            <h3 className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
              {post.title[locale]}
            </h3>
            <p className="mt-1 text-sm text-mute">
              {post.category[locale]} · {t("by")} {post.author}
            </p>
          </div>
          <span className="text-right text-sm tabular-nums text-mute">
            {formatter.format(new Date(post.date))}
            <br />
            {post.readingMinutes} {t("minutes")}
          </span>
        </Link>
      ))}
    </section>
  );
}
