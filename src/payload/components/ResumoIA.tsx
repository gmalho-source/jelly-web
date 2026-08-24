"use client";

import { toast, useField } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão debaixo do campo do resumo: pede ao Claude um resumo do artigo, na
 * língua deste campo, e põe-no no campo. Não grava.
 *
 * O resumo é a primeira linha do artigo no site e é a `description` que sai nos
 * resultados de pesquisa — ou seja, é a promessa que o artigo faz a quem ainda
 * não entrou. Uma promessa dessas não se assina sem ler: o botão escreve, quem
 * escreve corrige, e só depois se publica.
 *
 * O corpo do artigo segue do browser tal como está no editor, e não é lido no
 * servidor pelo id: assim isto funciona também num artigo que ainda não foi
 * gravado, que é precisamente quando alguém precisa de um resumo.
 *
 * O contador de caracteres fica ao lado por uma razão prática: 155 é onde o
 * Google corta, e um resumo com 190 caracteres parece bom no painel e sai
 * cortado a meio na pesquisa.
 */
export function ResumoIA({ lingua }: { lingua: "pt" | "en" }) {
  const resumo = useField<string>({ path: `excerpt.${lingua}` });
  const titulo = useField<string>({ path: lingua === "en" ? "titleEn" : "titlePt" });
  const tituloPt = useField<string>({ path: "titlePt" });
  const corpo = useField<unknown>({ path: lingua === "en" ? "bodyEn" : "body" });
  const corpoPt = useField<unknown>({ path: "body" });
  const [busy, setBusy] = useState(false);

  const escrever = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/posts/resumo", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          lingua,
          // Sem título e corpo em inglês, o resumo inglês escreve-se a partir do
          // português — é o que o site também faz quando falta a tradução.
          titulo: titulo.value || tituloPt.value,
          corpo: corpo.value ?? corpoPt.value,
        }),
      });
      const body = await leResposta<{ resumo?: string; error?: string }>(response);
      if (!response.ok || !body.resumo) throw new Error(body?.error ?? `erro ${response.status}`);
      resumo.setValue(body.resumo);
      toast.success("Resumo escrito. Lê antes de gravar.");
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  const comprimento = (resumo.value ?? "").trim().length;
  const longo = comprimento > 158;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.4rem 0 0", flexWrap: "wrap" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" disabled={busy} onClick={escrever}>
        <span className="btn__content">
          <span className="btn__label">{busy ? "A ler o artigo…" : "Escrever com IA"}</span>
        </span>
      </button>
      <span style={{ color: longo ? "var(--jelly-red)" : "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        {comprimento ? `${comprimento} caracteres` : "Serve de description no Google"}
        {longo ? " — o Google corta perto dos 155." : ""}
      </span>
    </div>
  );
}

export default ResumoIA;
