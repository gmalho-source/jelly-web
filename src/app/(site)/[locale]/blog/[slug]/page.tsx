import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { ArticleBody } from "@/components/ArticleBody";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPost, getPosts, getRelatedPosts } from "@/lib/cms";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

/** Uma árvore por língua: o inglês leva o slug inglês onde ele existe. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const posts = await getPosts();
  return posts.map((post) => ({ slug: slugFor(post, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title[locale],
    description: post.excerpt[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/blog/[slug]" as const, params: { slug: slugFor(post, candidate) } }),
      locale,
    ),
    openGraph: { type: "article", publishedTime: post.date, authors: [post.author] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug);
  if (!post) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308, para não
  // haver duas páginas com o mesmo artigo.
  const canonico = slugFor(post, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/blog/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("blog");
  const nav = await getTranslations("nav");
  const related = await getRelatedPosts(slug);
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  // O corpo segue a língua da página; sem tradução, serve o português — mais
  // vale um artigo em português do que uma página vazia.
  const body = locale === "en" && post.blocksEn?.length ? post.blocksEn : post.blocks;

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

  // O caminho até aqui: casa, índice do blog, e a categoria do artigo. O título
  // não entra — é onde o leitor está, e ocuparia duas linhas.
  const crumbs = [
    { label: nav("home"), href: "/" as const, path: locale === "pt" ? "/" : "/en" },
    { label: nav("blog"), href: "/blog" as const, path: getPathname({ href: "/blog", locale }) },
    { label: post.category[locale] },
  ];

  return (
    <article className="surface-paper mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={crumbs} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-14">
        {/* Marginália: autor, data, tempo de leitura. */}
        <aside className="flex flex-col gap-1 text-sm text-fg-soft">
          <span className="text-fg">{post.author}</span>
          <span>{formatter.format(new Date(post.date))}</span>
          <span>
            {post.readingMinutes} {t("minutes")}
          </span>
          {post.draft && !post.blocks?.length ? (
            <span className="mt-3 w-fit rounded-[12px] bg-chartreuse px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg">
              {t("draft")}
            </span>
          ) : null}
        </aside>

        <div>
          <h1 className="editorial max-w-[26ch] text-display">{post.title[locale]}</h1>
          <hr className="mt-8 border-line" />

          {post.cover?.src ? (
            <Image
              src={post.cover.src}
              alt={post.cover.alt ?? ""}
              width={post.cover.width ?? 1200}
              height={post.cover.height ?? 675}
              priority
              sizes="(max-width: 1200px) 100vw, 1040px"
              className="mt-8 w-full rounded-[20px] object-cover"
            />
          ) : null}

          {/* Corpo em Lora: leitura longa, itálico verdadeiro, capitular na
              mesma família para a coluna ler como um só bloco. */}
          <div className="mt-8">
            {body?.length ? (
              <ArticleBody blocks={body} />
            ) : post.body?.length ? (
              <div className="max-w-[66ch]">
                {post.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`reading ${index === 0 ? "first-letter:float-left first-letter:pr-2 first-letter:font-reading first-letter:text-[3.2em] first-letter:font-semibold first-letter:leading-[0.86] first-letter:text-red" : "mt-6"}`}
                  >
                    {paragraph[locale]}
                  </p>
                ))}
              </div>
            ) : (
              <p className="reading max-w-[66ch]">{post.excerpt[locale]}</p>
            )}
          </div>

          <div className="mt-12 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
            {related.map((item) => (
              <Link key={item.slug} href={{ pathname: "/blog/[slug]", params: { slug: slugFor(item, locale) } }}>
                <span className="eyebrow text-fg-soft">{t("related")}</span>
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
