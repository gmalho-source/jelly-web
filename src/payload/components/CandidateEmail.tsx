"use client";

import { toast, useDocumentInfo, useField } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

type Rascunho = { status: string; to?: string; subject: string; body: string; jaEnviado?: boolean; error?: string };

/**
 * Botão debaixo do estado: mostra o email que vai para o candidato, deixa
 * corrigi-lo, e só depois envia.
 *
 * São dois passos de propósito. Uma rejeição enviada por engano ao mudar um
 * menu não se desfaz, e este é o email que uma pessoa vai reler. Depois de
 * enviado fica no registo quem o enviou, para quem, quando, e com que texto.
 */
export function CandidateEmail() {
  const { id } = useDocumentInfo();
  const estado = useField<string>({ path: "status" });
  const [rascunho, setRascunho] = useState<Rascunho | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const semEmail = ["nova"].includes(estado.value ?? "nova");

  if (!id) {
    return (
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>
        Grava a candidatura primeiro.
      </p>
    );
  }

  const pedirRascunho = async () => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/applications/${id}/email`, { credentials: "include" });
      const corpo = await leResposta<Rascunho>(resposta);
      if (!resposta.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      setRascunho(corpo);
    } catch (erro) {
      toast.error(`Não deu: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
    }
  };

  const enviar = async () => {
    if (!rascunho) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/applications/${id}/email`, {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject: rascunho.subject, body: rascunho.body }),
      });
      const corpo = await leResposta<{ ok?: boolean; error?: string; simulado?: boolean }>(resposta);
      if (!resposta.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      toast.success(
        corpo.simulado
          ? "Sem chave de email neste ambiente: o texto ficou no log."
          : `Enviado para ${rascunho.to}. Fica no registo desta candidatura.`,
      );
      setRascunho(null);
    } catch (erro) {
      toast.error(`Não deu: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
    }
  };

  if (semEmail) {
    return (
      <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.8rem", margin: "0.4rem 0 0" }}>
        Uma candidatura nova não gera email. Muda o estado e aparece aqui o texto a enviar.
      </p>
    );
  }

  return (
    <div style={{ margin: "0.6rem 0 0" }}>
      {!rascunho ? (
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button type="button" className="btn btn--style-secondary btn--size-small" disabled={ocupado} onClick={pedirRascunho}>
            <span className="btn__content">
              <span className="btn__label">{ocupado ? "A preparar…" : "Preparar email ao candidato"}</span>
            </span>
          </button>
          <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
            Grava o estado antes, se o acabaste de mudar.
          </span>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            padding: "0.9rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.6rem",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--theme-elevation-500)" }}>
            Para {rascunho.to}
            {rascunho.jaEnviado ? " · já foi enviado um email para este estado" : ""}
          </span>
          <input
            value={rascunho.subject}
            onChange={(evento) => setRascunho({ ...rascunho, subject: evento.target.value })}
            style={{ width: "100%", padding: "0.5rem", font: "inherit" }}
          />
          <textarea
            value={rascunho.body}
            rows={14}
            onChange={(evento) => setRascunho({ ...rascunho, body: evento.target.value })}
            style={{ width: "100%", padding: "0.5rem", font: "inherit", lineHeight: 1.5 }}
          />
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <button type="button" className="btn btn--style-primary btn--size-small" disabled={ocupado} onClick={enviar}>
              <span className="btn__content">
                <span className="btn__label">{ocupado ? "A enviar…" : "Enviar"}</span>
              </span>
            </button>
            <button
              type="button"
              className="btn btn--style-secondary btn--size-small"
              disabled={ocupado}
              onClick={() => setRascunho(null)}
            >
              <span className="btn__content">
                <span className="btn__label">Cancelar</span>
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CandidateEmail;
