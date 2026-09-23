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
    /*
     * A régua da compressão de saída, e a única que existe: 85.
     *
     * O otimizador entregava a 75, que é o valor de origem do Next. Somado à
     * conversão para WebP que o painel faz à entrada, davam duas compressões
     * com perda em cima da fotografia — e via-se, em gradientes, tecidos e
     * paredes de LED. Medido numa fotografia do palco dos Heróis PME a
     * 1920 px: 112 KB a 75, 141 KB a 85. São 26% a mais, e é barato ao lado de
     * uma cara com blocos.
     *
     * Um valor só na lista e não `[75, 85]`: assim não é preciso escrever
     * `quality` em trinta e seis componentes nem lembrar-se dele no próximo.
     * O Next aproxima qualquer pedido ao valor permitido mais perto, e como só
     * há um, todos os pedidos saem a 85 — inclusive o 75 que o componente pede
     * quando ninguém lhe diz nada.
     */
    qualities: [85],
    // O resultado do otimizador fica em cache um mês: sem isto, o mesmo
    // recorte é recodificado a cada poucas horas.
    minimumCacheTTL: 60 * 60 * 24 * 31,
    remotePatterns: [
      // Ficheiros do painel, no Blob da Vercel.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Imagens ainda por migrar do site antigo.
      { protocol: "https", hostname: "www.jelly.pt" },
      // Miniaturas dos vídeos do YouTube. Passam pelo otimizador de propósito:
      // até ao clique de quem lê, o YouTube não recebe pedido nenhum do browser.
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  // O middleware trata dos endereços antigos, mas o seu matcher não vê caminhos
  // com extensão: os sitemaps do WordPress ficam aqui.
  async redirects() {
    return [
      /*
       * Performance, acessibilidade e migrações foi a quarta página de
       * Tecnologia até a quarta área passar a ser a dos sistemas de IA. O que lá
       * estava vive hoje dentro de websites, e o endereço vai para lá: esteve
       * publicado e indexado, e um 404 aqui perde o que ele já valia.
       */
      { source: "/servicos/tecnologia/performance-acessibilidade-migracoes", destination: "/servicos/tecnologia/websites-ecommerce", permanent: true },
      { source: "/en/services/technology/performance-accessibility-migrations", destination: "/en/services/technology/websites-ecommerce", permanent: true },
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/:sitemap(post|page|portfolio|category|post_tag|recrutamento)-sitemap.xml", destination: "/sitemap.xml", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        /*
         * As imagens das assinaturas de email, que vieram do alojamento
         * anterior nos mesmos endereços que sempre tiveram — há emails
         * enviados há anos a pedi-las, e esses não se reescrevem.
         *
         * Fora do índice: são caras e ícones de uma pasta de serviço, não
         * páginas. E em cache por um dia, com uma semana de tolerância, porque
         * quem as pede são os intermediários de email, muitas vezes, e o
         * ficheiro raramente muda.
         */
        source: "/assinaturas/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex" },
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
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
