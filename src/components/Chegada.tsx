"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * A chegada com tempo próprio: o mesmo gesto do `.entra` — sobe 32px e acende
 * —, mas disparado uma vez quando o elemento assoma, em vez de preso ao scroll.
 *
 * Existe para as listas que mudam de altura. O `.entra` mede cada elemento
 * contra a posição dele no ecrã, e numa lista que se filtra ou que cresce com
 * «Ver mais» os elementos mudam de sítio à frente de quem acabou de clicar: os
 * que já tinham assentado voltavam a ficar meio transparentes. O MOVIMENTO.md
 * proíbe isso, e a saída que lá estava era a lista entrar como um bloco só.
 * Esta é a outra: cada elemento chega uma vez, e o que chegou fica.
 *
 * O que está à vista quando a página abre não se anima — está lá, inteiro. Só
 * o que está fora do ecrã é posto à espera, e por isso nunca há um elemento a
 * desaparecer à frente de ninguém. Sem javascript, sem `IntersectionObserver`
 * ou a quem pediu menos movimento, não há espera: está tudo à vista.
 *
 * Os elementos marcam-se com `data-chega` no JSX; o estado (`espera`,
 * `chegou`) é posto aqui, direito no DOM, para não redesenhar a lista a cada
 * artigo que chega.
 */
export function useChegada(contentor: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const raiz = contentor.current;
    if (!raiz || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const vistos = new WeakSet<Element>();
    const olho = new IntersectionObserver(
      (entradas) => {
        let vez = 0;
        for (const entrada of entradas) {
          const elemento = entrada.target as HTMLElement;
          const primeiraVez = !vistos.has(elemento);
          vistos.add(elemento);

          if (entrada.isIntersecting) {
            // À vista na primeira leitura: estava no ecrã ao abrir, fica quieto.
            if (primeiraVez) elemento.dataset.chega = "ja";
            else if (elemento.dataset.chega === "espera") {
              // Vários a chegar de uma vez — um salto no scroll — chegam à vez.
              elemento.style.animationDelay = `${vez++ * 70}ms`;
              elemento.dataset.chega = "chegou";
            }
            if (elemento.dataset.chega !== "espera") olho.unobserve(elemento);
          } else if (primeiraVez) {
            elemento.dataset.chega = "espera";
          }
        }
      },
      { threshold: 0.12 },
    );

    const observar = () =>
      raiz.querySelectorAll<HTMLElement>("[data-chega]").forEach((elemento) => {
        if (!vistos.has(elemento)) olho.observe(elemento);
      });
    observar();

    // Uma lista pode ganhar elementos depois de montar; esses também chegam.
    const mudancas = new MutationObserver(observar);
    mudancas.observe(raiz, { childList: true, subtree: true });

    return () => {
      olho.disconnect();
      mudancas.disconnect();
    };
  }, [contentor]);
}

/** Um bloco solto que chega: para o que vive num componente de servidor. */
export function Chega({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const caixa = useRef<HTMLDivElement>(null);
  useChegada(caixa);
  return (
    <div ref={caixa} className={className}>
      <div data-chega="">{children}</div>
    </div>
  );
}
