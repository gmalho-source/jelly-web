import type { CarePlan } from "@/content/types";

/**
 * A campanha de um plano, escrita.
 *
 * Vive aqui e não na página porque tem dois leitores: o cartão de preços, onde
 * a frase é curta e o preço normal aparece riscado ao lado, e os emails de
 * subscrição, onde não há riscado nenhum e é preciso dizer por extenso o que
 * fica para trás. Duas versões da mesma frase escritas em dois ficheiros
 * separavam-se ao primeiro acerto — e o sítio onde isso se nota é o email que
 * promete um desconto diferente do que a página anunciou.
 *
 * O painel pode escrever a frase à mão («dois meses oferecidos») ou limitar-se
 * a pôr o preço do primeiro mês. No segundo caso monta-se aqui.
 */

const T = {
  pt: {
    primeiro: (preco: string) => `Primeiro mês a ${preco}`,
    emVez: (preco: string) => `em vez de ${preco} por mês`,
    ate: (data: string) => `Campanha até ${data}.`,
  },
  en: {
    primeiro: (preco: string) => `First month at ${preco}`,
    emVez: (preco: string) => `instead of ${preco} a month`,
    ate: (data: string) => `Campaign runs until ${data}.`,
  },
} as const;

export function emEuros(valor: number, locale: "pt" | "en") {
  return new Intl.NumberFormat(locale === "pt" ? "pt-PT" : "en-GB", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(valor);
}

export type CampanhaEscrita = {
  /** Curta, para o cartão: «Primeiro mês a 45 €». */
  frase: string;
  /** Por extenso, para os emails e para o registo. */
  detalhe: string;
  /** O preço normal escrito, para quem o quiser riscar ao lado. */
  normal: string;
};

export function campanhaDe(plano: CarePlan, locale: "pt" | "en"): CampanhaEscrita | undefined {
  const campanha = plano.campaign;
  if (!campanha) return undefined;

  const t = T[locale];
  const normal = emEuros(plano.price, locale);
  const escrita = campanha.label?.[locale]?.trim();
  const primeiro = campanha.firstPrice !== undefined ? emEuros(campanha.firstPrice, locale) : undefined;

  const frase = escrita || (primeiro ? t.primeiro(primeiro) : "");
  if (!frase) return undefined;

  // A data vem em ISO curto e sai no formato de quem lê. Sem ela, a frase fica
  // como está: uma campanha sem fim anunciado é uma campanha sem fim anunciado.
  const data = campanha.until
    ? new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
        new Date(`${campanha.until}T12:00:00Z`),
      )
    : undefined;

  // «em vez de» só quando há um preço novo a comparar: numa campanha escrita à
  // mão, o que fica para trás pode não ser o preço mensal.
  const detalhe = [primeiro ? `${frase}, ${t.emVez(normal)}.` : `${frase}.`, data ? t.ate(data) : ""]
    .filter(Boolean)
    .join(" ");

  return { frase, detalhe, normal };
}
