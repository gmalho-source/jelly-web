import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";

/**
 * Os textos do formulário, num sítio só.
 *
 * O formulário é do cliente e não pode ir buscar traduções: o `next-intl` do
 * servidor não atravessa a fronteira. Passam-se em propriedades, e como as duas
 * páginas — a lista e a vaga — usam o mesmo formulário, a montagem fica aqui em
 * vez de escrita duas vezes.
 */
export async function formCopy(locale: Locale) {
  const t = await getTranslations({ locale, namespace: "careers" });
  const opcoes = (grupo: string, chaves: string[]) =>
    chaves.map((chave) => ({ value: chave, label: t(`${grupo}.${chave}`) }));

  return {
    essentials: t("essentials"),
    areas: t("areas"),
    areasHint: t("areasHint"),
    name: t("name"),
    email: t("email"),
    phone: t("phone"),
    phoneHint: t("phoneHint"),
    city: t("city"),
    country: t("country"),
    linkedin: t("linkedin"),
    portfolio: t("portfolio"),
    experience: t("experience"),
    experienceHint: t("experienceHint"),
    experienceOptions: opcoes("experienceOptions", [
      "nenhuma",
      "menos-de-um",
      "um-dois",
      "tres-cinco",
      "mais-de-cinco",
    ]),
    contractWanted: t("contractWanted"),
    contractHint: t("contractHint"),
    contractOptions: opcoes("contractOptions", ["contrato", "estagio", "freelancer"]),
    cv: t("cv"),
    cvHint: t("cvHint"),
    cvRejected: t("cvRejected"),
    letter: t("letter"),
    letterHint: t("letterHint"),
    questions: t("questions"),
    pickOne: t("pickOne"),
    consent: t("consent"),
    newsletter: t("newsletter"),
    submit: t("submit"),
    sending: t("sending"),
    sent: t("sent"),
    sentBody: t("sentBody"),
    error: t("error"),
    tooBig: t("tooBig"),
    // O que falta, campo a campo. O aviso genérico («invalid», «needConsent»)
    // deixou de servir: dizia que faltava alguma coisa num formulário de vinte
    // perguntas e mandava a pessoa procurá-la.
    erros: {
      name: t("erros.name"),
      email: t("erros.email"),
      emailInvalid: t("erros.emailInvalid"),
      phone: t("erros.phone"),
      phoneShort: t("erros.phoneShort"),
      cv: t("erros.cv"),
      question: t("erros.question"),
      consent: t("erros.consent"),
      tooBig: t("erros.tooBig"),
    },
  };
}

export type FormCopy = Awaited<ReturnType<typeof formCopy>>;
