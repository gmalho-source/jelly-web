import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Assinatura digital · Jelly",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

/**
 * A página onde se assina. Fora do site: sem cabeçalho nem rodapé, sem línguas
 * nem medições — quem chega aqui veio de um email para fazer uma coisa só, e a
 * ligação que traz é pessoal.
 */
export default function AssinarLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="surface-paper min-h-screen">{children}</body>
    </html>
  );
}
