"use client";

import { useEffect, useRef, useState } from "react";
import { INDICATIVOS, PADRAO, rotulo } from "@/lib/indicativos";

type Copy = {
  name: string;
  company: string;
  email: string;
  phone: string;
  phoneHint: string;
  message: string;
  messageHint: string;
  start: string;
  startHint: string;
  startOptions: { value: string; label: string }[];
  brief: string;
  briefHint: string;
  submit: string;
  sending: string;
  sent: string;
  sentBody: string;
  error: string;
  invalid: string;
  tooBig: string;
};

/** Quatro megabytes: é o que o servidor recebe num pedido. */
const LIMITE = 4_000_000;

export function ContactForm({ copy }: { copy: Copy }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "invalid" | "grande">("idle");
  const [nome, setNome] = useState("");
  const aviso = useRef<HTMLParagraphElement>(null);

  // No telefone o formulário é comprido, e depois de enviar a confirmação
  // ficava fora do ecrã: quem carregou em enviar não via nada acontecer.
  useEffect(() => {
    if (state === "sent") aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const valores = {
      name: String(data.get("name") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      message: String(data.get("message") ?? "").trim(),
    };

    // Seis dígitos é o mais curto que um número de telefone chega a ser em
    // qualquer parte. Não se valida por país: a lista tem 55 indicativos e cada
    // um tem as suas regras — o que se quer aqui é impedir um número de fachada,
    // não fazer as contas da operadora.
    const digitos = valores.phone.replace(/\D/g, "").length;

    if (
      !valores.name ||
      !valores.company ||
      !valores.message ||
      digitos < 6 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valores.email)
    ) {
      setState("invalid");
      return;
    }

    const ficheiro = data.get("brief");
    if (ficheiro instanceof File && ficheiro.size > LIMITE) {
      setState("grande");
      return;
    }

    setNome(valores.name.split(/\s+/)[0]);
    setState("sending");
    try {
      // Vai como formulário e não como JSON: o briefing é um ficheiro, e um
      // ficheiro dentro de JSON obrigava a codificá-lo em base64 — mais um
      // terço de peso por nada.
      const response = await fetch("/api/contacto", { method: "POST", body: data });
      setState(response.ok ? "sent" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <p
        ref={aviso}
        className="rounded-[20px] border-l-2 border-chartreuse bg-white p-6 text-md text-ink"
        role="status"
      >
        <span className="block font-display text-xl leading-tight text-ink">
          {copy.sent.replace("{nome}", nome)}
        </span>
        <span className="mt-3 block text-md text-ink/70">{copy.sentBody}</span>
      </p>
    );
  }

  // A caixa é branca mas herdava o texto da superfície escura: escrevia-se
  // branco sobre branco. A cor do texto e do sugerido são desta caixa, não da
  // secção onde ela está.
  const field =
    "rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-xs outline-none transition-colors duration-200 placeholder:text-ink/45 focus:border-red";

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="name" className="eyebrow text-fg-soft">
          {copy.name}
        </label>
        <input id="name" name="name" required autoComplete="name" className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="company" className="eyebrow text-fg-soft">
          {copy.company}
        </label>
        <input id="company" name="company" required autoComplete="organization" className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="eyebrow text-fg-soft">
          {copy.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={field} />
      </div>
      {/* Indicativo e número lado a lado. São dois controlos porque um só,
          com máscara, obriga a escrever o «+351» a quem já o tem por omissão —
          e falha para quem não é de cá. Juntam-se no servidor.

          Obrigatório de propósito: quem tem um projeto a sério dá o telefone, e
          quem não o dá está a dizer alguma coisa sobre o pedido. É a única
          pergunta do formulário que serve para filtrar. */}
      <div className="grid gap-1.5">
        <label htmlFor="phone" className="eyebrow text-fg-soft">
          {copy.phone}
        </label>
        <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-2">
          <select
            id="dial"
            name="dial"
            defaultValue={PADRAO}
            aria-label={copy.phoneHint}
            className={field}
          >
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
            required
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={copy.phoneHint}
            className={field}
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="message" className="eyebrow text-fg-soft">
          {copy.message}
        </label>
        <textarea id="message" name="message" required rows={4} placeholder={copy.messageHint} className={field} />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="start" className="eyebrow text-fg-soft">
          {copy.start}
        </label>
        <select id="start" name="start" defaultValue="" className={field}>
          <option value="">{copy.startHint}</option>
          {copy.startOptions.map((opcao) => (
            <option key={opcao.value} value={opcao.value}>
              {opcao.label}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="brief" className="eyebrow text-fg-soft">
          {copy.brief}
        </label>
        <input
          id="brief"
          name="brief"
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
          className={`${field} file:mr-3 file:rounded-[4px] file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-paper`}
        />
        <span className="text-xs text-fg-soft">{copy.briefHint}</span>
      </div>
      <button type="submit" disabled={state === "sending"} className="btn w-fit disabled:opacity-40">
        {state === "sending" ? copy.sending : copy.submit} <span aria-hidden="true">→</span>
      </button>
      {state === "invalid" || state === "error" || state === "grande" ? (
        <p className="text-sm text-red-deep" role="alert">
          {state === "invalid" ? copy.invalid : state === "grande" ? copy.tooBig : copy.error}
        </p>
      ) : null}
    </form>
  );
}
