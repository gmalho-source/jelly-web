/**
 * Poppins vem do Google Fonts; Lora entra como substituta da Jubilat até a
 * licença web estar ativa. Quando estiver, self-hostar as duas famílias e
 * remover este componente.
 */
export function Fonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {/* Regra do App Router: o link vive no <head> do layout, não numa página. */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Poppins:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap"
      />
    </>
  );
}
