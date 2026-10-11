import { CASA } from "@/lib/email-papel";
import type { Bloco } from "@/lib/assinaturas/pdf";

/**
 * A Autorização de Débito Direto SEPA (esquema CORE) que os clientes assinam.
 *
 * O texto é o do modelo que a Jelly usava, em português e em inglês, com os
 * elementos que o esquema exige e que o modelo não tinha: o identificador de
 * credor (ICS), a referência única da autorização e o tipo de pagamento. O
 * esquema CORE é o que dá ao devedor o reembolso em oito semanas — é o que o
 * texto promete.
 */
export const CREDOR = {
  nome: CASA.legal,
  nif: CASA.vat.replace(/^PT/, ""),
  morada: `${CASA.rua} - ${CASA.local.replace(" · ", " - ")}`,
  /** Identificador de Credor SEPA (ICS), atribuído pelo banco. */
  ics: "PT92ZZZ110989",
} as const;

export type DadosDoDevedor = {
  referencia: string;
  tipo: "nova" | "alteracao";
  empresa: string;
  nif: string;
  morada: string;
  iban: string;
  recorrente: boolean;
  signatarioNome: string;
  signatarioCargo: string;
};

/** PT50 0002 0123 … — o IBAN como se lê. */
export const ibanLegivel = (iban: string) => iban.replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();

/** Só o fim, para listas e emails: PT50 •••• 1234. */
export const ibanMascarado = (iban?: string | null) => {
  const limpo = (iban ?? "").replace(/\s/g, "");
  return limpo.length > 8 ? `${limpo.slice(0, 4)} •••• ${limpo.slice(-4)}` : "";
};

/** O IBAN com os dois algarismos de controlo certos (módulo 97). */
export function ibanCerto(iban: string): boolean {
  const limpo = iban.replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(limpo)) return false;
  if (limpo.startsWith("PT") && limpo.length !== 25) return false;
  const rodado = limpo.slice(4) + limpo.slice(0, 4);
  const numeros = rodado.replace(/[A-Z]/g, (letra) => String(letra.charCodeAt(0) - 55));
  let resto = 0;
  for (const algarismo of numeros) resto = (resto * 10 + Number(algarismo)) % 97;
  return resto === 1;
}

export function blocosDoDebito(d: DadosDoDevedor): Bloco[] {
  const p = (texto: string): Bloco => ({ t: "p", texto });
  const en = (texto: string): Bloco => ({ t: "p", texto, italico: true });
  const campo = (rotulo: string, valor: string): Bloco => ({ t: "campo", rotulo, valor });
  const nome = `${CREDOR.nome} (JELLY)`;

  return [
    { t: "titulo", texto: "Autorização de Débito Direto SEPA" },
    p(
      `Ao subscrever esta autorização, está a autorizar a ${nome} a enviar instruções ao seu Banco para debitar a sua conta e o seu Banco a debitar a sua conta, de acordo com as instruções da JELLY.`,
    ),
    p(
      "Os seus direitos incluem a possibilidade de exigir do seu Banco o reembolso do montante debitado, nos termos e condições acordados com o seu Banco. O reembolso deve ser solicitado até um prazo de oito semanas, a contar da data do débito na sua conta. Os seus direitos são explicados em declaração que pode obter no seu Banco.",
    ),
    { t: "espaco", altura: 6 },
    { t: "subtitulo", texto: "SEPA Direct Debit Mandate" },
    en(`By signing this mandate form, you authorise ${nome} to send instructions to your bank to debit your account and your bank to debit your account in accordance with the instructions from JELLY.`),
    en(
      "As part of your rights, you are entitled to a refund from your bank under the terms and conditions of your agreement with your bank. A refund must be claimed within 8 weeks starting from the date on which your account was debited. Your rights are explained in a statement that you can obtain from your bank.",
    ),

    { t: "subtitulo", texto: "Autorização / Mandate" },
    campo("Referência / Mandate reference", d.referencia),
    campo("Tipo / Type", d.tipo === "alteracao" ? "Alteração de autorização / Amendment" : "Nova autorização / New mandate"),
    campo("Pagamento / Payment type", d.recorrente ? "Recorrente / Recurrent" : "Pontual / One-off"),
    campo("Esquema / Scheme", "SEPA CORE"),

    { t: "subtitulo", texto: "Informação do Credor / Creditor information" },
    campo("Nome legal / Name", CREDOR.nome),
    campo("NIF / VAT number", CREDOR.nif),
    campo("Morada / Address", CREDOR.morada),
    campo("Identificador de credor / Creditor ID", CREDOR.ics),

    { t: "subtitulo", texto: "Devedor / Debtor" },
    campo("Empresa / Company", d.empresa),
    campo("NIF / VAT number", d.nif),
    campo("Morada / Address", d.morada),
    campo("IBAN", ibanLegivel(d.iban)),

    { t: "subtitulo", texto: "Assinatura / Signature" },
    campo("Nome / Name", d.signatarioNome),
    campo("Cargo / Position", d.signatarioCargo),
    p(
      "Quem assina declara ter poderes para obrigar a empresa acima identificada. Esta autorização é assinada eletronicamente; a data e a hora da assinatura constam do certificado de assinatura anexo.",
    ),
    en(
      "The signatory declares to be authorised to bind the company identified above. This mandate is signed electronically; the date and time of signature are shown in the attached signature certificate.",
    ),
  ];
}
