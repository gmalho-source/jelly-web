"use client";

/**
 * A marca no painel: o azulejo vermelho com a assinatura branca, como no site.
 *
 * Duas peças, porque o Payload pede duas: o `Logo` é a marca grande, na página
 * de entrada, e o `Icon` é a pequena, no cabeçalho. São o mesmo desenho em duas
 * medidas — quem entra no painel devia reconhecer de onde veio.
 *
 * A assinatura entra como imagem e não como SVG em linha: é o mesmo ficheiro
 * que o site serve, e um ficheiro só significa que nunca há duas versões da
 * marca a divergir.
 */

export function PainelLogo() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "14px",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: "58px",
          height: "58px",
          borderRadius: "10px",
          background: "#dd364a",
          boxShadow: "0 10px 26px rgba(221, 54, 74, 0.28)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/jelly-wordmark-white.svg" alt="Jelly" width={46} height={20} />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
        <span
          style={{
            fontFamily: '"Bree Serif", Georgia, serif',
            fontSize: "23px",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
          }}
        >
          Bem-vindo à casa.
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            opacity: 0.5,
          }}
        >
          Painel da Jelly
        </span>
      </span>
    </div>
  );
}

export function PainelIcone() {
  return (
    <span
      style={{
        display: "grid",
        placeItems: "center",
        width: "26px",
        height: "26px",
        borderRadius: "6px",
        background: "#dd364a",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/jelly-wordmark-white.svg" alt="Jelly" width={18} height={8} />
    </span>
  );
}
