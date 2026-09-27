import type { SubscribeCopy } from "./SubscribeForm";

/**
 * Os textos do formulário, num sítio só.
 *
 * O mesmo formulário aparece na página de subscrição e no fim de cada artigo, e
 * os dois precisam da mesma lista de palavras. Sem isto, era copiar catorze
 * chaves duas vezes — e ao fim de um mês estavam diferentes.
 */
export function copyDaSubscricao(t: (chave: string, valores?: Record<string, string>) => string): SubscribeCopy {
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
    // O email só se sabe no browser, depois de escrito: o `{email}` passa
    // intacto e é o formulário que o preenche. Pedido sem valor, o next-intl
    // dava erro de formatação em cada página com o formulário.
    sentBody: t("sentBody", { email: "{email}" }),
    erros: {
      email: t("erros.email"),
      emailInvalid: t("erros.emailInvalid"),
      consent: t("erros.consent"),
      geral: t("erros.geral"),
    },
  };
}
