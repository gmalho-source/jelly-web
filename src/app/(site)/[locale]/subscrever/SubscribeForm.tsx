"use client";

import { useState } from "react";

export type SubscribeCopy = {
  email: string;
  emailHint: string;
  lingua: string;
  trocar: string;
  linguaOutra: string;
  voltar: string;
  consent: string;
  submit: string;
  sending: string;
  sent: string;
  sentBody: string;
  erros: { email: string; emailInvalid: string; consent: string; geral: string };
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * A subscrição das comunicações: um campo, uma autorização, um botão.
 *
 * A língua não se pergunta — vem da página onde a pessoa está. Mostra-se numa
 * linha, com a troca ao lado para quem quiser outra coisa: é uma afirmação que
 * se pode contrariar, não uma pergunta que obriga a decidir.
 *
 * O mesmo componente serve a página de subscrição e o fim de cada artigo. Muda
 * a `origem`, que é o que depois diz, no Brevo, por onde é que cada pessoa
 * entrou.
 */
export function SubscribeForm({
  copy,
  lingua,
  origem,
  compacto = false,
  superficie = "tinta",
}: {
  copy: SubscribeCopy;
  lingua: "pt" | "en";
  origem: string;
  compacto?: boolean;
  /** Onde é que este formulário está pousado: a pastilha muda com o fundo. */
  superficie?: "tinta" | "papel";
}) {
  const [estado, setEstado] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [escolhida, setEscolhida] = useState<"pt" | "en">(lingua);
  const [email, setEmail] = useState("");
  const [erros, setErros] = useState<Record<string, string>>({});

  const field =
    "w-full min-w-0 rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-xs outline-none transition-colors duration-200 placeholder:text-ink/45 focus:border-red";

  const envia = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);
    const escrito = String(dados.get("email") ?? "").trim();

    const falta: Record<string, string> = {};
    if (!escrito) falta.email = copy.erros.email;
    else if (!EMAIL.test(escrito)) falta.email = copy.erros.emailInvalid;
    if (!dados.get("consent")) falta.consent = copy.erros.consent;
    setErros(falta);
    if (Object.keys(falta).length) return;

    setEstado("sending");
    setEmail(escrito);
    try {
      const resposta = await fetch("/api/subscrever", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: escrito,
          consent: true,
          lingua: escolhida,
          origem,
          empresa: String(dados.get("empresa") ?? ""),
        }),
      });
      if (!resposta.ok) throw new Error(String(resposta.status));
      setEstado("sent");
    } catch {
      setEstado("error");
      setErros({ geral: copy.erros.geral });
    }
  };

  if (estado === "sent") {
    return (
      <div className="rounded-[6px] border border-line bg-white p-6 text-ink">
        <p className="text-lg font-semibold">{copy.sent}</p>
        <p className="mt-2 text-sm text-ink/70">{copy.sentBody.replace("{email}", email)}</p>
      </div>
    );
  }

  return (
    <form onSubmit={envia} noValidate className={compacto ? "grid gap-4" : "grid gap-5"}>
      <div className="grid gap-1.5">
        <label htmlFor={`email-${origem}`} className="eyebrow text-fg-soft">
          {copy.email}
        </label>
        <input
          id={`email-${origem}`}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          aria-describedby={erros.email ? `erro-email-${origem}` : undefined}
          onInput={() => setErros((atual) => ({ ...atual, email: "" }))}
          className={erros.email ? `${field} border-red shadow-[inset_0_0_0_1px_var(--color-red)]` : field}
        />
        {erros.email ? (
          <p id={`erro-email-${origem}`} className="text-xs text-coral" role="alert">
            {erros.email}
          </p>
        ) : (
          <p className="text-xs text-fg-soft">{copy.emailHint}</p>
        )}
      </div>

      {/* A armadilha. Fora do ecrã e fora do foco: quem a preenche não é gente. */}
      <input
        type="text"
        name="empresa"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />

      {/* Uma afirmação que se pode contrariar, não uma pergunta que obriga. */}
      <p className="text-xs text-fg-soft">
        {escolhida === lingua ? copy.lingua : copy.linguaOutra}{" "}
        <button
          type="button"
          onClick={() => setEscolhida((atual) => (atual === "pt" ? "en" : "pt"))}
          className="underline decoration-1 underline-offset-2 hover:no-underline"
        >
          {escolhida === lingua ? copy.trocar : copy.voltar}
        </button>
      </p>

      <div className="grid gap-1.5">
        <label className="flex items-start gap-3 text-sm text-fg-soft">
          <input
            type="checkbox"
            name="consent"
            className="mt-1 accent-red"
            onChange={() => setErros((atual) => ({ ...atual, consent: "" }))}
          />
          {copy.consent}
        </label>
        {erros.consent ? (
          <p className="text-xs text-coral" role="alert">
            {erros.consent}
          </p>
        ) : null}
      </div>

      {/* Sobre papel, a pastilha cor de papel desaparece — é o aviso que está
          escrito no próprio CSS, e foi o que aconteceu no fim do artigo. */}
      <button
        type="submit"
        disabled={estado === "sending"}
        className={`btn-pill w-fit disabled:opacity-40 ${superficie === "papel" ? "btn-pill-ink" : ""}`}
      >
        {estado === "sending" ? copy.sending : copy.submit}
      </button>
      {erros.geral ? (
        <p className="text-xs text-coral" role="alert">
          {erros.geral}
        </p>
      ) : null}
    </form>
  );
}
