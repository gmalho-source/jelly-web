"use client";

import { useEffect, useRef } from "react";

/**
 * A secção do trabalho toma a cor da marca que está no ecrã.
 *
 * Cada obra traz o seu acento em `data-acento`. Quando passa pelo meio do
 * ecrã, o rótulo e o numeral do cabeçalho tomam essa cor — o cinza da
 * Stronddo, o âmbar do gin, o sálvia da clínica. É a página a demonstrar que
 * um sistema se adapta, em vez de o afirmar num parágrafo.
 *
 * Só JavaScript de observação, sem estado do React: a cor entra como variável
 * na própria secção, e é o CSS que faz a transição. Sem JavaScript fica o
 * vermelho da casa, que é o estado de repouso.
 */
export function ObrasComAcento({ children, className }: { children: React.ReactNode; className?: string }) {
  const seccao = useRef<HTMLElement>(null);

  useEffect(() => {
    const raiz = seccao.current;
    if (!raiz) return;
    const obras = raiz.querySelectorAll<HTMLElement>("[data-acento]");
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) raiz.style.setProperty("--acento-vivo", entrada.target.getAttribute("data-acento") ?? "");
        }
      },
      // A faixa central do ecrã: a obra «manda» enquanto atravessa o meio.
      { rootMargin: "-45% 0px -45% 0px" },
    );
    obras.forEach((obra) => observador.observe(obra));
    return () => observador.disconnect();
  }, []);

  return (
    <section ref={seccao} className={className}>
      {children}
    </section>
  );
}
