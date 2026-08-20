import type { Metadata } from "next";
import { Fonts } from "@/components/Fonts";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Área de prestadores · Jelly",
  robots: { index: false, follow: false },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt">
      <head>
        <Fonts />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
