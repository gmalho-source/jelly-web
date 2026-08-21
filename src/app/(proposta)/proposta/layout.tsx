import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Jelly — proposta visual",
  robots: { index: false, follow: false },
};

/** Raiz própria: a proposta não usa o cabeçalho nem o rodapé do site. */
export default function PropostaLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <link rel="preload" href="/fonts/BreeSerif-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/Poppins-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className="bg-ink text-paper">{children}</body>
    </html>
  );
}
