import { papel, p, botao, escapa, CASA } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * A carta que confirma a subscrição das comunicações.
 *
 * É curta de propósito: quem acabou de escrever o email numa página não quer
 * ler nada, quer carregar num botão. Tudo o que não seja o botão e a razão de
 * ele existir sai daqui.
 *
 * Trata por «tu», como o resto do que sai para fora da relação comercial.
 */
export type PedidoDeSubscricao = { locale: "pt" | "en"; endereco: string; dias: number };

const T = {
  pt: {
    assunto: "Confirma a subscrição",
    antevisao: "Falta um clique.",
    sobretitulo: "Comunicações Jelly",
    cabeca: "Falta um clique.",
    corpo:
      "Pediste para receber as comunicações da Jelly. Carrega no botão para confirmar que este email é mesmo teu — é a única forma de termos a certeza de que não foi outra pessoa a escrevê-lo.",
    botao: "Confirmar subscrição",
    prazo: (dias: number) => `O link vale ${dias} dias.`,
    naoFui:
      "Se não foste tu, não faças nada: sem esta confirmação não guardamos o teu email em lado nenhum, e não voltas a ter notícias nossas.",
    assina: "Até breve,<br>Equipa Jelly",
  },
  en: {
    assunto: "Confirm your subscription",
    antevisao: "One click to go.",
    sobretitulo: "Jelly communications",
    cabeca: "One click to go.",
    corpo:
      "You asked to receive Jelly's communications. Press the button to confirm this email is really yours — it is the only way we can be sure someone else did not type it.",
    botao: "Confirm subscription",
    prazo: (dias: number) => `The link stands for ${dias} days.`,
    naoFui:
      "If this was not you, do nothing: without this confirmation we keep your email nowhere, and you will not hear from us again.",
    assina: "Talk soon,<br>Jelly team",
  },
} as const;

export function cartaDeSubscricao({ locale, endereco, dias }: PedidoDeSubscricao) {
  const t = T[locale];

  const corpo = [
    p(escapa(t.corpo)),
    botao(endereco, t.botao),
    p(escapa(t.prazo(dias)), "26px 0 18px"),
    p(escapa(t.naoFui)),
    p(t.assina, "26px 0 0"),
  ].join("\n");

  const html = papel({
    locale,
    titulo: t.assunto,
    antevisao: t.antevisao,
    sobretitulo: t.sobretitulo,
    cabeca: t.cabeca,
    corpo,
  });

  const texto = [
    t.corpo,
    "",
    endereco,
    "",
    t.prazo(dias),
    t.naoFui,
    "",
    locale === "pt" ? "Até breve,\nEquipa Jelly" : "Talk soon,\nJelly team",
    "",
    "—",
    `${CASA.legal} · VAT ${CASA.vat}`,
    SITE_URL,
  ].join("\n");

  return { subject: t.assunto, html, text: texto };
}
