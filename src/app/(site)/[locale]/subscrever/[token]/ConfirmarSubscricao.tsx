"use client";

import { useState } from "react";

/** O botão que fecha a subscrição — e o que fica no lugar dele quando fecha. */
export function ConfirmarSubscricao({
  token,
  copy,
}: {
  token: string;
  copy: { button: string; sending: string; done: string; doneBody: string; erro: string };
}) {
  const [estado, setEstado] = useState<"idle" | "sending" | "done" | "error">("idle");

  const confirma = async () => {
    setEstado("sending");
    try {
      const resposta = await fetch("/api/subscrever", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!resposta.ok) throw new Error(String(resposta.status));
      setEstado("done");
    } catch {
      setEstado("error");
    }
  };

  if (estado === "done") {
    return (
      <div className="rounded-[6px] border border-line bg-white p-6 text-ink">
        <p className="text-lg font-semibold">{copy.done}</p>
        <p className="mt-2 text-sm text-ink/70">{copy.doneBody}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      <button
        type="button"
        onClick={() => void confirma()}
        disabled={estado === "sending"}
        className="btn-pill w-fit disabled:opacity-40"
      >
        {estado === "sending" ? copy.sending : copy.button}
      </button>
      {estado === "error" ? (
        <p className="text-xs text-coral" role="alert">
          {copy.erro}
        </p>
      ) : null}
    </div>
  );
}
