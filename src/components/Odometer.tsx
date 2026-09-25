"use client";

import type React from "react";
import { Fragment, useEffect, useRef, useState } from "react";

/**
 * Número que roda até ao seu valor, como um contador mecânico.
 *
 * Cada algarismo é uma fita com os dez dígitos duas vezes; a fita está parada
 * no dígito certo e a animação limita-se a trazê-la de uma volta atrás. É por
 * isso que isto não se estraga: sem javascript, ou a quem pediu menos
 * movimento, a fita fica onde está — no número certo. O que se perde é a
 * rotação, não o número.
 *
 * **Roda com o tempo, não com o scroll.** Estava ligada ao scroll, e quem
 * parasse de rolar a meio ficava com o contador parado a meio: «04 anos de
 * atividade», «88 pessoas na equipa» — números errados, à vista, sem nada que
 * os fizesse andar. É a mesma lição da `FraseEscrita`: um gesto que tem de
 * acabar num valor certo não pode depender de a pessoa continuar a rolar.
 * Agora começa quando metade do número está à vista, e acaba sempre.
 *
 * Roda uma vez. E não roda o que já está no ecrã quando a página abre: um
 * número que chega a girar à frente de quem ainda não fez nada não é um
 * efeito, é ruído.
 *
 * O valor verdadeiro fica sempre no documento, em texto, para quem lê com
 * leitor de ecrã ou para quem indexa a página: as fitas são decoração.
 */
const ROLO = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const FITA = [...ROLO, ...ROLO];

export function Odometer({ value }: { value: string }) {
  const [roda, setRoda] = useState(false);
  const alvo = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const elemento = alvo.current;
    if (!elemento || typeof IntersectionObserver === "undefined") return;

    let primeira = true;
    const olho = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas.some((entrada) => entrada.intersectionRatio >= 0.5);
        // A primeira resposta diz o que estava à vista ao abrir: isso fica
        // quieto, no número certo.
        if (primeira) {
          primeira = false;
          if (visivel) return olho.disconnect();
        }
        if (visivel) {
          setRoda(true);
          olho.disconnect();
        }
      },
      { threshold: [0, 0.5] },
    );
    olho.observe(elemento);
    return () => olho.disconnect();
  }, []);

  return (
    <>
      <span className="sr-only">{value}</span>
      <span ref={alvo} aria-hidden="true" className="odometro" data-roda={roda ? "sim" : "nao"}>
        {[...value].map((caracter, indice) => {
          // Um separador (espaço, ponto, mais) não roda: fica onde está.
          if (!/[0-9]/.test(caracter)) {
            return <Fragment key={indice}>{caracter}</Fragment>;
          }
          return (
            <span
              key={indice}
              className="odometro-casa"
              style={
                {
                  "--digito": caracter,
                  "--casa": indice,
                } as React.CSSProperties
              }
            >
              <span className="odometro-fita">
                {FITA.map((numero, posicao) => (
                  <span key={posicao}>{numero}</span>
                ))}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
