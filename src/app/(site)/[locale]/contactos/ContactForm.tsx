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
  erros: {
    name: string;
    company: string;
    email: string;
    emailInvalid: string;
    phone: string;
    phoneShort: string;
    message: string;
  };
  sent: string;
  sentBody: string;
  error: string;
  tooBig: string;
};

/** Quatro megabytes: é o que o servidor recebe num pedido. */
const LIMITE = 4_000_000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function ContactForm({ copy }: { copy: Copy }) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "grande">("idle");
  const [nome, setNome] = useState("");
  /*
   * Um erro por campo, e não um aviso no fim a dizer que falta alguma coisa.
   * Estava genérico — «Preencha o nome, a empresa, o telefone…» — e quem
   * esqueceu um campo tinha de o encontrar sozinho num formulário de sete
   * perguntas. Agora cada campo diz o que lhe falta, o primeiro em falta recebe
   * o foco (no telefone é a diferença entre ver o aviso e não ver), e a marca
   * desaparece à primeira letra que se escreve nele.
   */
  const [erros, setErros] = useState<Record<string, string>>({});
  const aviso = useRef<HTMLParagraphElement>(null);
  const forma = useRef<HTMLFormElement>(null);

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

    const falta: Record<string, string> = {};
    if (!valores.name) falta.name = copy.erros.name;
    if (!valores.company) falta.company = copy.erros.company;
    if (!valores.email) falta.email = copy.erros.email;
    else if (!EMAIL.test(valores.email)) falta.email = copy.erros.emailInvalid;
    if (!valores.phone) falta.phone = copy.erros.phone;
    else if (digitos < 6) falta.phone = copy.erros.phoneShort;
    if (!valores.message) falta.message = copy.erros.message;

    if (Object.keys(falta).length) {
      setErros(falta);
      // A ordem é a do formulário, não a do objecto: quem lê de cima para baixo
      // espera ir para o primeiro campo que falta, não para o primeiro que o
      // código verificou.
      const primeiro = ["name", "company", "email", "phone", "message"].find((campo) => falta[campo]);
      if (primeiro) {
        const alvo = forma.current?.querySelector<HTMLElement>(`[name="${primeiro}"]`);
        alvo?.focus();
        alvo?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setErros({});

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
  // `w-full min-w-0`: um `input` traz uma largura própria de umas vinte letras,
  // e numa grelha isso é um mínimo que a célula não aperta — o campo do número
  // passava por cima do indicativo em ecrãs estreitos.
  const field =
    "w-full min-w-0 rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-xs outline-none transition-colors duration-200 placeholder:text-ink/45 focus:border-red";

  /** O campo em falta: contorno vermelho, e um fio vermelho por dentro. */
  const marca = (campo: string) =>
    erros[campo] ? `${field} border-red shadow-[inset_0_0_0_1px_var(--color-red)]` : field;

  /* A mensagem sai em coral e não em vermelho: sobre a tinta desta secção, o
     vermelho da marca fica em 4:1 e o coral em 9:1 — e um aviso que não se lê
     não é um aviso. */
  const recado = (campo: string) =>
    erros[campo] ? (
      <p id={`erro-${campo}`} className="text-xs text-coral" role="alert">
        {erros[campo]}
      </p>
    ) : null;

  /** Ao escrever, a marca sai: o erro é de quando se enviou, não de agora. */
  const limpa = (campo: string) =>
    setErros((atual) => {
      if (!atual[campo]) return atual;
      const { [campo]: _, ...resto } = atual;
      return resto;
    });

  return (
    <form ref={forma} onSubmit={onSubmit} className="grid gap-4" noValidate>
      <div className="grid gap-1.5">
        <label htmlFor="name" className="eyebrow text-fg-soft">
          {copy.name}
        </label>
        <input id="name" name="name" required autoComplete="name" className={marca("name")}
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
        <input id="company" name="company" required autoComplete="organization" className={marca("company")}
          aria-invalid={Boolean(erros.company)}
          aria-describedby={erros.company ? "erro-company" : undefined}
          onInput={() => limpa("company")}
        />
        {recado("company")}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="email" className="eyebrow text-fg-soft">
          {copy.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={marca("email")}
          aria-invalid={Boolean(erros.email)}
          aria-describedby={erros.email ? "erro-email" : undefined}
          onInput={() => limpa("email")}
        />
        {recado("email")}
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
            className={marca("phone")}
            aria-invalid={Boolean(erros.phone)}
            aria-describedby={erros.phone ? "erro-phone" : undefined}
            onInput={() => limpa("phone")}
          />
        </div>
        {recado("phone")}
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="message" className="eyebrow text-fg-soft">
          {copy.message}
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={4}
          placeholder={copy.messageHint}
          className={marca("message")}
          aria-invalid={Boolean(erros.message)}
          aria-describedby={erros.message ? "erro-message" : undefined}
          onInput={() => limpa("message")}
        />
        {recado("message")}
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
      {/* A pastilha da casa, e não o botão vermelho de cantos redondos que veio
          do site antigo. Esta página é tinta, por isso leva a pílula de papel —
          a que acende a vermelho ao passar o rato. */}
      <button type="submit" disabled={state === "sending"} className="btn-pill w-fit disabled:opacity-40">
        {state === "sending" ? copy.sending : copy.submit} <span aria-hidden="true">→</span>
      </button>
      {/* Só o que não é de um campo: o ficheiro grande demais e a falha de rede.
          O que falta preencher diz-se onde falta. */}
      {state === "error" || state === "grande" ? (
        <p className="text-sm text-coral" role="alert">
          {state === "grande" ? copy.tooBig : copy.error}
        </p>
      ) : null}
    </form>
  );
}
