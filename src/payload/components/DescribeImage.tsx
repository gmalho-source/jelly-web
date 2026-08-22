"use client";

import { Button, toast, useDocumentInfo, useForm } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Botão ao lado do texto alternativo: pede ao Claude uma descrição da imagem e
 * põe-na nos campos. Não grava — quem edita lê, corrige e publica. Um texto
 * alternativo errado é pior do que nenhum, por isso a última palavra é de quem
 * está a escrever.
 */
export function DescribeImage() {
  const { id } = useDocumentInfo();
  const { dispatchFields } = useForm();
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
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? `erro ${response.status}`);

      if (body.alt) dispatchFields({ type: "UPDATE", path: "alt", value: body.alt });
      if (body.caption) dispatchFields({ type: "UPDATE", path: "caption", value: body.caption });
      toast.success(body.caption ? "Texto alternativo e legenda escritos. Confirma antes de gravar." : "Texto alternativo escrito. Confirma antes de gravar.");
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ margin: "0.4rem 0 0" }}>
      <Button buttonStyle="secondary" size="small" disabled={busy} onClick={describe}>
        {busy ? "A olhar para a imagem…" : "Escrever com IA"}
      </Button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem", marginLeft: "0.6rem" }}>
        Escreve uma proposta a partir da imagem. Revê antes de gravar.
      </span>
    </div>
  );
}

export default DescribeImage;
