"use client";

import { useRowLabel } from "@payloadcms/ui";
import { TIPOS } from "@/lib/inqueritos/tipos";

const NOMES = Object.fromEntries(TIPOS.map((tipo) => [tipo.value, tipo.label.replace(/\s*\(.*\)$/, "")]));

/**
 * O título de cada pergunta na lista fechada: o número, a pergunta e o tipo.
 * Sem isto a lista era «Pergunta 01, Pergunta 02…», e encontrar a que se
 * queria mudar obrigava a abri-las uma a uma.
 */
export function RotuloDaPergunta() {
  const { data, rowNumber } = useRowLabel<{ titulo?: string; tipo?: string; mostrarSe?: string }>();
  const numero = String((rowNumber ?? 0) + 1).padStart(2, "0");
  return (
    <span className="inq-rotulo">
      <span className="inq-rotulo__numero">{numero}</span>
      <span className="inq-rotulo__titulo">{data?.titulo || "Pergunta nova"}</span>
      <span className="inq-rotulo__tipo">
        {NOMES[data?.tipo ?? ""] ?? ""}
        {data?.mostrarSe ? " · com condição" : ""}
      </span>
    </span>
  );
}

export default RotuloDaPergunta;
