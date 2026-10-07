"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { pushEvent } from "@/lib/gtm";

/**
 * Uma ligação para a conversa de WhatsApp da casa, com o clique medido.
 *
 * Vai para o GTM como `whatsapp_click`, com o sítio de onde se carregou
 * (`origem`: o botão que flutua ou o rodapé) e a página em que se estava. É o
 * que diz quantas conversas o site começa, e a partir de que páginas.
 */
export function LigacaoWhatsApp({
  href,
  origem,
  rotulo,
  className,
  children,
}: {
  href: string;
  origem: "botao_flutuante" | "rodape";
  rotulo?: string;
  className?: string;
  children: ReactNode;
}) {
  const pagina = usePathname();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={rotulo}
      title={rotulo}
      className={className}
      onClick={() => pushEvent("whatsapp_click", { origem, pagina })}
    >
      {children}
    </a>
  );
}
