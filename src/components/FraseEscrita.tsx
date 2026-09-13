"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Uma frase que se escreve à frente de quem lê.
 *
 * O texto vai inteiro para o documento e é o servidor que o desenha: quem chega
 * sem javascript, com menos movimento ou com um browser antigo lê a frase como
 * sempre leu. O que este componente faz é acrescentar o gesto, e só depois de a
 * frase estar à vista — começar ao carregar era escrevê-la para ninguém, porque
 * ela está três ecrãs abaixo da dobra.
 *
 * Escreve uma vez. Uma frase que se reescreve de cada vez que se passa por ela
 * é um brinquedo, e à segunda já ninguém a lê.
 *
 * Para quem ouve a página, as letras não existem: o `aria-label` leva a frase
 * escrita de uma vez, e os pedaços vão escondidos. Sem isso, um leitor de ecrã
 * soletrava cento e dez letras.
 */
export function FraseEscrita({
  texto,
  className = "",
  ritmo = 24,
}: {
  texto: string;
  className?: string;
  /** Milissegundos por letra. Cento e dez letras a 24ms são dois segundos e meio. */
  ritmo?: number;
}) {
  const [escreve, setEscreve] = useState(false);
  const alvo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento) return;
    // Sem `IntersectionObserver` — um browser muito antigo — a frase fica
    // simplesmente escrita, que é o estado de repouso.
    if (typeof IntersectionObserver === "undefined") return;

    const olho = new IntersectionObserver(
      (entradas) => {
        // Metade à vista, e não um pixel: começar com a primeira linha a
        // espreitar no fundo do ecrã é escrever por baixo da dobra.
        if (entradas.some((entrada) => entrada.intersectionRatio >= 0.5)) {
          setEscreve(true);
          olho.disconnect();
        }
      },
      { threshold: [0.5] },
    );
    olho.observe(elemento);
    return () => olho.disconnect();
  }, []);

  /*
   * Uma letra por `span`, e o espaço fica um espaço normal.
   *
   * O que se escreve não muda de sítio: as letras que ainda não chegaram estão
   * lá, invisíveis, a ocupar o lugar delas. Assim as linhas partem onde vão
   * partir no fim, e a frase não salta enquanto se escreve — que é o defeito de
   * todos os «typewriter» que reescrevem o texto a cada letra.
   *
   * O espaço é um espaço normal e não um espaço duro. Com um espaço duro a
   * frase deixa de ter onde partir: medido num telemóvel de 390px, os 1303px
   * de texto saíam todos numa linha só, para fora do ecrã.
   */
  const letras = [...texto];

  return (
    <span
      ref={alvo}
      className={`frase-escrita ${className}`}
      data-escreve={escreve ? "sim" : "nao"}
      style={{ "--ritmo": `${ritmo}ms` } as React.CSSProperties}
      aria-label={texto}
    >
      {letras.map((letra, indice) => (
        <span
          key={`${letra}-${indice}`}
          aria-hidden="true"
          className="letra"
          style={{ "--vez": indice } as React.CSSProperties}
        >
          {letra}
        </span>
      ))}
    </span>
  );
}
