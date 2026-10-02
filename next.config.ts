import type { NextConfig } from "next";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * De onde a página pode carregar cada coisa. Ver o comentário em `headers()`.
 * Cada domínio está aqui porque o site o usa: tirar um é partir alguma coisa, e
 * acrescentar um é abrir uma porta — as duas coisas fazem-se de propósito.
 */
const BLOB = "https://vndty5nncbevu59o.public.blob.vercel-storage.com";
const IUBENDA = "https://*.iubenda.com";
// O Tag Manager e o Google Analytics que ele carrega. As tags que se puserem
// dentro do GTM (Meta, LinkedIn, Ads…) trazem domínios seus: aparecem nos
// relatórios de `/api/csp` e acrescentam-se aqui.
const GTM = "https://www.googletagmanager.com";
const GOOGLE_ANALYTICS = "https://*.google-analytics.com https://*.analytics.google.com";
const POLITICA_DE_CONTEUDO = [
  "default-src 'self'",
  // Os do Next e a configuração da Iubenda vêm embutidos na página.
  `script-src 'self' 'unsafe-inline' ${IUBENDA} ${GTM}`,
  `style-src 'self' 'unsafe-inline' ${IUBENDA}`,
  // As imagens do painel vivem no Blob; as miniaturas dos vídeos no YouTube.
  `img-src 'self' data: blob: ${BLOB} https://i.ytimg.com ${IUBENDA} ${GTM} ${GOOGLE_ANALYTICS}`,
  `media-src 'self' blob: ${BLOB}`,
  `font-src 'self' data: ${IUBENDA}`,
  `connect-src 'self' ${IUBENDA} ${GTM} ${GOOGLE_ANALYTICS}`,
  // Os vídeos (só depois do clique), o calendário de marcações e os formulários.
  `frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://calendar.google.com https://forms.monday.com ${IUBENDA} ${GTM}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // O painel mostra o site dentro de si, na pré-visualização: é o mesmo domínio.
  "frame-ancestors 'self'",
  "report-uri /api/csp",
].join("; ");

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
      /*
       * Os vídeos dos casos. Viviam em jelly.pt/video/portefolio/, caíram com
       * o alojamento antigo, e voltam no Blob da Vercel — com os mesmos nomes,
       * de propósito. Assim não se mexe em nenhum dos cinquenta blocos de
       * vídeo do painel, e qualquer outro sítio que aponte para a pasta antiga
       * passa a funcionar também.
       *
       * Temporário e não permanente: um 308 fica guardado no browser de quem
       * passou por aqui, e enquanto estes ficheiros ainda vão ser recomprimidos
       * não quero um destino gravado para sempre em máquinas que não controlo.
       * Passa a permanente quando assentarem.
       */
      {
        source: "/video/portefolio/:ficheiro",
        destination: "https://vndty5nncbevu59o.public.blob.vercel-storage.com/video/portefolio/:ficheiro",
        permanent: false,
      },
      /*
       * A página de envio de faturas do site antigo, onde os prestadores
       * mandavam as faturas. Hoje isso é a área de faturação. O destino é o
       * `/billing` deste mesmo endereço: `jelly.pt/billing` já cai aqui, e
       * apontar para lá era um salto a mais para o mesmo sítio.
       */
      { source: "/envio-de-faturas", destination: "/billing", permanent: true },
      { source: "/en/envio-de-faturas", destination: "/billing", permanent: true },
      /*
       * O serviço com a Informa D&B do site antigo, em inglês. O português já
       * estava no mapa dos endereços antigos (para lead generation B2B); o
       * inglês não, e caía no 404 depois de o middleware traduzir «servicos»
       * para «services». As duas formas vão para o mesmo sítio, num salto só.
       */
      {
        source: "/en/:pasta(servicos|services)/digital-strategy-and-sales-growth-by-informa-db",
        destination: "/en/services/marketing/b2b-lead-generation",
        permanent: true,
      },
      /*
       * Um endereço curto para usar fora do site (campanhas, materiais
       * impressos), a dar ao formulário de contacto. Temporário de propósito:
       * um 308 ficava guardado no browser de quem passou, e um endereço destes
       * pode vir a ter uma página própria. O destino é o `/contactos` deste
       * mesmo endereço — `jelly.pt/contactos` cai aqui de qualquer maneira.
       */
      { source: "/desafio", destination: "/contactos", permanent: false },
      { source: "/sitemap_index.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/wp-sitemap.xml", destination: "/sitemap.xml", permanent: true },
      { source: "/:sitemap(post|page|portfolio|category|post_tag|recrutamento)-sitemap.xml", destination: "/sitemap.xml", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        /*
         * Para todas as respostas. Vem primeiro de propósito: quando duas regras
         * dão o mesmo cabeçalho, ganha a última, e a área de faturação, mais
         * abaixo, tem o seu Referrer-Policy mais apertado.
         *
         * `nosniff`: o browser usa o tipo que o servidor diz, e não o que
         * adivinha pelo conteúdo — um ficheiro servido como imagem não passa a
         * correr como script.
         *
         * `strict-origin-when-cross-origin`: para fora do site segue só
         * «https://www.jelly.pt», nunca o caminho completo da página de onde se
         * saiu; dentro do site segue tudo, que é o que as métricas precisam.
         */
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        /*
         * A Content-Security-Policy, ainda em modo de relatório: o browser diz o
         * que bloquearia, e não bloqueia nada. Os relatórios chegam a
         * `/api/csp` e ficam nos registos da Vercel. Passa a valer de verdade
         * (o mesmo texto, no cabeçalho sem `-Report-Only`) quando ficar uns
         * dias sem avisos.
         *
         * Lista de domínios, e não `nonce`: a forma com `nonce` obrigava cada
         * página a ser gerada a cada visita, em vez de sair da cache, e era a
         * velocidade da homepage que se perdia. Por isso os scripts embutidos
         * na página continuam permitidos (`'unsafe-inline'`) — são os do Next e
         * a configuração da Iubenda. O que a política fecha é o resto: scripts
         * de domínios desconhecidos, plugins, o `<base>` trocado, formulários
         * a enviar para fora, e o site embebido em páginas alheias.
         *
         * Fora o painel: o editor do Payload tem regras próprias e não é a
         * casa que o público visita.
         */
        source: "/((?!admin).*)",
        headers: [{ key: "Content-Security-Policy-Report-Only", value: POLITICA_DE_CONTEUDO }],
      },
      {
        /*
         * As duas pastas que vieram do alojamento anterior nos mesmos
         * endereços que sempre tiveram: as imagens das assinaturas de email, e
         * o arquivo de imagens do site antigo. Há emails enviados há anos a
         * pedi-las, e esses não se reescrevem.
         *
         * Fora do índice: são ficheiros de serviço e um arquivo de 2011, não
         * conteúdo desta casa — nenhuma página daqui lhes toca. E em cache por
         * um dia, com uma semana de tolerância, porque quem as pede são os
         * intermediários de email, muitas vezes, e o ficheiro nunca muda.
         */
        source: "/:arquivo(assinaturas|images)/:path*",
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
