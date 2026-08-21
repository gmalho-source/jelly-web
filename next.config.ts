import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import generatedRedirects from "./src/lib/redirects.generated.json";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Imagens migradas: servem do site antigo até subirem para o CDN do CMS.
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

export default withNextIntl(nextConfig);
