"use client";

import { toast, useField } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão debaixo da apresentação em inglês: passa a portuguesa a inglês e
 * põe-na no campo. Não grava.
 *
 * A apresentação de uma pessoa é a única coisa nesta página que ela escreveu.
 * Por isso o botão avisa antes de escrever por cima de um texto que já lá
 * esteja, e por isso o que sai fica no formulário à espera de ser lido — a
 * gravação continua a ser um gesto de quem está no painel.
 */
export function TraduzirIA() {
  const portuguesa = useField<string>({ path: "bio.pt" });
  const inglesa = useField<string>({ path: "bio.en" });
  const nome = useField<string>({ path: "name" });
  const [busy, setBusy] = useState(false);

  const traduzir = async () => {
    const origem = (portuguesa.value ?? "").trim();
    if (!origem) {
      toast.error("Escreve primeiro a apresentação em português.");
      return;
    }
    if ((inglesa.value ?? "").trim() && !window.confirm("Já há texto em inglês. Escrever por cima?")) return;

    setBusy(true);
    try {
      const response = await fetch("/api/team/traduzir", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: origem, nome: nome.value ?? "" }),
      });
      const body = await leResposta<{ traducao?: string; error?: string }>(response);
      if (!response.ok || !body.traducao) throw new Error(body?.error ?? `erro ${response.status}`);
      inglesa.setValue(body.traducao);
      toast.success("Traduzido. Lê antes de gravar.");
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.4rem 0 0", flexWrap: "wrap" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" disabled={busy} onClick={traduzir}>
        <span className="btn__content">
          <span className="btn__label">{busy ? "A traduzir…" : "Traduzir do português"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        Vazio, o site inglês serve a apresentação portuguesa.
      </span>
    </div>
  );
}

export default TraduzirIA;
