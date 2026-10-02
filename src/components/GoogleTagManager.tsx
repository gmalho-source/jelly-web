import Script from "next/script";

/** O contentor da Jelly no Google Tag Manager. Muda-se aqui e em mais lado nenhum. */
export const GTM_ID = "GTM-KP755M9";

/**
 * O Google Tag Manager, só nas páginas do site — o painel e a faturação têm
 * os seus layouts e ficam de fora.
 *
 * O consentimento não se decide aqui: a Iubenda está configurada com o Google
 * Consent Mode v2 (`googleConsentModeV2` no painel deles), e o bloqueio
 * automático dela, que corre antes de tudo na cabeça da página, deixa o estado
 * de consentimento recusado à partida e atualiza-o quando a pessoa decide. As
 * tags dentro do contentor obedecem a esse estado. O que se põe no GTM tem de
 * respeitar isso: uma tag configurada para disparar sem olhar ao consentimento
 * passa por cima desta casa toda.
 *
 * `afterInteractive`: entra depois de a página estar desenhada e ativa, e não
 * antes — o GTM e as tags que lhe forem postas são JavaScript que o telemóvel
 * tem de correr, e na cabeça do documento atrasavam o que se vê primeiro. A
 * troca é perder a contagem de quem sai nos primeiros instantes, que é pouco.
 *
 * As mudanças de página fazem-se sem recarregar, por isso as tags de página
 * vista têm de ouvir o histórico do browser (o «History Change» do GTM, ou a
 * medição melhorada do GA4, que o faz por omissão).
 */
export function GoogleTagManager() {
  return (
    <Script
      id="gtm"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`,
      }}
    />
  );
}

/** Para quem navega sem JavaScript: o GTM conta essas visitas por uma moldura. */
export function GoogleTagManagerSemScript() {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
