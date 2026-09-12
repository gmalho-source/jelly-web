"use client";

import { useEffect, useRef, useState } from "react";
import { INDICATIVOS, PADRAO, rotulo } from "@/lib/indicativos";

export type PlanoParaEscolher = {
  key: string;
  name: string;
  /** Já formatado na língua de quem lê: «75 €/mês», e a campanha se houver. */
  preco: string;
  promo?: string;
};

export type CopyDoFormulario = {
  plano: string;
  site: string;
  siteHint: string;
  infetado: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  phoneHint: string;
  notas: string;
  notasHint: string;
  consent: string;
  privacidade: string;
  submit: string;
  sending: string;
  sent: string;
  sentBody: string;
  error: string;
  erros: {
    name: string;
    email: string;
    emailInvalid: string;
    phone: string;
    phoneShort: string;
    site: string;
    consent: string;
  };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * O formulário de subscrição do JellyCARE.
 *
 * É irmão do da página de contactos e não uma coisa nova: os mesmos campos com
 * os mesmos nomes, a mesma armadilha para robôs, o mesmo erro por campo com
 * foco no primeiro que falta. O que muda é o que se pergunta — qual o plano e
 * qual o site — porque é isso que separa uma subscrição de um briefing.
 *
 * A escolha do plano são rótulos com `radio` verdadeiro por baixo, e não um
 * `select`: são dois ou três, cada um com preço, e uma lista fechada esconde
 * exactamente a informação que ajuda a decidir. Cada um tem âncora própria —
 * os botões dos cartões saltam para aqui já com o plano escolhido.
 */
export function FormularioJellyCare({
  planos,
  copy,
  privacidadeHref,
}: {
  planos: PlanoParaEscolher[];
  copy: CopyDoFormulario;
  privacidadeHref: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [nome, setNome] = useState("");
  const [plano, setPlano] = useState(planos[0]?.key ?? "");
  const [erros, setErros] = useState<Record<string, string>>({});
  const aviso = useRef<HTMLParagraphElement>(null);
  const forma = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state === "sent") aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  /*
   * O botão de um cartão traz o plano consigo.
   *
   * Os cartões apontam para `#subscrever-<chave>`, que é a âncora do rótulo
   * desse plano. O browser leva lá, e este efeito marca o `radio` certo: sem
   * isto, quem carregasse em «Subscrever» no Plus aterrava no formulário com o
   * plano base escolhido — e era o formulário a desdizer o clique.
   */
  useEffect(() => {
    const daAncora = () => {
      const alvo = decodeURIComponent(window.location.hash.replace("#subscrever-", ""));
      if (alvo && planos.some((p) => p.key === alvo)) setPlano(alvo);
    };
    daAncora();
    window.addEventListener("hashchange", daAncora);
    return () => window.removeEventListener("hashchange", daAncora);
  }, [planos]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const valores = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      site: String(data.get("site") ?? "").trim(),
    };
    const digitos = valores.phone.replace(/\D/g, "").length;

    const falta: Record<string, string> = {};
    if (!valores.name) falta.name = copy.erros.name;
    if (!valores.email) falta.email = copy.erros.email;
    else if (!EMAIL.test(valores.email)) falta.email = copy.erros.emailInvalid;
    if (!valores.phone) falta.phone = copy.erros.phone;
    else if (digitos < 6) falta.phone = copy.erros.phoneShort;
    if (!valores.site) falta.site = copy.erros.site;
    if (data.get("consent") !== "on") falta.consent = copy.erros.consent;

    if (Object.keys(falta).length) {
      setErros(falta);
      const primeiro = ["name", "email", "phone", "site", "consent"].find((campo) => falta[campo]);
      if (primeiro) {
        const alvo = forma.current?.querySelector<HTMLElement>(`[name="${primeiro}"]`);
        alvo?.focus();
        alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErros({});
    setNome(valores.name.split(/\s+/)[0]);
    setState("sending");
    try {
      const response = await fetch("/api/jellycare", { method: "POST", body: data });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p ref={aviso} className="rounded-[20px] border-l-2 border-chartreuse bg-white p-6 text-md text-ink" role="status">
        <span className="block font-display text-xl leading-tight text-ink">{copy.sent.replace("{nome}", nome)}</span>
        <span className="mt-3 block text-md text-ink/70">{copy.sentBody}</span>
      </p>
    );
  }

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
      const { [campo]: _, ...resto } = atual;
      return resto;
    });

  return (
    <form ref={forma} onSubmit={onSubmit} className="grid gap-4" noValidate>
      <fieldset className="grid gap-1.5">
        <legend className="eyebrow mb-2 text-fg-soft">{copy.plano}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {planos.map((opcao) => (
            <label
              key={opcao.key}
              id={`subscrever-${opcao.key}`}
              className={`flex cursor-pointer scroll-mt-28 items-start gap-3 rounded-[4px] border bg-white px-4 py-3.5 transition-colors duration-200 ${
                plano === opcao.key ? "border-red shadow-[inset_0_0_0_1px_var(--color-red)]" : "border-line hover:border-ink/30"
              }`}
            >
              <input
                type="radio"
                name="plano"
                value={opcao.key}
                checked={plano === opcao.key}
                onChange={() => setPlano(opcao.key)}
                className="mt-1 accent-[var(--color-red)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink">{opcao.name}</span>
                <span className="block text-sm text-ink/60">{opcao.preco}</span>
                {opcao.promo ? <span className="mt-1 block text-xs font-semibold text-red">{opcao.promo}</span> : null}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-1.5">
        <label htmlFor="site" className="eyebrow text-fg-soft">
          {copy.site}
        </label>
        <input
          id="site"
          name="site"
          inputMode="url"
          placeholder={copy.siteHint}
          className={marca("site")}
          aria-invalid={Boolean(erros.site)}
          aria-describedby={erros.site ? "erro-site" : undefined}
          onInput={() => limpa("site")}
        />
        {recado("site")}
      </div>

      {/* A pergunta que o site antigo fazia, e vale a pena continuar a fazer:
          um site infetado não é uma subscrição normal, é uma urgência. */}
      <label className="flex items-start gap-3 text-sm text-fg-soft">
        <input type="checkbox" name="infetado" className="mt-1 accent-[var(--color-red)]" />
        <span>{copy.infetado}</span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="name" className="eyebrow text-fg-soft">
            {copy.name}
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            className={marca("name")}
            aria-invalid={Boolean(erros.name)}
            aria-describedby={erros.name ? "erro-name" : undefined}
            onInput={() => limpa("name")}
          />
          {recado("name")}
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="company" className="eyebrow text-fg-soft">
            {copy.company}
          </label>
          <input id="company" name="company" autoComplete="organization" className={field} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="email" className="eyebrow text-fg-soft">
          {copy.email}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className={marca("email")}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "erro-email" : undefined}
          onInput={() => limpa("email")}
        />
        {recado("email")}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="phone" className="eyebrow text-fg-soft">
          {copy.phone}
        </label>
        <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-2">
          <select id="dial" name="dial" defaultValue={PADRAO} aria-label={copy.phoneHint} className={field}>
            {INDICATIVOS.map((indicativo) => (
              <option key={indicativo.iso} value={indicativo.iso}>
                {rotulo(indicativo)}
              </option>
            ))}
          </select>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={copy.phoneHint}
            className={marca("phone")}
            aria-invalid={Boolean(erros.phone)}
            aria-describedby={erros.phone ? "erro-phone" : undefined}
            onInput={() => limpa("phone")}
          />
        </div>
        {recado("phone")}
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="notas" className="eyebrow text-fg-soft">
          {copy.notas}
        </label>
        <textarea id="notas" name="notas" rows={3} placeholder={copy.notasHint} className={field} />
      </div>

      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm text-fg-soft">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 accent-[var(--color-red)]"
            aria-invalid={Boolean(erros.consent)}
            onChange={() => limpa("consent")}
          />
          <span>
            {copy.consent}{" "}
            <a href={privacidadeHref} className="text-red underline decoration-1 underline-offset-2 hover:no-underline">
              {copy.privacidade}
            </a>
            .
          </span>
        </label>
        {recado("consent")}
      </div>

      {/* A armadilha: fora do ecrã e fora do foco. */}
      <input
        type="text"
        name="empresa_"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* `btn-pill-ink`: a pílula normal é cor de papel, e este formulário vive
          numa secção de papel — sem isto o botão ficava branco sobre branco. */}
      <button type="submit" disabled={state === "sending"} className="btn-pill btn-pill-ink w-fit disabled:opacity-40">
        {state === "sending" ? copy.sending : copy.submit} <span aria-hidden="true">→</span>
      </button>

      {state === "error" ? (
        <p className="text-sm text-coral" role="alert">
          {copy.error}
        </p>
      ) : null}
    </form>
  );
}
