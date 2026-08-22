import Script from "next/script";

/**
 * A política tal como a Iubenda a mantém, embutida na página.
 *
 * O guião deles substitui esta ligação pelo texto da política. Enquanto não
 * corre — sem javascript, ou se o serviço deles estiver em baixo — o que fica é
 * a ligação: uma página legal tem de ser sempre alcançável, e um bloco vazio
 * seria pior do que um link.
 *
 * O `afterInteractive` é de propósito: a política não é o que se lê primeiro
 * numa página, e carregar isto antes do resto atrasava o que interessa.
 */
export function IubendaPolicy({ href, label }: { href: string; label: string }) {
  return (
    <div className="iub-policy">
      <a
        href={href}
        className="iubenda-white no-brand iubenda-noiframe iubenda-embed iub-no-markup iub-body-embed"
        title={label}
      >
        {label}
      </a>
      <Script id="iubenda-embed" src="https://cdn.iubenda.com/iubenda.js" strategy="afterInteractive" />
    </div>
  );
}
