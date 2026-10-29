"use client";

import { pushEvent } from "@/lib/gtm";

/**
 * Um ficheiro do press kit para descarregar, com o clique medido no GTM.
 *
 * O mesmo evento dos botões que havia na Newsroom (`press_kit_download`), para
 * os números de antes e de depois se somarem: o `ficheiro` diz o que foi —
 * o ZIP, um PDF, um logótipo, uma fotografia.
 */
export function Descarga({
  href,
  nome,
  ficheiro,
  className,
  title,
  children,
}: {
  href: string;
  nome?: string;
  ficheiro: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <a href={href} download={nome ?? ""} className={className} title={title} onClick={() => pushEvent("press_kit_download", { ficheiro })}>
      {children}
    </a>
  );
}
