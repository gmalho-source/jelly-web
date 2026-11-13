"use client";

import { toast, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import { leResposta } from "./resposta";

type Estado = { vezes: number; ultima: string | null };

const quando = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * Na ficha do prestador: «Enviar instruções de faturação».
 *
 * Só manda quando se carrega, e pergunta antes. Diz por baixo quantas vezes já
 * saiu e quando foi a última — o histórico inteiro está no separador
 * «Atividade». Só funciona com a ficha gravada e «Qualificado»: é o que está
 * gravado que billing.jelly.pt vai procurar.
 */
export function InstrucoesPrestador() {
  const { id } = useDocumentInfo();
  const alterado = useFormModified();
  const estadoDaFicha = useFormFields(([campos]) => String(campos?.estado?.value ?? ""));
  const email = useFormFields(([campos]) => String(campos?.email?.value ?? ""));
  const [envios, setEnvios] = useState<Estado | null>(null);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    fetch(`/api/prestadores/${id}/instrucoes`, { credentials: "include" })
      .then((resposta) => leResposta<Estado>(resposta))
      .then((corpo) => vivo && typeof corpo.vezes === "number" && setEnvios(corpo))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, [id]);

  if (!id) return null;

  const qualificado = estadoDaFicha === "qualificado";
  const motivo = alterado
    ? "Grava a ficha primeiro: o email sai para o que está gravado."
    : !qualificado
      ? "Só com a ficha «Qualificado»: com outro estado, billing.jelly.pt recusa a entrada."
      : "";

  const enviar = async () => {
    const outraVez = envios?.vezes ? ` Já foram enviadas ${envios.vezes === 1 ? "uma vez" : `${envios.vezes} vezes`}.` : "";
    if (!window.confirm(`Enviar as instruções de faturação para ${email}?${outraVez}`)) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/prestadores/${id}/instrucoes`, { method: "post", credentials: "include" });
      const corpo = await leResposta<Estado & { ok?: boolean; para?: string; error?: string }>(resposta);
      if (!resposta.ok || !corpo.ok) throw new Error(corpo.error ?? `erro ${resposta.status}`);
      setEnvios({ vezes: corpo.vezes, ultima: corpo.ultima });
      toast.success(`Instruções enviadas para ${corpo.para}.`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível enviar.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div style={{ margin: "0 0 1.2rem" }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={ocupado || Boolean(motivo)}
        onClick={() => void enviar()}
        style={{ margin: 0 }}
      >
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A enviar…" : "Enviar instruções de faturação"}</span>
        </span>
      </button>
      <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--theme-elevation-500)" }}>
        {motivo ||
          (envios?.vezes
            ? `Enviadas ${envios.vezes === 1 ? "uma vez" : `${envios.vezes} vezes`}${envios.ultima ? `, a última a ${quando(envios.ultima)}` : ""}. O histórico está em «Atividade».`
            : "Ainda não enviadas. Explica como entrar em billing.jelly.pt para submeter faturas.")}
      </p>
    </div>
  );
}

export default InstrucoesPrestador;
