"use client";

import { useState } from "react";

type Campo = "nome" | "email" | "telefone" | "nif" | "morada" | "documento";

const CAMPOS: { nome: Campo; rotulo: string; ajuda?: string; tipo?: string; autoComplete?: string; linhas?: number }[] = [
  { nome: "nome", rotulo: "Nome completo", ajuda: "Como está no cartão de cidadão ou no passaporte.", autoComplete: "name" },
  { nome: "email", rotulo: "Email", ajuda: "É para aqui que enviamos o código para assinar e a cópia do NDA assinado.", tipo: "email", autoComplete: "email" },
  { nome: "telefone", rotulo: "Telefone", tipo: "tel", autoComplete: "tel" },
  { nome: "nif", rotulo: "NIF (número de contribuinte)" },
  { nome: "documento", rotulo: "N.º do cartão de cidadão ou do passaporte" },
  { nome: "morada", rotulo: "Morada", ajuda: "Rua, número, código postal e localidade.", autoComplete: "street-address", linhas: 3 },
];

/** O formulário do link do NDA. Ao submeter, segue para a página de assinatura. */
export function FormularioNda({ chave }: { chave: string }) {
  const [valores, setValores] = useState<Record<Campo, string>>({ nome: "", email: "", telefone: "", nif: "", morada: "", documento: "" });
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setOcupado(true);
    setErro("");
    setErros({});
    try {
      const resposta = await fetch(`/assinar/nda/${encodeURIComponent(chave)}/comecar`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...valores, consentimento }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { ligacao?: string; error?: string; erros?: Partial<Record<Campo, string>> };
      if (!resposta.ok || !corpo.ligacao) {
        if (corpo.erros) setErros(corpo.erros);
        throw new Error(corpo.error ?? "Não foi possível continuar.");
      }
      window.location.assign(corpo.ligacao);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível continuar.");
      setOcupado(false);
    }
  };

  const classe = "rounded-[8px] border border-line bg-white px-3 py-2.5 text-base font-normal text-ink";
  return (
    <form className="mt-8 grid max-w-[620px] gap-5" onSubmit={(e) => void submeter(e)} noValidate>
      {CAMPOS.map((c) => (
        <label key={c.nome} className="grid gap-1.5 text-sm font-semibold">
          {c.rotulo}
          {c.linhas ? (
            <textarea
              rows={c.linhas}
              required
              autoComplete={c.autoComplete}
              value={valores[c.nome]}
              onChange={(e) => setValores({ ...valores, [c.nome]: e.target.value })}
              aria-invalid={Boolean(erros[c.nome])}
              className={classe}
            />
          ) : (
            <input
              type={c.tipo ?? "text"}
              required
              autoComplete={c.autoComplete}
              value={valores[c.nome]}
              onChange={(e) => setValores({ ...valores, [c.nome]: e.target.value })}
              aria-invalid={Boolean(erros[c.nome])}
              className={classe}
            />
          )}
          {erros[c.nome] ? (
            <span className="text-sm font-semibold text-red">{erros[c.nome]}</span>
          ) : c.ajuda ? (
            <span className="text-xs font-normal text-fg-soft">{c.ajuda}</span>
          ) : null}
        </label>
      ))}
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" required checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>Aceito que estes dados sejam usados para preparar o NDA e para a minha ficha de prestador de serviços na Jelly.</span>
      </label>
      <div>
        <button type="submit" className="btn-pill btn-pill-ink disabled:opacity-40" disabled={ocupado || !consentimento}>
          {ocupado ? "A preparar o NDA…" : "Continuar para o NDA"}
        </button>
      </div>
      {erro ? (
        <p role="alert" className="text-sm font-semibold text-red">
          {erro}
        </p>
      ) : null}
    </form>
  );
}
