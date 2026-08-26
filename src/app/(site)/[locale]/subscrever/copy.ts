import type { SubscribeCopy } from "./SubscribeForm";

/**
 * Os textos do formulário, num sítio só.
 *
 * O mesmo formulário aparece na página de subscrição e no fim de cada artigo, e
 * os dois precisam da mesma lista de palavras. Sem isto, era copiar catorze
 * chaves duas vezes — e ao fim de um mês estavam diferentes.
 */
export function copyDaSubscricao(t: (chave: string) => string): SubscribeCopy {
  return {
    email: t("email"),
    emailHint: t("emailHint"),
    lingua: t("lingua"),
    trocar: t("trocar"),
    linguaOutra: t("linguaOutra"),
    voltar: t("voltar"),
    consent: t("consent"),
    submit: t("submit"),
    sending: t("sending"),
    sent: t("sent"),
    sentBody: t("sentBody"),
    erros: {
      email: t("erros.email"),
      emailInvalid: t("erros.emailInvalid"),
      consent: t("erros.consent"),
      geral: t("erros.geral"),
    },
  };
}
