import type { Metadata } from "next";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleTagManager, GoogleTagManagerSemScript } from "@/components/GoogleTagManager";
import { GTMRouteTracker } from "@/components/GTMRouteTracker";
import { MedicoesDaVercel } from "@/components/MedicoesDaVercel";
import { copy, photos, web } from "@/lib/press/content";
import { SITE_URL, isIndexable } from "@/lib/seo";

/**
 * O documento das duas páginas do press kit.
 *
 * Fora da árvore de línguas do site, como as assinaturas e os inquéritos: o
 * press kit tem o seu próprio cabeçalho, com a troca de língua e o PDF, e o
 * menu do site por cima seria um segundo cabeçalho. Do site traz o que conta
 * a quem visita — o consentimento da Iubenda, o GTM e as medições da Vercel —,
 * para os downloads e as visitas aparecerem com os do resto do site.
 */
export function Casca({ lang, children }: { lang: "pt" | "en"; children: React.ReactNode }) {
  return (
    <html lang={copy[lang].htmlLang}>
      <head>
        <link rel="preconnect" href="https://cs.iubenda.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.iubenda.com" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Poppins-ExtraBold-latin.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <CookieConsent locale={lang} />
      </head>
      <body className="surface-paper min-h-screen">
        <GoogleTagManagerSemScript />
        {children}
        <MedicoesDaVercel />
        <GoogleTagManager />
        <GTMRouteTracker />
      </body>
    </html>
  );
}

/** Os metadados de cada língua: título, descrição, endereços e a imagem para as redes. */
export function metadadosDoPressKit(lang: "pt" | "en"): Metadata {
  const t = copy[lang];
  const aqui = `${SITE_URL}${lang === "pt" ? "/press" : "/en/press"}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: t.metaTitle,
    description: t.metaDescription,
    alternates: {
      canonical: aqui,
      languages: { "pt-PT": `${SITE_URL}/press`, en: `${SITE_URL}/en/press`, "x-default": `${SITE_URL}/press` },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: aqui,
      locale: lang === "pt" ? "pt_PT" : "en_GB",
      type: "website",
      images: [{ url: web(photos.event.file), width: photos.event.w, height: photos.event.h }],
    },
    ...(isIndexable ? {} : { robots: { index: false, follow: false } }),
  };
}
