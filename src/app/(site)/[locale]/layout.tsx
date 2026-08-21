import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { routing, type Locale } from "@/i18n/routing";
import { SITE_URL, isIndexable } from "@/lib/seo";
import "@/app/globals.css";

const site: Record<Locale, { title: string; description: string }> = {
  pt: {
    title: "Jelly — Agência de marketing digital e inteligência artificial",
    description:
      "Ajudamos empresas a comunicar e a desempenhar melhor, ligando os pontos entre branding, marketing, comunicação e tecnologia.",
  },
  en: {
    title: "Jelly — Digital marketing and artificial intelligence agency",
    description:
      "We help companies communicate and perform better, connecting branding, marketing, communication and technology.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = site[hasLocale(routing.locales, locale) ? locale : routing.defaultLocale];

  return {
    // Uma só leitura do host público, em src/lib/seo.ts.
    metadataBase: new URL(SITE_URL),
    title: { default: copy.title, template: "%s · Jelly" },
    description: copy.description,
    // Em staging o noindex vai também na página, não só no robots.txt.
    ...(isIndexable ? {} : { robots: { index: false, follow: false } }),
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function SiteLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <head>
        <link rel="preload" href="/fonts/BreeSerif-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body>
        <NextIntlClientProvider>
          <SiteHeader locale={locale} />
          <main className="pb-24 pt-6 sm:pb-0 sm:pt-24">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
