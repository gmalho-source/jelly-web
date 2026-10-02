"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { pushEvent } from "@/lib/gtm";

/**
 * As páginas vistas que o GTM não vê sozinho.
 *
 * O site muda de página sem recarregar, e o `gtm.js` só conta o carregamento
 * inicial. Aqui, a cada mudança de caminho, vai para a `dataLayer` um evento
 * `virtual_pageview` com o endereço e o título da página nova. No GTM, um
 * acionador «Evento personalizado: virtual_pageview» liga-o à tag de página
 * vista do GA4. Se se usar isto, desliga-se no GA4 a medição melhorada das
 * «mudanças de página com base no histórico do browser» — senão cada página
 * conta duas vezes.
 *
 * Dois cuidados, vindos do código que o IT propôs (o terceiro, a fila que se
 * cria se o GTM ainda não chegou, está em `lib/gtm.ts`):
 * - O endereço é o da barra do browser e não o do `usePathname`: o site tem
 *   reencaminhamentos internos (as línguas), e com eles o `usePathname` pode
 *   devolver o caminho de dentro em vez do que o visitante vê. O `usePathname`
 *   serve só para saber quando mudou.
 * - Só conta mudanças de caminho, não de `?…`: a pesquisa do blog muda o
 *   endereço a cada letra, e cada letra não é uma página.
 *
 * O título espera um instante: numa navegação sem recarregar o Next aplica o
 * título da página nova logo a seguir, e enviado na hora levava o da anterior.
 */
export function GTMRouteTracker() {
  const pathname = usePathname();
  // O caminho do carregamento inicial já foi contado pelo próprio gtm.js.
  const ultimo = useRef<string | null>(null);

  useEffect(() => {
    const caminho = window.location.pathname;
    if (ultimo.current === null) {
      ultimo.current = caminho;
      return;
    }
    if (caminho === ultimo.current) return;
    ultimo.current = caminho;

    const id = window.setTimeout(() => {
      pushEvent("virtual_pageview", {
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 100);
    return () => window.clearTimeout(id);
  }, [pathname]);

  return null;
}
