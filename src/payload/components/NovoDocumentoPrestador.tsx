"use client";

import { toast, useAuth, useDocumentInfo } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { leResposta } from "./resposta";
import { tem, type ComModulos } from "../acesso";

/**
 * Na ficha do prestador: «Novo documento para assinar».
 *
 * Cria o pedido em rascunho — o NDA, já com o prestador como signatário — e
 * abre-o. Lá se confirma, ou se troca para um PDF carregado, e se envia.
 */
export function NovoDocumentoPrestador() {
  const { id } = useDocumentInfo();
  // Mexe noutro módulo: só aparece a quem também o tem.
  const { user } = useAuth();
  const pode = tem(user as ComModulos, "assinaturas");
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  if (!id || !pode) return null;

  const criar = async () => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/assinaturas/para-prestador/${id}`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ id?: number | string; error?: string }>(resposta);
      if (!resposta.ok || !corpo.id) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      router.push(`/admin/collections/assinaturas/${corpo.id}`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar o pedido.");
      setOcupado(false);
    }
  };

  return (
    <div style={{ margin: "0 0 1.2rem" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" disabled={ocupado} onClick={() => void criar()} style={{ margin: 0 }}>
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A preparar…" : "Novo documento para assinar"}</span>
        </span>
      </button>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--theme-elevation-500)" }}>
        Abre um pedido com o NDA preenchido com esta ficha. Lá podes trocar por outro PDF antes de enviar.
      </p>
    </div>
  );
}

export default NovoDocumentoPrestador;
