import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPost, getPosts, getRelatedPosts } from "@/lib/cms";
import { alternates } from "@/lib/seo";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title[locale],
    description: post.excerpt[locale],
    alternates: alternates({ pathname: "/blog/[slug]", params: { slug } }, locale),
    openGraph: { type: "article", publishedTime: post.date, authors: [post.author] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug);
  if (!post) notFound();

  const t = await getTranslations("blog");
  const related = await getRelatedPosts(slug);
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[locale],
    description: post.excerpt[locale],
    datePublished: post.date,
    author: { "@type": post.author === "Equipa Jelly" ? "Organization" : "Person", name: post.author },
    publisher: { "@type": "Organization", name: "Jelly" },
    inLanguage: locale === "pt" ? "pt-PT" : "en",
  };

  return (
    <article className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="grid gap-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-14">
        {/* Marginália: autor, data, tempo de leitura. */}
        <aside className="flex flex-col gap-1 text-sm text-mute">
          <span className="text-ink">{post.author}</span>
          <span>{formatter.format(new Date(post.date))}</span>
          <span>
            {post.readingMinutes} {t("minutes")}
          </span>
          {post.draft ? (
            <span className="mt-3 w-fit rounded-[12px] bg-chartreuse px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink">
              {t("draft")}
            </span>
          ) : null}
        </aside>

        <div>
          <span className="eyebrow">{post.category[locale]}</span>
          <h1 className="editorial mt-4 max-w-[26ch] text-display">{post.title[locale]}</h1>
          <hr className="mt-8 border-ink" />

          <div className="mt-8 max-w-[64ch]">
            {post.body?.length ? (
              post.body.map((paragraph, index) => (
                <p
                  key={index}
                  className={`text-md leading-[1.72] text-slate ${index === 0 ? "first-letter:float-left first-letter:pr-2 first-letter:font-editorial first-letter:text-[3.1em] first-letter:leading-[0.82] first-letter:text-red" : "mt-5"}`}
                >
                  {paragraph[locale]}
                </p>
              ))
            ) : (
              <p className="text-md leading-[1.72] text-slate">{post.excerpt[locale]}</p>
            )}
          </div>

          <div className="mt-12 grid gap-4 border-t border-paper-3 pt-8 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={{ pathname: "/blog/[slug]", params: { slug: item.slug } }}>
                <span className="eyebrow text-mute">{t("related")}</span>
                <h3 className="editorial mt-2 text-lg hover:text-red">{item.title[locale]}</h3>
              </Link>
            ))}
          </div>

          <Link href="/blog" className="mt-10 inline-block text-sm font-semibold text-red">
            ← {t("back")}
          </Link>
        </div>
      </div>
    </article>
  );
}
