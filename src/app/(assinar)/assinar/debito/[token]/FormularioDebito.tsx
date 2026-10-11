"use client";

import { useState } from "react";

type Campo = "empresa" | "nif" | "morada" | "iban" | "signatarioNome" | "signatarioCargo" | "signatarioEmail";
type Anterior = { nif: string; morada: string; recorrente: boolean; signatarioNome: string; signatarioCargo: string; signatarioEmail: string };

const classe = "rounded-[8px] border border-line bg-white px-3 py-2.5 text-base font-normal text-ink";

/** O formulário da autorização. Ao submeter, segue para a assinatura (ou avisa para onde foi). */
export function FormularioDebito({ token, empresa, email, anterior }: { token: string; empresa: string; email: string; anterior: Anterior | null }) {
  const [v, setV] = useState<Record<Campo, string>>({
    empresa,
    nif: anterior?.nif ?? "",
    morada: anterior?.morada ?? "",
    // O IBAN não volta a aparecer: escreve-se outra vez.
    iban: "",
    signatarioNome: anterior?.signatarioNome ?? "",
    signatarioCargo: anterior?.signatarioCargo ?? "",
    signatarioEmail: anterior?.signatarioEmail || email,
  });
  const [recorrente, setRecorrente] = useState(anterior?.recorrente ?? true);
  const [consentimento, setConsentimento] = useState(false);
  const [erros, setErros] = useState<Partial<Record<Campo, string>>>({});
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [enviadoPara, setEnviadoPara] = useState("");

  const submeter = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setOcupado(true);
    setErro("");
    setErros({});
    try {
      const resposta = await fetch(`/assinar/debito/${encodeURIComponent(token)}/preencher`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...v, recorrente, consentimento }),
      });
      const corpo = (await resposta.json().catch(() => ({}))) as { ligacao?: string; enviadoPara?: string; error?: string; erros?: Partial<Record<Campo, string>> };
      if (!resposta.ok) {
        if (corpo.erros) setErros(corpo.erros);
        throw new Error(corpo.error ?? "Não foi possível continuar.");
      }
      if (corpo.ligacao) return window.location.assign(corpo.ligacao);
      setEnviadoPara(corpo.enviadoPara ?? "");
      setOcupado(false);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível continuar.");
      setOcupado(false);
    }
  };

  if (enviadoPara) {
    return (
      <div role="status" className="mt-8">
        <h2 className="font-display text-2xl">Enviámos a autorização para assinar</h2>
        <p className="mt-2 max-w-[60ch] text-fg-soft">
          {enviadoPara} recebe agora um email com a autorização preenchida, para ler e assinar. Quando estiver assinada, recebe uma cópia.
        </p>
      </div>
    );
  }

  const campo = (nome: Campo, rotulo: string, extra: { ajuda?: string; tipo?: string; autoComplete?: string; linhas?: number; maiusculas?: boolean } = {}) => (
    <label key={nome} className="grid gap-1.5 text-sm font-semibold">
      {rotulo}
      {extra.linhas ? (
        <textarea rows={extra.linhas} required autoComplete={extra.autoComplete} value={v[nome]} onChange={(e) => setV({ ...v, [nome]: e.target.value })} aria-invalid={Boolean(erros[nome])} className={classe} />
      ) : (
        <input
          type={extra.tipo ?? "text"}
          required
          autoComplete={extra.autoComplete}
          value={v[nome]}
          onChange={(e) => setV({ ...v, [nome]: extra.maiusculas ? e.target.value.toUpperCase() : e.target.value })}
          aria-invalid={Boolean(erros[nome])}
          className={classe}
        />
      )}
      {erros[nome] ? <span className="text-sm font-semibold text-red">{erros[nome]}</span> : extra.ajuda ? <span className="text-xs font-normal text-fg-soft">{extra.ajuda}</span> : null}
    </label>
  );

  return (
    <form className="mt-8 grid max-w-[640px] gap-5" onSubmit={(e) => void submeter(e)} noValidate>
      <h2 className="font-display text-xl">A empresa</h2>
      {campo("empresa", "Nome da empresa", { ajuda: "Como está na certidão permanente.", autoComplete: "organization" })}
      {campo("nif", "NIF")}
      {campo("morada", "Morada da sede", { ajuda: "Rua, número, código postal e localidade.", linhas: 3, autoComplete: "street-address" })}
      {campo("iban", "IBAN da conta a debitar", { ajuda: "A conta tem de ser da empresa. Começa por PT50 numa conta portuguesa.", maiusculas: true })}
      <fieldset className="grid gap-2 text-sm">
        <legend className="mb-1.5 font-semibold">Pagamento</legend>
        <label className="flex items-center gap-3">
          <input type="radio" name="recorrente" checked={recorrente} onChange={() => setRecorrente(true)} className="h-4 w-4" />
          Recorrente — as faturas da Jelly, sempre que houver
        </label>
        <label className="flex items-center gap-3">
          <input type="radio" name="recorrente" checked={!recorrente} onChange={() => setRecorrente(false)} className="h-4 w-4" />
          Pontual — um único débito
        </label>
      </fieldset>

      <h2 className="mt-4 font-display text-xl">Quem assina</h2>
      <p className="-mt-2 max-w-[60ch] text-sm text-fg-soft">
        A pessoa com poderes para obrigar a empresa — um gerente ou administrador. Se não for quem está a preencher, indique o email
        dela: enviamos-lhe a autorização preenchida para assinar.
      </p>
      {campo("signatarioNome", "Nome completo", { autoComplete: "name" })}
      {campo("signatarioCargo", "Cargo", { ajuda: "Por exemplo: gerente, administrador." })}
      {campo("signatarioEmail", "Email de quem assina", { tipo: "email", ajuda: "É para aqui que vai o código para assinar e a cópia assinada.", autoComplete: "email" })}

      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" required checked={consentimento} onChange={(e) => setConsentimento(e.target.checked)} className="mt-1 h-4 w-4" />
        <span>Aceito que estes dados sejam usados para a autorização de débito direto e para a cobrança das faturas da Jelly.</span>
      </label>
      <div>
        <button type="submit" className="btn-pill btn-pill-ink disabled:opacity-40" disabled={ocupado || !consentimento}>
          {ocupado ? "A preparar a autorização…" : "Continuar"}
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
