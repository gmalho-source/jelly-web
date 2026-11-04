"use client";

import { useEffect } from "react";

const GUIAO = "https://cdn.iubenda.com/iubenda.js";

/**
 * A política tal como a Iubenda a mantém, embutida na página.
 *
 * O guião deles substitui esta ligação pelo texto da política. Enquanto não
 * corre — sem javascript, ou se o serviço deles estiver em baixo — o que fica é
 * a ligação: uma página legal tem de ser sempre alcançável, e um bloco vazio
 * seria pior do que um link.
 *
 * O guião é posto de novo cada vez que uma política entra no ecrã, e não uma
 * vez por visita. Ele só procura as ligações a substituir quando corre, e o
 * `next/script` corre-o uma vez só: quem passava da Privacidade para os Cookies
 * pelo menu do lado ficava com a ligação em vez do texto, até refrescar a
 * página. Um guião novo a cada entrada é o que a Iubenda espera de uma página
 * que não recarrega. Carrega depois de a página estar desenhada, como antes:
 * a política não é o que se lê primeiro.
 */
export function IubendaPolicy({ href, label }: { href: string; label: string }) {
  useEffect(() => {
    const guiao = document.createElement("script");
    guiao.src = GUIAO;
    guiao.async = true;
    document.body.appendChild(guiao);
    return () => guiao.remove();
  }, [href]);

  return (
    <div className="iub-policy">
      <a
        href={href}
        className="iubenda-white no-brand iubenda-noiframe iubenda-embed iub-no-markup iub-body-embed"
        title={label}
      >
        {label}
      </a>
    </div>
  );
}
