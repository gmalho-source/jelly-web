import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";
import { getPosts } from "@/lib/cms";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("eyebrow"),
    description: t("lead"),
    alternates: alternates("/blog", locale),
  };
}

export default async function BlogIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("blog");
  const posts = await getPosts();
  const [featured, ...rest] = posts;
  const latest = rest.slice(0, 23);
  const formatter = new Intl.DateTimeFormat(
    locale === "pt" ? "pt-PT" : "en-GB",
    { day: "numeric", month: "short", year: "numeric" },
  );

  return (
    <section className="surface-paper mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="editorial mt-5 text-display">{t("title")}</h1>
        </div>
        <p className="subtitle">{t("lead")}</p>
      </div>

      <Link
        href={{ pathname: "/blog/[slug]", params: { slug: slugFor(featured, locale) } }}
        className="card mt-14 grid gap-6 p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34%)]"
      >
        <div>
          <span className="eyebrow">{featured.category[locale]}</span>
          <h2 className="editorial mt-3 max-w-[24ch] text-chapter">
            {featured.title[locale]}
          </h2>
          <p className="mt-4 max-w-[56ch] text-md text-fg-soft">
            {featured.excerpt[locale]}
          </p>
        </div>
        <div className="flex flex-col justify-end gap-4 text-sm text-fg-soft lg:items-end">
          {featured.cover?.src ? (
            <Image
              src={featured.cover.src}
              alt={featured.cover.alt ?? ""}
              width={800}
              height={600}
              sizes="(max-width: 1024px) 100vw, 34vw"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : null}
          <div className="flex flex-col gap-1 lg:items-end">
            <span>{featured.author.name}</span>
            <span>{formatter.format(new Date(featured.date))}</span>
            <span>
              {featured.readingMinutes} {t("minutes")}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-14 flex items-baseline justify-between gap-4 border-b border-line pb-3">
        <h2 className="eyebrow">{t("latest")}</h2>
        <span className="text-sm tabular-nums text-fg-soft">
          {posts.length} {locale === "pt" ? "artigos" : "articles"}
        </span>
      </div>
      {latest.map((post) => (
        <Link
          key={post.slug}
          href={{ pathname: "/blog/[slug]", params: { slug: slugFor(post, locale) } }}
          className="group grid grid-cols-[68px_minmax(0,1fr)_84px] items-center gap-4 border-b border-line py-5 row-flip hover:pl-3 sm:grid-cols-[104px_minmax(0,1fr)_84px]"
        >
          {/* A miniatura é a mesma imagem do artigo: o índice deixa de ser uma
              lista de títulos e passa a mostrar do que fala cada texto. */}
          {post.cover?.src ? (
            <Image
              src={post.cover.src}
              alt=""
              width={208}
              height={156}
              sizes="104px"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="block aspect-[4/3] w-full bg-slate/15"
            />
          )}
          <div>
            <h3 className="editorial text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
              {post.title[locale]}
            </h3>
            <p className="mt-1 text-sm text-fg-soft">
              {post.category[locale]} · {t("by")} {post.author.name}
            </p>
          </div>
          <span className="self-baseline text-right text-sm tabular-nums text-fg-soft">
            {formatter.format(new Date(post.date))}
            <br />
            {post.readingMinutes} {t("minutes")}
          </span>
        </Link>
      ))}
    </section>
  );
}
