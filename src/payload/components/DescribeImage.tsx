"use client";

import { toast, useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Botão ao lado do texto alternativo: pede ao Claude uma descrição da imagem e
 * põe-na nos campos. Não grava — quem edita lê, corrige e publica. Um texto
 * alternativo errado é pior do que nenhum, por isso a última palavra é de quem
 * está a escrever.
 *
 * Escreve nos campos pelo `useField`, que é o que o painel dá aos componentes
 * de campo. Uma versão anterior usava o `useForm`, que precisa do contexto do
 * formulário e não existe em todos os ecrãs onde o painel desenha um campo.
 */
export function DescribeImage() {
  const { id } = useDocumentInfo();
  const title = useField<string>({ path: "title" });
  const alt = useField<string>({ path: "alt" });
  const caption = useField<string>({ path: "caption" });
  const [busy, setBusy] = useState(false);

  if (!id) {
    return (
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>
        Grava a imagem primeiro e o texto alternativo pode ser escrito por IA.
      </p>
    );
  }

  const describe = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/media/${id}/descrever`, { method: "POST", credentials: "include" });
      const body = (await response.json()) as { title?: string; alt?: string; caption?: string; error?: string };
      if (!response.ok) throw new Error(body?.error ?? `erro ${response.status}`);

      if (body.title) title.setValue(body.title);
      if (body.alt) alt.setValue(body.alt);
      if (body.caption) caption.setValue(body.caption);
      toast.success(
        body.caption
          ? "Título, texto alternativo e legenda escritos. Confirma antes de gravar."
          : "Título e texto alternativo escritos. Confirma antes de gravar.",
      );
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0.4rem 0 0" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" disabled={busy} onClick={describe}>
        <span className="btn__content">
          <span className="btn__label">{busy ? "A olhar para a imagem…" : "Escrever com IA"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        Escreve uma proposta a partir da imagem. Revê antes de gravar.
      </span>
    </div>
  );
}

export default DescribeImage;
