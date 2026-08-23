"use client";

import { useEffect, useRef, useState } from "react";
import { INDICATIVOS, PADRAO, rotulo } from "@/lib/indicativos";
import type { FormCopy } from "./copy";

/** Uma pergunta da vaga, já na língua de quem lê. */
export type Pergunta = {
  type: "escolha" | "varias" | "curto" | "longo" | "numero";
  required: boolean;
  label: string;
  options: string[];
};

/** Quatro megabytes: é o que o servidor recebe num pedido. */
const LIMITE = 4_000_000;

/**
 * O formulário de candidatura, um só para os dois casos.
 *
 * Com vaga (`jobSlug`), faz as perguntas próprias dela e não pergunta áreas — a
 * área vem da vaga. Sem vaga, é espontânea: pergunta em que áreas a pessoa
 * trabalha, que é a única forma de a encontrar quando abrir algo.
 *
 * Trata por «tu», ao contrário do resto do site: a casa fala com o cliente por
 * «você» e com quem se candidata por «tu».
 */
export function ApplicationForm({
  copy,
  departments = [],
  jobSlug,
  jobTitle,
  questions = [],
}: {
  copy: FormCopy;
  departments?: { slug: string; label: string }[];
  jobSlug?: string;
  jobTitle?: string;
  questions?: Pergunta[];
}) {
  const [estado, setEstado] = useState<
    "parado" | "a-enviar" | "enviado" | "erro" | "invalido" | "grande" | "consentimento" | "cv-recusado"
  >("parado");
  const [nome, setNome] = useState("");
  const aviso = useRef<HTMLParagraphElement>(null);

  // Depois de enviar, a confirmação ficava fora do ecrã num formulário deste
  // tamanho: quem carregou em enviar não via nada acontecer.
  useEffect(() => {
    if (estado === "enviado") aviso.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [estado]);

  async function submeter(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const dados = new FormData(evento.currentTarget);

    const valor = (chave: string) => String(dados.get(chave) ?? "").trim();
    const digitos = valor("phone").replace(/\D/g, "").length;
    const cv = dados.get("cv");

    if (!dados.get("consent")) {
      setEstado("consentimento");
      return;
    }
    if (
      !valor("name") ||
      digitos < 6 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor("email")) ||
      !(cv instanceof File && cv.size > 0)
    ) {
      setEstado("invalido");
      return;
    }
    for (const ficheiro of [dados.get("cv"), dados.get("letter")]) {
      if (ficheiro instanceof File && ficheiro.size > LIMITE) {
        setEstado("grande");
        return;
      }
    }

    setNome(valor("name").split(/\s+/)[0] ?? "");
    setEstado("a-enviar");
    try {
      const resposta = await fetch("/api/candidatura", { method: "POST", body: dados });
      // 415 é o servidor a dizer que o ficheiro não serve — outra mensagem, e
      // outra acção da parte de quem se candidata.
      setEstado(resposta.ok ? "enviado" : resposta.status === 415 ? "cv-recusado" : "erro");
    } catch {
      setEstado("erro");
    }
  }

  if (estado === "enviado") {
    return (
      <p ref={aviso} className="rounded-[20px] border-l-2 border-chartreuse bg-white p-6 text-md text-ink" role="status">
        <span className="block font-display text-xl leading-tight text-ink">{copy.sent.replace("{nome}", nome)}</span>
        <span className="mt-3 block text-md text-ink/70">{copy.sentBody}</span>
      </p>
    );
  }

  // A caixa é branca sobre a secção escura: a cor do texto é desta caixa, não da
  // secção onde ela está.
  const campo =
    "rounded-[4px] border border-line bg-white px-3.5 py-3 text-sm text-ink shadow-xs outline-none transition-colors duration-200 placeholder:text-ink/45 focus:border-red";
  const etiqueta = "eyebrow text-fg-soft";

  return (
    <form onSubmit={submeter} className="grid gap-4" noValidate>
      {jobSlug ? <input type="hidden" name="job" value={jobSlug} /> : null}
      {jobTitle ? <input type="hidden" name="jobTitle" value={jobTitle} /> : null}

      <div className="grid gap-1.5">
        <label htmlFor="c-name" className={etiqueta}>
          {copy.name}
        </label>
        <input id="c-name" name="name" required autoComplete="name" className={campo} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="c-email" className={etiqueta}>
          {copy.email}
        </label>
        <input id="c-email" name="email" type="email" required autoComplete="email" className={campo} />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="c-phone" className={etiqueta}>
          {copy.phone}
        </label>
        <div className="grid grid-cols-[minmax(0,11rem)_minmax(0,1fr)] gap-2">
          <select id="c-dial" name="dial" defaultValue={PADRAO} aria-label={copy.phone} className={campo}>
            {INDICATIVOS.map((indicativo) => (
              <option key={indicativo.iso} value={indicativo.iso}>
                {rotulo(indicativo)}
              </option>
            ))}
          </select>
          <input
            id="c-phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={copy.phoneHint}
            className={campo}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="c-city" className={etiqueta}>
            {copy.city}
          </label>
          <input id="c-city" name="city" autoComplete="address-level2" className={campo} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="c-country" className={etiqueta}>
            {copy.country}
          </label>
          <input id="c-country" name="country" defaultValue="Portugal" autoComplete="country-name" className={campo} />
        </div>
      </div>

      {/* Sem vaga, a área é o que diz onde a pessoa se encaixa. Com vaga, vem
          dela e não se pergunta. */}
      {!jobSlug && departments.length ? (
        <fieldset className="grid gap-2">
          <legend className={etiqueta}>{copy.areas}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {departments.map((area) => (
              <label key={area.slug} className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" name="departments" value={area.slug} className="accent-red" />
                {area.label}
              </label>
            ))}
          </div>
          <span className="text-xs text-fg-soft">{copy.areasHint}</span>
        </fieldset>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="c-experience" className={etiqueta}>
            {copy.experience}
          </label>
          <select id="c-experience" name="experienceYears" defaultValue="" className={campo}>
            <option value="">{copy.experienceHint}</option>
            {copy.experienceOptions.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="c-contract" className={etiqueta}>
            {copy.contractWanted}
          </label>
          <select id="c-contract" name="contractWanted" defaultValue="" className={campo}>
            <option value="">{copy.contractHint}</option>
            {copy.contractOptions.map((opcao) => (
              <option key={opcao.value} value={opcao.value}>
                {opcao.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <label htmlFor="c-linkedin" className={etiqueta}>
            {copy.linkedin}
          </label>
          <input id="c-linkedin" name="linkedin" inputMode="url" className={campo} />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="c-portfolio" className={etiqueta}>
            {copy.portfolio}
          </label>
          <input id="c-portfolio" name="portfolio" inputMode="url" className={campo} />
        </div>
      </div>

      {/* As perguntas da vaga, tal como quem a escreveu as fez. */}
      {questions.length ? (
        <fieldset className="mt-2 grid gap-4 border-t border-line/40 pt-6">
          <legend className={`${etiqueta} px-0`}>{copy.questions}</legend>
          {questions.map((pergunta, indice) => {
            const id = `q-${indice}`;
            const nomeCampo = `q${indice}`;
            return (
              <div key={id} className="grid gap-1.5">
                <label htmlFor={id} className={etiqueta}>
                  {pergunta.label}
                </label>
                <input type="hidden" name={`${nomeCampo}-label`} value={pergunta.label} />

                {pergunta.type === "escolha" ? (
                  <select id={id} name={nomeCampo} required={pergunta.required} defaultValue="" className={campo}>
                    <option value="">{copy.pickOne}</option>
                    {pergunta.options.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                ) : pergunta.type === "varias" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {pergunta.options.map((opcao) => (
                      <label key={opcao} className="flex items-center gap-2 text-sm text-fg">
                        <input type="checkbox" name={nomeCampo} value={opcao} className="accent-red" />
                        {opcao}
                      </label>
                    ))}
                  </div>
                ) : pergunta.type === "longo" ? (
                  <textarea id={id} name={nomeCampo} required={pergunta.required} rows={4} className={campo} />
                ) : (
                  <input
                    id={id}
                    name={nomeCampo}
                    type={pergunta.type === "numero" ? "number" : "text"}
                    required={pergunta.required}
                    className={campo}
                  />
                )}
              </div>
            );
          })}
        </fieldset>
      ) : null}

      <div className="grid gap-1.5">
        <label htmlFor="c-cv" className={etiqueta}>
          {copy.cv}
        </label>
        <input
          id="c-cv"
          name="cv"
          type="file"
          required
          accept=".pdf,.doc,.docx"
          className={`${campo} file:mr-3 file:rounded-[4px] file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-paper`}
        />
        <span className="text-xs text-fg-soft">{copy.cvHint}</span>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="c-letter" className={etiqueta}>
          {copy.letter}
        </label>
        <input
          id="c-letter"
          name="letter"
          type="file"
          accept=".pdf,.doc,.docx"
          className={`${campo} file:mr-3 file:rounded-[4px] file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-semibold file:uppercase file:tracking-[0.08em] file:text-paper`}
        />
        <span className="text-xs text-fg-soft">{copy.letterHint}</span>
      </div>

      {/* Dois consentimentos separados, como tem de ser: guardar a candidatura é
          uma coisa, mandar comunicações é outra. */}
      <label className="mt-2 flex items-start gap-3 text-sm text-fg">
        <input type="checkbox" name="consent" required className="mt-1 accent-red" />
        {copy.consent}
      </label>
      <label className="flex items-start gap-3 text-sm text-fg-soft">
        <input type="checkbox" name="newsletter" className="mt-1 accent-red" />
        {copy.newsletter}
      </label>

      <button type="submit" disabled={estado === "a-enviar"} className="btn mt-2 w-fit disabled:opacity-40">
        {estado === "a-enviar" ? copy.sending : copy.submit} <span aria-hidden="true">→</span>
      </button>

      {estado !== "parado" && estado !== "a-enviar" ? (
        <p className="text-sm text-coral" role="alert">
          {estado === "invalido"
            ? copy.invalid
            : estado === "grande"
              ? copy.tooBig
              : estado === "consentimento"
                ? copy.needConsent
                : estado === "cv-recusado"
                  ? copy.cvRejected
                  : copy.error}
        </p>
      ) : null}
    </form>
  );
}
