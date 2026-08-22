import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleBody } from "@/components/ArticleBody";
import { CoverHeader } from "@/components/CoverHeader";
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
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* A capa é o cenário, não uma ilustração ao lado: ocupa o ecrã, escurece
          por degradê, e o título assenta em cima dela. */}
      <CoverHeader
        image={post.cover}
        crumbs={crumbs}
        title={post.title[locale]}
        meta={
          <>
            <span className="text-fg">{post.author}</span>
            <span>{formatter.format(new Date(post.date))}</span>
            <span>
              {post.readingMinutes} {t("minutes")}
            </span>
          </>
        }
      />

      <div className="surface-paper">
        <div className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          {post.draft && !post.blocks?.length ? (
            <span className="mb-8 inline-block rounded-[12px] bg-chartreuse px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg">
              {t("draft")}
            </span>
          ) : null}

          {/* Corpo em Lora: leitura longa, itálico verdadeiro, capitular na
              mesma família para a coluna ler como um só bloco. */}
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

          <div className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
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
