import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Inquérito · Jelly",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

// O teclado do telemóvel não pode tapar a pergunta: a página encolhe com ele.
export const viewport: Viewport = { width: "device-width", initialScale: 1, interactiveWidget: "resizes-content" };

/**
 * A página dos inquéritos. Fora do site, como a das assinaturas: sem
 * cabeçalho nem rodapé, sem línguas nem medições. Quem chega aqui veio de um
 * link para responder a umas perguntas, e é só isso que a página faz.
 */
export default function InqueritoLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="surface-paper min-h-screen">{children}</body>
    </html>
  );
}
