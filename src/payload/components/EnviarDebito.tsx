"use client";

import { toast, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * No topo de cada autorização de débito direto: enviar ao cliente, reenviar,
 * ou — depois de assinada — lembrar o passo que falta (o banco).
 */
export function EnviarDebito() {
  const { id } = useDocumentInfo();
  const router = useRouter();
  const modificado = useFormModified();
  const estado = useFormFields(([campos]) => campos?.estado?.value as string | undefined);
  const [ocupado, setOcupado] = useState(false);

  if (!id) return <Caixa>Guarda a autorização primeiro. Depois aparece aqui o botão para a enviar ao cliente.</Caixa>;
  if (estado === "assinada")
    return <Caixa>Assinada. Falta carregá-la no banco; depois, muda o estado para «Registada no banco». O documento assinado está em «Documento e prova da assinatura», mais abaixo.</Caixa>;
  if (estado === "registada") return <Caixa>Registada no banco. Atualiza «Último débito» quando houver débitos: sem débitos durante 36 meses, a autorização caduca.</Caixa>;
  if (estado === "revogada" || estado === "substituida" || estado === "cancelada")
    return <Caixa>Esta autorização já não está em vigor.</Caixa>;

  const enviar = async () => {
    const primeira = estado === "rascunho";
    if (primeira && !window.confirm("Enviar agora ao contacto do cliente?")) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/debitos-diretos/${id}/enviar`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ para?: string; error?: string }>(resposta);
      if (!resposta.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      toast.success(`Enviado para ${corpo.para}.`);
      router.refresh();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Caixa>
      <button type="button" className="btn btn--style-primary btn--size-small" disabled={ocupado || modificado} onClick={() => void enviar()} style={{ margin: 0 }}>
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A enviar…" : estado === "rascunho" ? "Enviar ao cliente" : "Reenviar ao cliente"}</span>
        </span>
      </button>
      <span>
        {modificado
          ? "Há alterações por guardar. Guarda primeiro."
          : estado === "rascunho"
            ? "O contacto recebe uma ligação para preencher e assinar, válida 30 dias."
            : "Reenviar manda outra ligação ao contacto e dá-lhe mais 30 dias."}
      </span>
    </Caixa>
  );
}

function Caixa({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.8rem",
        margin: "0 0 1.4rem",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-border-color)",
        borderRadius: "var(--style-radius-m)",
        background: "var(--theme-elevation-50)",
        color: "var(--theme-elevation-800)",
        fontSize: "0.85rem",
      }}
    >
      {children}
    </div>
  );
}

export default EnviarDebito;
