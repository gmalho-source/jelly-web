import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleTagManager, GoogleTagManagerSemScript } from "@/components/GoogleTagManager";
import { GTMRouteTracker } from "@/components/GTMRouteTracker";
import { MedicoesDaVercel } from "@/components/MedicoesDaVercel";
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
        {/* Ligação adiantada aos três domínios de fora que a primeira dobra usa.
            Numa ligação de telemóvel, cada domínio novo paga DNS, ligação e TLS
            antes de pedir o primeiro byte — são centenas de milissegundos que
            não aparecem em lado nenhum a não ser no relógio. Os dois da Iubenda
            são guiões que bloqueiam o desenho da página, e o terceiro serve
            todas as fotografias.

            O Lighthouse mediu 1830ms nos dois guiões da Iubenda. Isto não os
            torna mais pequenos; tira-lhes a espera de arranque. */}
        <link rel="preconnect" href="https://cs.iubenda.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.iubenda.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://vndty5nncbevu59o.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/BreeSerif-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        {/* Depois das letras, que são pedidos, e antes de tudo o que executa. */}
        <CookieConsent locale={locale} />
      </head>
      <body>
        <GoogleTagManagerSemScript />
        {/* Sem mensagens: nenhum componente do browser traduz nada — as páginas
            são traduzidas no servidor e chegam já escritas. O provider fica pela
            língua, que os links precisam. Com as mensagens, iam as traduções do
            site inteiro dentro de cada página, 20 KB que o telemóvel lia antes
            de a mostrar. Um componente do browser que um dia precise delas
            passa-as ele, só as do seu nome, com `pick` no servidor. */}
        <NextIntlClientProvider messages={null}>
          <SiteHeader locale={locale} />
          {/* O logo está fixo no topo e tem 88px em qualquer ecrã. No telemóvel a
              margem de cima era 24px, e o texto de quase todas as páginas
              começava colado a ele — ou por baixo dele, onde a página tinha
              menos respiro próprio. Com 48px, o primeiro texto fica sempre a
              pelo menos ~24px do logo. */}
          <main className="pb-24 pt-12 sm:pb-0 sm:pt-24">{children}</main>
          <SiteFooter />
        </NextIntlClientProvider>
        {/* As medições da Vercel: a velocidade que os visitantes sentem, e a
            contagem de visitas e páginas — esta presa ao consentimento, como se
            explica lá dentro. Ficam só no site: o painel e a área de faturação
            têm cada um o seu layout de raiz e ficam de fora, que é onde não há
            visitantes para contar e há endereços que não têm de sair daqui. */}
        <MedicoesDaVercel />
        {/* O Google Tag Manager, com o consentimento entregue à Iubenda (ver o
            componente). */}
        <GoogleTagManager />
        {/* E as páginas seguintes, que o GTM sozinho não vê. */}
        <GTMRouteTracker />
      </body>
    </html>
  );
}
