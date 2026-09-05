import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Área de prestadores · Jelly",
  robots: { index: false, follow: false },
};

/**
 * A área de prestadores é uma página clara. O documento é escuro por omissão
 * (ver `body` em globals.css), mas o que aqui se vê é o formulário do Monday,
 * que vem sobre um cinzento claro seu — #f6f7f8 — que não se muda. A página
 * toma essa cor, para o formulário não ficar recortado num fundo alheio.
 */
export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="surface-paper min-h-screen" style={{ background: "#f6f7f8" }}>
        {children}
      </body>
    </html>
  );
}
