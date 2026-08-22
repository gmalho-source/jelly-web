"use client";

import { toast, useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Botão ao lado do texto alternativo: pede ao Claude uma descrição da imagem e
 * põe-na nos campos. Não grava — quem edita lê, corrige e publica. Um texto
 * alternativo errado é pior do que nenhum, por isso a última palavra é de quem
 * está a escrever.
 *
 * Funciona nos dois momentos, e o segundo é o que interessa: com a imagem já
 * gravada vai buscá-la pelo id; com uma imagem acabada de escolher, ainda por
 * gravar, manda os bytes que estão no browser. Escrever o título e o texto
 * alternativo é parte de carregar a imagem, não uma segunda visita.
 *
 * Escreve nos campos pelo `useField`, que é o que o painel dá aos componentes
 * de campo. Uma versão anterior usava o `useForm`, que precisa do contexto do
 * formulário e não existe em todos os ecrãs onde o painel desenha um campo.
 */
export function DescribeImage() {
  const { id } = useDocumentInfo();
  // O painel guarda o ficheiro escolhido no estado do formulário, em `file`,
  // antes de haver documento. É de lá que vêm os bytes.
  const ficheiro = useField<File | undefined>({ path: "file" });
  const title = useField<string>({ path: "title" });
  const alt = useField<string>({ path: "alt" });
  const caption = useField<string>({ path: "caption" });
  const [busy, setBusy] = useState(false);

  const escolhido = ficheiro.value instanceof File ? ficheiro.value : undefined;

  if (!id && !escolhido) {
    return (
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>
        Escolhe a imagem e a IA pode escrever o título e o texto alternativo.
      </p>
    );
  }

  const pedido = async () => {
    if (escolhido) {
      const body = await encolher(escolhido);
      return fetch(`/api/media/descrever?nome=${encodeURIComponent(escolhido.name)}`, {
        method: "POST",
        body,
        headers: { "content-type": body.type || "application/octet-stream" },
        credentials: "include",
      });
    }
    return fetch(`/api/media/${id}/descrever`, { method: "POST", credentials: "include" });
  };

  const describe = async () => {
    setBusy(true);
    try {
      const response = await pedido();
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
        {escolhido ? "Lê a imagem que acabaste de escolher." : "Escreve uma proposta a partir da imagem."} Revê antes de
        gravar.
      </span>
    </div>
  );
}

/**
 * Encolhe no browser antes de enviar. Uma fotografia de máquina traz seis
 * megabytes, e o corpo de um pedido não passa de quatro e meio na plataforma
 * onde isto corre — além de que a descrição não melhora com mais pixels.
 *
 * Um SVG, ou um formato que o browser não desenhe, não passa por aqui: nesse
 * caso segue como está, se couber.
 */
async function encolher(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, 1400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("sem canvas");
    contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!jpeg) throw new Error("o browser não converteu a imagem");
    return jpeg;
  } catch {
    if (file.size > 4_000_000) throw new Error("imagem grande demais para descrever antes de gravar");
    return file;
  }
}

export default DescribeImage;
