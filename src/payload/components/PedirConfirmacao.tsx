"use client";

import { toast, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * «Pedir confirmação»: manda ao candidato o link onde ele vê o que temos,
 * corrige o que estiver errado, e autoriza — ou manda apagar.
 *
 * Só aparece nas fichas que precisam: as que nasceram de um currículo e ainda
 * estão por confirmar. Numa candidatura vinda do formulário do site o
 * consentimento já foi dado por quem se candidatou, e voltar a pedi-lo seria
 * pedir duas vezes a mesma coisa.
 */
export function PedirConfirmacao() {
  const { id } = useDocumentInfo();
  const [ocupado, setOcupado] = useState(false);
  const [lingua, setLingua] = useState<"pt" | "en">("pt");

  const estado = useFormFields(([campos]) => campos?.status?.value as string | undefined);
  const email = useFormFields(([campos]) => campos?.email?.value as string | undefined);
  const pedidoEm = useFormFields(([campos]) => campos?.confirmSentAt?.value as string | undefined);
  const confirmadaEm = useFormFields(([campos]) => campos?.confirmedAt?.value as string | undefined);

  if (!id || confirmadaEm || estado !== "por_confirmar") return null;

  const pedir = async () => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/applications/${id}/confirmacao?lingua=${lingua}`, {
        method: "post",
        credentials: "include",
      });
      const corpo = await leResposta<{ ok?: boolean; para?: string; error?: string }>(resposta);
      if (!resposta.ok || !corpo.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      toast.success(`Pedido enviado para ${corpo.para}. O link vale catorze dias.`);
    } catch (erro) {
      toast.error(`Não deu: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.7rem",
        margin: "0 0 1.4rem",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-border-color)",
        borderRadius: "var(--style-radius-m)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <button
        type="button"
        className="btn btn--style-primary btn--size-small"
        disabled={ocupado || !email}
        onClick={() => void pedir()}
      >
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A enviar…" : pedidoEm ? "Pedir outra vez" : "Pedir confirmação"}</span>
        </span>
      </button>
      <select
        value={lingua}
        onChange={(evento) => setLingua(evento.target.value === "en" ? "en" : "pt")}
        style={{ padding: "0.35rem 0.5rem", borderRadius: "var(--style-radius-s)" }}
      >
        <option value="pt">Português</option>
        <option value="en">English</option>
      </select>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.78rem", maxWidth: "52ch" }}>
        {email
          ? pedidoEm
            ? "Já foi pedido. Pedir outra vez gera um link novo e invalida o anterior."
            : "Manda ao candidato o link onde ele confirma os dados e autoriza que se guardem. É o que traz o consentimento."
          : "Sem email na ficha não há a quem pedir. Escreve-o primeiro e guarda."}
      </span>
    </div>
  );
}

export default PedirConfirmacao;
