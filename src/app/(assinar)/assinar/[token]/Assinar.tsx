"use client";

import { useState } from "react";

/**
 * Os dois passos de quem assina: pedir o código, e assinar com ele.
 *
 * O código chega ao email a que a ligação foi enviada; é ele que prova que
 * quem está a assinar é o dono desse endereço, e não alguém a quem a ligação
 * foi reencaminhada.
 */
export function Assinar({ token, nome, email }: { token: string; nome: string; email: string }) {
  const [passo, setPasso] = useState<"inicio" | "codigo" | "feito">("inicio");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nomeEscrito, setNomeEscrito] = useState(nome);
  const [aceito, setAceito] = useState(false);
  const [concluido, setConcluido] = useState(false);

  const pedirCodigo = async () => {
    setOcupado(true);
    setErro("");
    try {
      const resposta = await fetch(`/assinar/${token}/codigo`, { method: "POST" });
      const corpo = (await resposta.json().catch(() => ({}))) as { para?: string; error?: string };
      if (!resposta.ok) throw new Error(corpo.error ?? "Não foi possível enviar o código.");
      setAviso(`Enviámos um código de seis algarismos para ${corpo.para ?? email}. É válido durante 10 minutos.`);
      setPasso("codigo");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar o código.");
    } finally {
      setOcupado(false);
    }
  };

  const assinar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setOcupado(true);
    setErro("");
    try {
      const resposta = await fetch(`/assinar/${token}/confirmar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ codigo, nome: nomeEscrito, aceito }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { concluido?: boolean; error?: string };
      if (!resposta.ok) throw new Error(corpo.error ?? "Não foi possível assinar.");
      setConcluido(Boolean(corpo.concluido));
      setPasso("feito");
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível assinar.");
    } finally {
      setOcupado(false);
    }
  };

  if (passo === "feito") {
    return (
      <div role="status">
        <h2 className="font-display text-2xl">Assinado. Obrigado, {nomeEscrito.split(" ")[0]}.</h2>
        <p className="mt-2 max-w-[60ch] text-fg-soft">
          {concluido
            ? "O documento ficou assinado por todas as partes. Enviámos-lhe uma cópia, com o certificado de assinatura, para o seu email."
            : "A sua assinatura ficou registada. Quando as outras partes assinarem, recebe uma cópia do documento assinado por email."}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[560px]">
      <h2 className="font-display text-2xl">Assinar</h2>
      {passo === "inicio" ? (
        <>
          <p className="mt-2 text-fg-soft">
            Leia o documento acima. Para assinar, enviamos um código de confirmação para {email}.
          </p>
          <button type="button" className="btn-pill btn-pill-ink mt-5 disabled:opacity-40" disabled={ocupado} onClick={() => void pedirCodigo()}>
            {ocupado ? "A enviar…" : "Enviar o código"}
          </button>
        </>
      ) : (
        <form className="mt-3 grid gap-4" onSubmit={(e) => void assinar(e)}>
          {aviso ? <p className="text-sm text-fg-soft">{aviso}</p> : null}
          <label className="grid gap-1.5 text-sm font-semibold">
            Código de confirmação
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              className="w-40 rounded-[8px] border border-line bg-white px-3 py-2.5 text-lg tracking-[0.3em] text-ink"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            O seu nome completo
            <input
              required
              minLength={3}
              autoComplete="name"
              value={nomeEscrito}
              onChange={(e) => setNomeEscrito(e.target.value)}
              className="rounded-[8px] border border-line bg-white px-3 py-2.5 text-base font-normal text-ink"
            />
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" required checked={aceito} onChange={(e) => setAceito(e.target.checked)} className="mt-1 h-4 w-4" />
            <span>Li o documento e aceito-o, assinando-o eletronicamente com o nome acima.</span>
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn-pill btn-pill-ink disabled:opacity-40" disabled={ocupado || codigo.length !== 6 || !aceito}>
              {ocupado ? "A assinar…" : "Assinar o documento"}
            </button>
            <button type="button" className="text-sm text-fg-soft underline" disabled={ocupado} onClick={() => void pedirCodigo()}>
              Enviar outro código
            </button>
          </div>
        </form>
      )}
      {erro ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-red">
          {erro}
        </p>
      ) : null}
    </div>
  );
}
