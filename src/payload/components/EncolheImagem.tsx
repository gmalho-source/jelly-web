"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useRef, useState } from "react";

/**
 * Encolhe a imagem no browser antes de ela sair para o servidor.
 *
 * Uma imagem passa pelo servidor de propósito — é lá que o sharp a converte
 * para WebP e lhe tira os tamanhos — e um pedido a uma função da Vercel não
 * pode passar de 4,5 MB. Uma fotografia de telemóvel ou de máquina passa com
 * facilidade: 2000 px em PNG são 5 a 8 MB. O painel devolvia um erro seco e o
 * ficheiro não subia — aconteceu com dois retratos da equipa, e o `curl` contra
 * a produção confirmou o 413 «FUNCTION_PAYLOAD_TOO_LARGE» a partir dos 4,5 MB.
 *
 * O que isto faz: assim que o ficheiro é escolhido, se pesar mais do que o
 * tecto ou for maior do que o servidor guardaria de qualquer maneira (2400 px
 * do lado maior), redesenha-o num canvas e troca-o no formulário pela versão
 * encolhida. O servidor recebe menos do que 4,5 MB e faz o resto como sempre.
 * Nada se perde que o site fosse usar: a coleção já trava tudo nos 2400 px.
 *
 * Um PNG sai em WebP para manter a transparência de um logótipo; o resto sai em
 * JPEG. Um SVG, ou um formato que o browser não desenhe, segue como está — e se
 * for grande demais, a linha por baixo do ficheiro diz-o antes de se carregar
 * no botão de gravar.
 */
const TECTO = 4_000_000; // com folga para o resto do pedido
const LADO = 2400;

function comoSeLe(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.round(bytes / 1024)} KB`;
}

async function encolhe(file: File): Promise<File | null> {
  const bitmap = await createImageBitmap(file);
  const escala = Math.min(1, LADO / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  const contexto = canvas.getContext("2d");
  if (!contexto) return null;
  contexto.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const transparente = file.type === "image/png" || file.type === "image/webp";
  const tipo = transparente ? "image/webp" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, tipo, 0.86));
  if (!blob || blob.type !== tipo) return null;
  const nome = file.name.replace(/\.[^.]+$/, "") + (tipo === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], nome, { type: tipo, lastModified: Date.now() });
}

export function EncolheImagem() {
  const campo = useField<File | undefined>({ path: "file" });
  const escolhido = campo.value instanceof File ? campo.value : undefined;
  const [nota, setNota] = useState<{ antes: number; depois?: number; erro?: string } | null>(null);
  // O ficheiro já tratado, para a troca não voltar a disparar sobre si própria.
  const tratado = useRef<File | null>(null);
  const { setValue } = campo;

  useEffect(() => {
    if (!escolhido || escolhido === tratado.current) return;
    tratado.current = escolhido;
    const precisa = escolhido.size > TECTO;
    if (!precisa) {
      // Pequeno o suficiente: só se diz o peso. (Uma imagem grande em píxeis
      // mas leve não vale a troca — o servidor trava-a nos 2400 px.)
      Promise.resolve().then(() => setNota({ antes: escolhido.size }));
      return;
    }
    let vivo = true;
    encolhe(escolhido)
      .then((menor) => {
        if (!vivo) return;
        if (menor && menor.size < escolhido.size) {
          tratado.current = menor;
          setValue(menor);
          setNota({ antes: escolhido.size, depois: menor.size });
        } else {
          setNota({ antes: escolhido.size, erro: "não consegui encolher este ficheiro" });
        }
      })
      .catch(() => vivo && setNota({ antes: escolhido.size, erro: "o browser não desenha este formato" }));
    return () => {
      vivo = false;
    };
  }, [escolhido, setValue]);

  if (!escolhido || !nota) return null;

  const aindaGrande = (nota.depois ?? nota.antes) > TECTO;
  const cor = aindaGrande ? "var(--theme-error-500)" : "var(--theme-elevation-500)";

  return (
    <p style={{ margin: "0 0 1.25rem", fontSize: "0.8rem", lineHeight: 1.6, color: cor }}>
      {nota.depois ? (
        <>
          <strong>{comoSeLe(nota.antes)} → {comoSeLe(nota.depois)}</strong> — encolhida aqui no browser antes de
          subir. O servidor não aceita mais do que 4,5 MB por imagem, e esta passava.
        </>
      ) : aindaGrande ? (
        <>
          <strong>{comoSeLe(nota.antes)}</strong> — acima dos 4,5 MB que o servidor aceita, e {nota.erro ?? "não deu para encolher"}.
          Exporta-a a menos de 4 MB (JPEG, 2400 px no lado maior chega) e volta a escolher.
        </>
      ) : (
        <>
          <strong>{comoSeLe(nota.antes)}</strong> — bom tamanho.
        </>
      )}
    </p>
  );
}

export default EncolheImagem;
