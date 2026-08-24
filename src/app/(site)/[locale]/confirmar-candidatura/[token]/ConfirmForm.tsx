"use client";

import { useEffect, useRef, useState } from "react";

type Escolha = { value: string; label: string };

type Copy = {
  name: string;
  email: string;
  emailHint: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string;
  portfolio: string;
  experience: string;
  contract: string;
  choose: string;
  experienceOptions: Escolha[];
  contractOptions: Escolha[];
  consent: string;
  newsletter: string;
  submit: string;
  sending: string;
  done: string;
  doneLead: string;
  erros: { name: string; consent: string; geral: string };
  deleteTitle: string;
  deleteLead: string;
  delete: string;
  deleteConfirm: string;
  deleted: string;
  deletedLead: string;
};

type Valores = {
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedin: string;
  portfolio: string;
  experienceYears: string;
  contractWanted: string;
};

/**
 * O formulário de confirmação.
 *
 * É o mesmo desenho dos outros do site — a mesma caixa, o mesmo erro campo a
 * campo, a mesma pastilha —, mas o gesto é outro: aqui não se preenche do
 * zero, corrige-se o que um modelo leu de um currículo. Por isso os campos vêm
 * cheios, e o email vem fechado: foi para ele que o link foi, e deixá-lo mudar
 * era deixar a chave abrir outra porta.
 *
 * O botão de apagar não está escondido no fim de uma política: está aqui, ao
 * lado do de confirmar, e apaga mesmo — a ficha e o currículo, no momento.
 */
export function ConfirmForm({ token, valores, copy }: { token: string; valores: Valores; copy: Copy }) {
  const [estado, setEstado] = useState<"idle" | "sending" | "done" | "deleted" | "error">("idle");
  const [erros, setErros] = useState<Record<string, string>>({});
  const aviso = useRef<HTMLDivElement>(null);
  const forma = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (estado === "done" || estado === "deleted") aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [estado]);

  const field =
    "w-full min-w-0 rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-xs outline-none transition-colors duration-200 placeholder:text-ink/45 focus:border-red";
  const marca = (campo: string) =>
    erros[campo] ? `${field} border-red shadow-[inset_0_0_0_1px_var(--color-red)]` : field;
  const recado = (campo: string) =>
    erros[campo] ? (
      <p id={`erro-${campo}`} className="text-xs text-coral" role="alert">
        {erros[campo]}
      </p>
    ) : null;
  const limpa = (campo: string) =>
    setErros((atual) => {
      if (!atual[campo]) return atual;
      const { [campo]: _fora, ...resto } = atual;
      return resto;
    });

  const envia = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const texto = (chave: string) => String(dados.get(chave) ?? "").trim();

    const falta: Record<string, string> = {};
    if (!texto("name")) falta.name = copy.erros.name;
    if (!dados.get("consent")) falta.consent = copy.erros.consent;
    setErros(falta);
    if (Object.keys(falta).length) {
      const primeiro = ["name", "consent"].find((campo) => falta[campo]);
      forma.current?.querySelector<HTMLElement>(`[name="${primeiro}"]`)?.focus();
      return;
    }

    setEstado("sending");
    try {
      const resposta = await fetch("/api/candidatura/confirmar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          token,
          name: texto("name"),
          phone: texto("phone"),
          city: texto("city"),
          country: texto("country"),
          linkedin: texto("linkedin"),
          portfolio: texto("portfolio"),
          experienceYears: texto("experienceYears"),
          contractWanted: texto("contractWanted"),
          newsletter: Boolean(dados.get("newsletter")),
        }),
      });
      if (!resposta.ok) throw new Error(String(resposta.status));
      setEstado("done");
    } catch {
      setEstado("error");
      setErros({ geral: copy.erros.geral });
    }
  };

  const apaga = async () => {
    if (!window.confirm(copy.deleteConfirm)) return;
    setEstado("sending");
    try {
      const resposta = await fetch("/api/candidatura/confirmar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token, apagar: true }),
      });
      if (!resposta.ok) throw new Error(String(resposta.status));
      setEstado("deleted");
    } catch {
      setEstado("error");
      setErros({ geral: copy.erros.geral });
    }
  };

  if (estado === "done" || estado === "deleted") {
    const feito = estado === "done";
    return (
      <div ref={aviso} className="rounded-[6px] border border-line bg-white p-6 text-ink">
        <p className="text-lg font-semibold">{feito ? copy.done : copy.deleted}</p>
        <p className="mt-2 text-sm text-ink/70">{feito ? copy.doneLead : copy.deletedLead}</p>
      </div>
    );
  }

  const campo = (nome: keyof Valores, rotulo: string, extra?: { hint?: string; readOnly?: boolean }) => (
    <div className="grid gap-1.5">
      <label htmlFor={nome} className="eyebrow text-fg-soft">
        {rotulo}
      </label>
      <input
        id={nome}
        name={nome}
        defaultValue={valores[nome]}
        readOnly={extra?.readOnly}
        aria-describedby={erros[nome] ? `erro-${nome}` : extra?.hint ? `dica-${nome}` : undefined}
        onInput={() => limpa(nome)}
        className={extra?.readOnly ? `${field} bg-line/40 text-ink/60` : marca(nome)}
      />
      {extra?.hint ? (
        <p id={`dica-${nome}`} className="text-xs text-fg-soft">
          {extra.hint}
        </p>
      ) : null}
      {recado(nome)}
    </div>
  );

  const escolha = (nome: "experienceYears" | "contractWanted", rotulo: string, opcoes: Escolha[]) => (
    <div className="grid gap-1.5">
      <label htmlFor={nome} className="eyebrow text-fg-soft">
        {rotulo}
      </label>
      <select id={nome} name={nome} defaultValue={valores[nome]} className={field}>
        <option value="">{copy.choose}</option>
        {opcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <>
      <form ref={forma} onSubmit={envia} noValidate className="grid gap-5">
        {campo("name", copy.name)}
        {campo("email", copy.email, { hint: copy.emailHint, readOnly: true })}
        {campo("phone", copy.phone)}
        <div className="grid gap-5 sm:grid-cols-2">
          {campo("city", copy.city)}
          {campo("country", copy.country)}
        </div>
        {campo("linkedin", copy.linkedin)}
        {campo("portfolio", copy.portfolio)}
        <div className="grid gap-5 sm:grid-cols-2">
          {escolha("experienceYears", copy.experience, copy.experienceOptions)}
          {escolha("contractWanted", copy.contract, copy.contractOptions)}
        </div>

        <div className="grid gap-1.5">
          <label className="flex items-start gap-3 text-sm text-fg-soft">
            <input type="checkbox" name="consent" className="mt-1 accent-red" onChange={() => limpa("consent")} />
            {copy.consent}
          </label>
          {recado("consent")}
        </div>
        <label className="flex items-start gap-3 text-sm text-fg-soft">
          <input type="checkbox" name="newsletter" className="mt-1 accent-red" />
          {copy.newsletter}
        </label>

        <button type="submit" disabled={estado === "sending"} className="btn-pill w-fit disabled:opacity-40">
          {estado === "sending" ? copy.sending : copy.submit}
        </button>
        {erros.geral ? (
          <p className="text-xs text-coral" role="alert">
            {erros.geral}
          </p>
        ) : null}
      </form>

      <div className="mt-12 border-t border-line/40 pt-8">
        <h2 className="text-lg font-semibold">{copy.deleteTitle}</h2>
        <p className="mt-2 max-w-[46ch] text-sm text-fg-soft">{copy.deleteLead}</p>
        <button
          type="button"
          onClick={() => void apaga()}
          disabled={estado === "sending"}
          // Contorno em vez de fundo: é a acção secundária, e uma pastilha
          // cheia ao lado da de confirmar dava-lhes o mesmo peso.
          className="btn-pill btn-pill-line mt-4 w-fit disabled:opacity-40"
        >
          {copy.delete}
        </button>
      </div>
    </>
  );
}
