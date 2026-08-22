import Script from "next/script";
import type { Locale } from "@/i18n/routing";

/**
 * Banner de consentimento da Iubenda.
 *
 * A configuração é a que vem do painel deles — ids do site e das políticas,
 * cores, e as legendas nas duas línguas — e não se inventa nada aqui: mudá-la
 * de um lado sem o outro é como se perde o rasto do consentimento.
 *
 * A ordem das quatro etiquetas é o que faz isto funcionar, e é por isso que são
 * etiquetas cruas em vez do `next/script`: a configuração tem de existir antes
 * de o guião a ler, e o bloqueio automático tem de correr antes de qualquer
 * guião de terceiros — é ele que impede um vídeo do YouTube de pôr cookies
 * antes de alguém dizer que sim. Com o `next/script` a ordem entre guiões
 * `beforeInteractive` não é garantida, e aqui não há margem para isso.
 *
 * `reloadOnConsent` recarrega a página quando se decide: é o que garante que o
 * que estava bloqueado passa a correr, em vez de ficar à espera da navegação
 * seguinte.
 */
export function CookieConsent({ locale }: { locale: Locale }) {
  const config = {
    askConsentAtCookiePolicyUpdate: true,
    cookiePolicyInOtherWindow: true,
    countryDetection: true,
    enableLgpd: true,
    enableUspr: true,
    lgpdAppliesGlobally: false,
    perPurposeConsent: true,
    reloadOnConsent: true,
    siteId: 2943535,
    cookiePolicyId: 36055654,
    lang: locale,
    i18n: {
      pt: { banner: { accept_button_caption: "Aceitar todos", reject_button_caption: "Rejeitar todos" } },
      en: { banner: { accept_button_caption: "Accept all", reject_button_caption: "Reject all" } },
    },
    banner: {
      acceptButtonColor: "#29384A",
      acceptButtonDisplay: true,
      backgroundColor: "#FF99A6",
      backgroundOverlay: true,
      brandBackgroundColor: "#DD364A",
      brandTextColor: "#DCDCDC",
      closeButtonDisplay: false,
      customizeButtonColor: "#9E9E9E",
      customizeButtonDisplay: true,
      explicitWithdrawal: true,
      linksColor: "#EB726B",
      listPurposes: true,
      logo: "https://vndty5nncbevu59o.public.blob.vercel-storage.com/Jelly-branco.webp",
      ownerName: "Jelly.pt",
      position: "float-bottom-center",
      rejectButtonDisplay: true,
      showPurposesToggles: true,
      showTotalNumberOfProviders: true,
      textColor: "#000000",
    },
  };

  // Cada língua tem a sua política: o consentimento aponta para o texto que a
  // pessoa consegue ler.
  const porLingua = { pt: { cookiePolicyId: 36055654 }, en: { cookiePolicyId: 25966282 } };

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `var _iub = _iub || [];_iub.csConfiguration = ${JSON.stringify(config)};_iub.csLangConfiguration = ${JSON.stringify(porLingua)};`,
        }}
      />
      {/* Estes dois são bloqueantes de propósito, e o aviso do eslint fica
          silenciado com a razão à vista: o bloqueio automático só intercepta o
          que ainda não correu, e o `stub` tem de definir a função do GPP antes
          de alguém a chamar. Postos em `async` deixavam de servir para nada. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://cs.iubenda.com/autoblocking/2943535.js" />
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script src="https://cdn.iubenda.com/cs/gpp/stub.js" />
      {/* O guião do banner entra depois da hidratação, e não como etiqueta no
          documento, por duas razões. Uma: o React iça os guiões `async` para o
          topo, e o deles ficava antes da configuração que tem de ler. Outra: em
          `defer` ele corre antes de o React hidratar, mete nós no `body`, e o
          React encontra HTML que não é o que desenhou — descartava a árvore e
          voltava a desenhá-la no cliente. Assim a ordem é a certa e ninguém
          pisa os pés a ninguém. */}
      <Script id="iubenda-cs" src="https://cdn.iubenda.com/cs/iubenda_cs.js" strategy="afterInteractive" />
    </>
  );
}
