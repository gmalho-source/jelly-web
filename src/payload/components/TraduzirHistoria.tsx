"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão que passa a história de um caso a inglês.
 *
 * A história vive uma vez só: os textos portugueses e ingleses estão lado a
 * lado no mesmo bloco. Este botão percorre o formulário, junta o que está em
 * português e ainda não tem inglês, manda tudo numa ida ao modelo, e escreve o
 * resultado nos campos ingleses.
 *
 * Não grava, e não escreve por cima. Um caso é a peça comercial da casa: o que
 * sai daqui fica no formulário à espera de ser lido, e um texto inglês que
 * alguém já escreveu à mão ganha sempre ao que o modelo escreveria.
 *
 * Anda pelos campos do formulário e não pelo documento gravado, porque é isso
 * que permite traduzir uma história acabada de escrever, ainda por gravar — que
 * é precisamente quando alguém quer isto.
 */

/** Os campos de texto de um caso: o português, e onde o inglês vai ficar. */
const PARES = [
  { pt: "heading", en: "headingEn" },
  { pt: "body", en: "bodyEn" },
  { pt: "label", en: "labelEn" },
];

export function TraduzirHistoria() {
  const [campos] = useAllFormFields();
  const { dispatchFields } = useForm();
  const [busy, setBusy] = useState(false);

  /**
   * O que há para traduzir: para cada campo português com texto cujo par inglês
   * esteja vazio, o caminho de destino e o texto de partida.
   */
  const porTraduzir = Object.entries(campos ?? {})
    .map(([caminho, campo]) => {
      const par = PARES.find(({ pt }) => caminho.endsWith(`.${pt}`));
      if (!par) return null;
      const texto = String((campo as { value?: unknown })?.value ?? "").trim();
      if (!texto) return null;
      const destino = `${caminho.slice(0, -par.pt.length)}${par.en}`;
      const ingles = String((campos?.[destino] as { value?: unknown })?.value ?? "").trim();
      if (ingles) return null;
      return { destino, texto };
    })
    .filter((item): item is { destino: string; texto: string } => Boolean(item));

  const traduzir = async () => {
    if (!porTraduzir.length) return;
    setBusy(true);
    try {
      const response = await fetch("/api/projects/traduzir-historia", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          textos: porTraduzir.map((item) => item.texto),
          cliente: String((campos?.client as { value?: unknown })?.value ?? ""),
        }),
      });
      const corpo = await leResposta<{ traducoes?: string[]; error?: string }>(response);
      if (!response.ok || !corpo.traducoes) throw new Error(corpo?.error ?? `erro ${response.status}`);

      porTraduzir.forEach((item, indice) => {
        dispatchFields({ type: "UPDATE", path: item.destino, value: corpo.traducoes![indice] ?? "" });
      });
      toast.success(`${porTraduzir.length} ${porTraduzir.length === 1 ? "texto traduzido" : "textos traduzidos"}. Lê antes de gravar.`);
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 1.5rem", flexWrap: "wrap" }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={busy || !porTraduzir.length}
        onClick={traduzir}
      >
        <span className="btn__content">
          <span className="btn__label">{busy ? "A traduzir a história…" : "Traduzir a história para inglês"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        {porTraduzir.length
          ? `${porTraduzir.length} ${porTraduzir.length === 1 ? "texto por traduzir" : "textos por traduzir"}. Não escreve por cima do inglês que já lá esteja.`
          : "Não há nada por traduzir: ou não há texto português, ou o inglês já está escrito."}
      </span>
    </div>
  );
}

export default TraduzirHistoria;
