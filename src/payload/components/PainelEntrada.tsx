"use client";

import Link from "next/link";

/**
 * A linha que fica debaixo da marca, na página de entrada. Existe para o cartão
 * não abrir com dois campos e mais nada, e para dizer a quem chega aqui por
 * engano que não é aqui que se lê o site.
 */
export function PainelEntrada() {
  return (
    <p
      style={{
        margin: "22px 0 0",
        fontSize: "14px",
        lineHeight: 1.5,
        color: "var(--theme-elevation-500)",
      }}
    >
      Entra com o email da casa para editar o site. Se procuras a área de
      prestadores, é em{" "}
      <Link href="/billing" style={{ color: "var(--jelly-red)", textDecoration: "none", fontWeight: 500 }}>
        /billing
      </Link>
      .
    </p>
  );
}
