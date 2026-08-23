import type React from "react";
import { Fragment } from "react";

/**
 * Número que roda até ao seu valor, como um contador mecânico.
 *
 * Cada algarismo é uma fita com os dez dígitos duas vezes; a fita está parada
 * no dígito certo e a animação limita-se a trazê-la de uma volta atrás. É por
 * isso que isto não se estraga: sem `animation-timeline` (Firefox, hoje), ou a
 * quem pediu menos movimento, a fita fica onde está — no número certo. O que
 * se perde é a rotação, não o número.
 *
 * O valor verdadeiro fica sempre no documento, em texto, para quem lê com
 * leitor de ecrã ou para quem indexa a página: as fitas são decoração.
 */
const ROLO = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const FITA = [...ROLO, ...ROLO];

export function Odometer({ value }: { value: string }) {
  return (
    <>
      <span className="sr-only">{value}</span>
      <span aria-hidden="true" className="odometro">
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
