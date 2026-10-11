"use client";

import { toast, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * «Enviar para assinatura»: no topo de cada pedido.
 *
 * No primeiro envio o documento congela — o NDA é gerado a partir da ficha do
 * prestador, ou o PDF carregado fica como está — e cada signatário recebe a
 * sua ligação pessoal. Depois disso, o mesmo botão reenvia a quem ainda não
 * assinou. Pede que se guarde antes: o que se envia é o que está gravado.
 */
export function EnviarAssinatura() {
  const { id } = useDocumentInfo();
  const router = useRouter();
  const modificado = useFormModified();
  const [ocupado, setOcupado] = useState(false);
  const estado = useFormFields(([campos]) => campos?.estado?.value as string | undefined);

  if (!id) {
    return <Caixa>Guarda o pedido primeiro. Depois aparece aqui o botão para o enviar.</Caixa>;
  }
  if (estado === "concluido") {
    return <Caixa>Assinado por todos. O documento assinado está em «Documento e prova», mais abaixo.</Caixa>;
  }
  if (estado === "cancelado") {
    return <Caixa>Pedido cancelado: as ligações já não abrem. Para voltar a pedir, cria um novo.</Caixa>;
  }

  const enviar = async () => {
    const primeira = estado !== "enviado";
    if (primeira && !window.confirm("Enviar agora? O documento fica congelado tal como está e cada signatário recebe a ligação por email.")) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/assinaturas/${id}/enviar`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ enviados?: number; falhados?: string[]; error?: string }>(resposta);
      if (!resposta.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      if (corpo.falhados?.length) toast.warning(`Enviado a ${corpo.enviados}. Não saiu para: ${corpo.falhados.join(", ")}.`);
      else toast.success(corpo.enviados === 1 ? "Enviado. O signatário recebeu a ligação por email." : `Enviado a ${corpo.enviados} signatários.`);
      router.refresh();
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Caixa>
      <button
        type="button"
        className="btn btn--style-primary btn--size-small"
        disabled={ocupado || modificado}
        onClick={() => void enviar()}
        style={{ margin: 0 }}
      >
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A enviar…" : estado === "enviado" ? "Reenviar a quem falta" : "Enviar para assinatura"}</span>
        </span>
      </button>
      <span>
        {modificado
          ? "Há alterações por guardar. Guarda primeiro: o que se envia é o que está gravado."
          : estado === "enviado"
            ? "Já foi enviado. Reenviar manda outra vez a ligação a quem ainda não assinou."
            : "O documento congela ao enviar: depois disso já não se troca."}
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

export default EnviarAssinatura;
