"use client";

import { pushEvent } from "@/lib/gtm";

/**
 * Um ficheiro para descarregar, com o tamanho à vista e o clique medido.
 *
 * O tamanho vai no botão porque um press kit de 97 MB num telemóvel em rede
 * móvel não é para se descobrir depois de carregar. O clique vai para o GTM
 * como `press_kit_download`, com o ficheiro e o peso: é assim que se sabe
 * quantos o descarregam, sem pedir nada a ninguém.
 */
export function BotaoDeDownload({
  href,
  rotulo,
  detalhe,
  uso,
  bytes,
  principal = false,
}: {
  href: string;
  rotulo: string;
  detalhe: string;
  uso: string;
  bytes: number;
  principal?: boolean;
}) {
  return (
    <a
      href={href}
      download
      onClick={() => pushEvent("press_kit_download", { ficheiro: uso, file_size_mb: Math.round(bytes / 1_000_000) })}
      className={`btn-pill ${principal ? "btn-pill-ink" : "btn-pill-line"} inline-flex items-center gap-2`}
    >
      {rotulo}
      <span className="text-xs font-normal opacity-70">{detalhe}</span>
      <span aria-hidden="true">↓</span>
    </a>
  );
}
