import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArticleBody } from "@/components/ArticleBody";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLegalPage, legalPages } from "@/content/legal";
import { Link, getPathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";

type Params = { locale: Locale; slug: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => legalPages.map((page) => ({ locale, slug: page.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const page = getLegalPage(slug);
  if (!page) return {};
  return {
    title: page.title[locale],
    description: page.lead[locale],
    alternates: alternates({ pathname: "/legal/[slug]", params: { slug } }, locale),
  };
}

export default async function LegalPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const page = getLegalPage(slug);
  if (!page) notFound();

  const nav = await getTranslations("nav");
  const t = await getTranslations("legal");
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <article className="surface-paper mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
      <Breadcrumbs
        items={[
          { label: nav("home"), href: "/", path: locale === "pt" ? "/" : "/en" },
          { label: page.title[locale] },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-14">
        {/* A data da última revisão e as outras páginas legais, à mão. */}
        <aside className="flex flex-col gap-4 text-sm text-fg-soft">
          <span>
            {t("updated")}
            <br />
            <span className="text-fg">{formatter.format(new Date(page.updated))}</span>
          </span>
          <nav className="flex flex-col gap-1 border-t border-line pt-4">
            {legalPages.map((other) =>
              other.slug === page.slug ? (
                <span key={other.slug} className="text-fg">
                  {other.title[locale]}
                </span>
              ) : (
                <Link
                  key={other.slug}
                  href={{ pathname: "/legal/[slug]", params: { slug: other.slug } }}
                  className="transition-colors duration-200 hover:text-fg"
                >
                  {other.title[locale]}
                </Link>
              ),
            )}
          </nav>
        </aside>

        <div>
          <h1 className="editorial max-w-[24ch] text-display">{page.title[locale]}</h1>
          <p className="subtitle mt-4 max-w-[58ch]">{page.lead[locale]}</p>
          <hr className="mt-8 border-line" />
          <div className="mt-8">
            <ArticleBody blocks={page.blocks[locale]} />
          </div>
          <p className="mt-12 border-t border-line pt-6 text-sm text-fg-soft">
            {t("questions")}{" "}
            <a href="mailto:geral@jelly.pt" className="text-red underline decoration-1 underline-offset-2 hover:no-underline">
              geral@jelly.pt
            </a>
            .
          </p>
        </div>
      </div>
    </article>
  );
}
