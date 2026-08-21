import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // AVIF primeiro, WebP a seguir: o AVIF pesa menos 20 a 30% para a mesma
    // qualidade, e quem não o suporta recebe WebP.
    formats: ["image/avif", "image/webp"],
    // O resultado do otimizador fica em cache um mês: sem isto, o mesmo
    // recorte é recodificado a cada poucas horas.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      // Ficheiros do painel, no Blob da Vercel.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Imagens ainda por migrar do site antigo.
      { protocol: "https", hostname: "www.jelly.pt" },
    ],
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
