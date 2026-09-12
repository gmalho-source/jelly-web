import { papel, p, recibo, escapa, botao, CASA } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * As duas cartas de uma subscrição do JellyCARE.
 *
 * Podia reaproveitar-se as da página de contactos, e esteve para ser assim. Não
 * serve: aquelas falam de «briefing recebido» e de «janela de arranque», e quem
 * acaba de escolher um plano de 75 € por mês não enviou um briefing nenhum.
 * São poucas linhas a mais e dizem a coisa certa.
 */

export type Subscricao = {
  nome: string;
  empresa: string;
  email: string;
  /** Já com o indicativo à frente, ou vazio. */
  telefone: string;
  /** O nome do plano como o painel o escreve. */
  plano: string;
  site: string;
  infetado: boolean;
  notas: string;
  /** O registo na base, para se abrir no painel. */
  mensagemId?: string | number;
};

/** O aviso à casa. */
export function avisoDeSubscricao({ nome, empresa, email, telefone, plano, site, infetado, notas, mensagemId }: Subscricao) {
  const urgente = infetado ? " · SITE INFETADO" : "";
  const assunto = `JellyCARE: ${plano} para ${site}${urgente}`;

  const corpo = [
    infetado
      ? p(
          `<strong style="color:#dd364a">Marcou o site como infetado com malware.</strong> Vale a pena olhar para ele antes de responder.`,
        )
      : "",
    recibo(
      "Quem subscreveu",
      [
        { rotulo: "Plano", valor: plano },
        { rotulo: "Website", valor: site },
        { rotulo: "Nome", valor: nome },
        { rotulo: "Empresa", valor: empresa },
        { rotulo: "Email", valor: email },
        { rotulo: "Telefone", valor: telefone },
      ],
      notas,
    ),
    mensagemId ? botao(`${SITE_URL}/admin/collections/messages/${mensagemId}`, "Ver no painel") : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = papel({
    locale: "pt",
    titulo: assunto,
    antevisao: `${plano} · ${site}`,
    sobretitulo: "Subscrição JellyCARE",
    cabeca: assunto,
    corpo,
    rodape: "interno",
  });

  const texto = [
    assunto,
    "",
    `Plano: ${plano}`,
    `Website: ${site}`,
    infetado ? "O site está marcado como infetado." : "",
    `Nome: ${nome}`,
    empresa ? `Empresa: ${empresa}` : "",
    `Email: ${email}`,
    telefone ? `Telefone: ${telefone}` : "",
    notas ? `\nNotas: ${notas}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return { subject: assunto, html, text: texto };
}

const T = {
  pt: {
    assunto: (nome: string) => `Recebemos a sua subscrição, ${nome}`,
    antevisao: "Vamos olhar para o site e voltamos com os próximos passos.",
    sobretitulo: "Subscrição JellyCARE",
    cabeca: "Vamos tratar do seu site.",
    saudacao: (nome: string) => `Olá ${nome},`,
    chegou:
      "recebemos o seu pedido de subscrição do JellyCARE. Antes de responder vamos olhar para o site, para lhe dizermos com o que contamos encontrar e a partir de quando começamos.",
    recibo: "O que escolheu",
    plano: "Plano",
    site: "Website",
    empresa: "Empresa",
    telefone: "Telefone",
    infetado: "Site infetado",
    sim: "assinalou que sim — vamos olhar para isso primeiro",
    semFidelizacao:
      "Não há fidelização: experimenta, recebe o relatório do primeiro mês, e decide depois. Os valores anunciados não incluem IVA.",
    acrescentar: "Se quiser acrescentar alguma coisa, responda a este email — chega à mesma equipa.",
    assina: "Até já,<br>Jelly",
  },
  en: {
    assunto: (nome: string) => `We have your subscription, ${nome}`,
    antevisao: "We'll look at the site and come back with the next steps.",
    sobretitulo: "JellyCARE subscription",
    cabeca: "We'll take care of your site.",
    saudacao: (nome: string) => `Hello ${nome},`,
    chegou:
      "we have your JellyCARE subscription request. Before replying we'll look at the site, so we can tell you what we expect to find and when we start.",
    recibo: "What you chose",
    plano: "Plan",
    site: "Website",
    empresa: "Company",
    telefone: "Phone",
    infetado: "Infected site",
    sim: "you flagged it — we'll look at that first",
    semFidelizacao:
      "There is no lock-in: try it, read the first month's report, and decide afterwards. Prices shown do not include VAT.",
    acrescentar: "If you want to add anything, just reply to this email — it reaches the same team.",
    assina: "Talk soon,<br>Jelly",
  },
} as const;

/** A confirmação a quem subscreveu. */
export function cartaDeSubscricaoCare({
  locale,
  nome,
  empresa,
  telefone,
  plano,
  site,
  infetado,
  notas,
}: Omit<Subscricao, "email" | "mensagemId"> & { locale: "pt" | "en" }) {
  const t = T[locale];
  const primeiro = nome.trim().split(/\s+/)[0] ?? nome;

  const corpo = [
    p(`${escapa(t.saudacao(primeiro))} ${escapa(t.chegou)}`),
    recibo(
      t.recibo,
      [
        { rotulo: t.plano, valor: plano },
        { rotulo: t.site, valor: site },
        { rotulo: t.empresa, valor: empresa },
        { rotulo: t.telefone, valor: telefone },
        ...(infetado ? [{ rotulo: t.infetado, valor: t.sim }] : []),
      ],
      notas,
    ),
    p(escapa(t.semFidelizacao)),
    p(escapa(t.acrescentar)),
    p(t.assina, "26px 0 0"),
  ].join("\n");

  const html = papel({
    locale,
    titulo: t.assunto(primeiro),
    antevisao: t.antevisao,
    sobretitulo: t.sobretitulo,
    cabeca: t.cabeca,
    corpo,
  });

  const texto = [
    t.cabeca,
    "",
    `${t.saudacao(primeiro)} ${t.chegou}`,
    "",
    `${t.plano}: ${plano}`,
    `${t.site}: ${site}`,
    notas ? `\n${notas}` : "",
    "",
    t.semFidelizacao,
    t.acrescentar,
    "",
    "Jelly",
    CASA.nome,
  ]
    .filter((linha) => linha !== undefined)
    .join("\n");

  return { subject: t.assunto(primeiro), html, text: texto };
}
