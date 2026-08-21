import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import generatedRedirects from "./src/lib/redirects.generated.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      // Ficheiros do painel, no Blob da Vercel.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Imagens ainda por migrar do site antigo.
      { protocol: "https", hostname: "www.jelly.pt" },
    ],
  },
  // 764 redirecionamentos gerados a partir dos sitemaps do site atual
  // (npm run redirects). Sem isto, a migração perde o histórico de SEO.
  async redirects() {
    return generatedRedirects as { source: string; destination: string; permanent: boolean }[];
  },
  async headers() {
    return [
      {
        // A área de faturação nunca é indexada nem embebida.
        source: "/billing/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default withPayload(withNextIntl(nextConfig));
