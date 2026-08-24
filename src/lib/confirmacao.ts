import { createHash, randomBytes } from "node:crypto";

/**
 * O pedido de confirmação: a terceira via.
 *
 * Uma candidatura que entra por um CV — carregado no painel ou reenviado por
 * email — tem dados que vieram de um documento, não da pessoa. Podem estar
 * errados, podem estar velhos, e o consentimento não existe. Esta é a peça que
 * resolve as três coisas de uma vez: um link enviado ao candidato, onde ele vê
 * o que temos, corrige o que estiver mal, e decide se autoriza que se guarde.
 *
 * O que vai no link é uma chave de trinta e dois bytes. O que fica guardado é o
 * resumo dela: quem puser os olhos na base de dados não fica com a chave da
 * porta de ninguém, e um resumo não se desfaz.
 *
 * Catorze dias. Um link de acesso a dados pessoais que dure para sempre é um
 * dado pessoal a mais espalhado pela caixa de correio de alguém.
 */
export const DIAS_DE_VALIDADE = 14;

export const chaveNova = () => randomBytes(32).toString("base64url");

export const resumoDaChave = (chave: string) => createHash("sha256").update(chave).digest("hex");

/** Ainda está de pé? */
export function aindaVale(enviadoEm: string | null | undefined): boolean {
  if (!enviadoEm) return false;
  const saiu = new Date(enviadoEm).getTime();
  if (Number.isNaN(saiu)) return false;
  return Date.now() - saiu < DIAS_DE_VALIDADE * 24 * 60 * 60 * 1000;
}

/** O endereço que vai na carta. PT na raiz, EN prefixado — como o resto do site. */
export function enderecoDaConfirmacao(base: string, chave: string, locale: "pt" | "en") {
  const raiz = base.replace(/\/$/, "");
  return locale === "en"
    ? `${raiz}/en/confirm-application/${chave}`
    : `${raiz}/confirmar-candidatura/${chave}`;
}
