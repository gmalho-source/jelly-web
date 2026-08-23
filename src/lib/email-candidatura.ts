import { papel, p, recibo, escapa, botao, CASA } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * As duas cartas de uma candidatura: a que confirma a quem se candidatou, e a
 * que avisa a casa.
 *
 * A primeira trata por «tu» — é a única parte do site que fala assim, e é de
 * propósito: a casa trata o cliente por «você» e o talento por «tu».
 *
 * Não promete prazo e não promete resultado. Diz o que vai acontecer: alguém vai
 * ler. Uma confirmação que promete «resposta em 5 dias» é uma dívida que se
 * assume sem saber quantas candidaturas vão entrar.
 */

export type Candidatura = {
  locale: "pt" | "en";
  nome: string;
  email: string;
  telefone: string;
  vaga?: string;
  areas: string[];
  cidade: string;
  experiencia: string;
  temCarta: boolean;
  respostas: { question: string; answer: string }[];
  /** O registo no painel, para o aviso interno. */
  registoId?: string | number;
  /** Endereço do CV, protegido por sessão. */
  cvUrl?: string;
};

const T = {
  pt: {
    assunto: (vaga?: string) => (vaga ? `Recebemos a tua candidatura a ${vaga}` : "Recebemos a tua candidatura"),
    antevisao: "Está registada. Vamos ler tudo o que nos enviaste.",
    sobretitulo: "Candidatura recebida",
    cabeca: "Está registada.",
    corpo: (nome: string, vaga?: string) =>
      `Olá ${nome}, recebemos a tua candidatura${vaga ? ` a ${vaga}` : ""}. Vamos ler tudo o que nos enviaste — e lemos mesmo, não é uma triagem automática.`,
    recibo: "O que nos enviaste",
    vaga: "Vaga",
    areas: "Áreas",
    telefone: "Telefone",
    cidade: "Cidade",
    experiencia: "Experiência",
    carta: "Carta de motivação",
    cartaSim: "recebemos",
    espontanea: "Candidatura espontânea",
    guardamos:
      "Guardamos a tua candidatura durante doze meses, como autorizaste, e voltamos a olhar para ela quando abrir uma vaga próxima do teu perfil. Se quiseres que a apaguemos antes disso, responde a este email e fica feito no mesmo dia.",
    acrescentar: "Se quiseres acrescentar alguma coisa, responde a este email.",
    assina: "Até breve,<br>Equipa Jelly",
  },
  en: {
    assunto: (vaga?: string) => (vaga ? `We have your application for ${vaga}` : "We have your application"),
    antevisao: "It is on file. We will read everything you sent.",
    sobretitulo: "Application received",
    cabeca: "It is on file.",
    corpo: (nome: string, vaga?: string) =>
      `Hello ${nome}, we have your application${vaga ? ` for ${vaga}` : ""}. We will read everything you sent — and we mean read, not an automated screen.`,
    recibo: "What you sent us",
    vaga: "Role",
    areas: "Areas",
    telefone: "Phone",
    cidade: "City",
    experiencia: "Experience",
    carta: "Cover letter",
    cartaSim: "received",
    espontanea: "Speculative application",
    guardamos:
      "We keep your application for twelve months, as you allowed, and we look at it again when something close to your profile opens up. If you want it deleted before that, reply to this email and it is done the same day.",
    acrescentar: "If there is anything you want to add, just reply to this email.",
    assina: "Talk soon,<br>Jelly team",
  },
} as const;

/** A carta para quem se candidatou. */
export function cartaDeCandidatura(dados: Candidatura) {
  const t = T[dados.locale];
  const primeiro = dados.nome.trim().split(/\s+/)[0] ?? dados.nome;
  const assunto = t.assunto(dados.vaga);

  const corpo = [
    p(escapa(t.corpo(primeiro, dados.vaga))),
    recibo(
      t.recibo,
      [
        { rotulo: t.vaga, valor: dados.vaga ?? t.espontanea },
        { rotulo: t.areas, valor: dados.areas.join(", ") },
        { rotulo: t.telefone, valor: dados.telefone },
        { rotulo: t.cidade, valor: dados.cidade },
        { rotulo: t.experiencia, valor: dados.experiencia },
        { rotulo: t.carta, valor: dados.temCarta ? t.cartaSim : "" },
      ],
      "",
    ),
    p(escapa(t.guardamos)),
    p(escapa(t.acrescentar)),
    p(t.assina, "26px 0 0"),
  ].join("\n");

  const html = papel({
    locale: dados.locale,
    titulo: assunto,
    antevisao: t.antevisao,
    sobretitulo: t.sobretitulo,
    cabeca: t.cabeca,
    corpo,
  });

  const texto = [
    t.corpo(primeiro, dados.vaga),
    "",
    `${t.vaga}: ${dados.vaga ?? t.espontanea}`,
    dados.areas.length ? `${t.areas}: ${dados.areas.join(", ")}` : null,
    `${t.telefone}: ${dados.telefone}`,
    "",
    t.guardamos,
    "",
    t.acrescentar,
    "",
    dados.locale === "pt" ? "Até breve,\nEquipa Jelly" : "Talk soon,\nJelly team",
    "",
    "—",
    `${CASA.legal} · VAT ${CASA.vat}`,
    `${CASA.talento} · ${SITE_URL}`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n");

  return { subject: assunto, html, text: texto };
}

/** O aviso que chega a quem recruta. */
export function avisoDeCandidatura(dados: Candidatura) {
  const assunto = `Candidatura de ${dados.nome}${dados.vaga ? ` — ${dados.vaga}` : " — espontânea"}`;

  const respostas = dados.respostas.length
    ? [
        `<p style="margin:0 0 10px;font:600 11px/1.4 Poppins,Helvetica,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#78848f">Respostas da vaga</p>`,
        ...dados.respostas.map(
          (resposta) =>
            `<p style="margin:0 0 12px;font:400 14px/1.6 Poppins,Helvetica,Arial,sans-serif;color:#2a384a"><strong>${escapa(resposta.question)}</strong><br>${escapa(resposta.answer)}</p>`,
        ),
      ].join("\n")
    : "";

  const corpo = [
    recibo(
      "Quem se candidatou",
      [
        { rotulo: "Vaga", valor: dados.vaga ?? "Espontânea" },
        { rotulo: "Áreas", valor: dados.areas.join(", ") },
        { rotulo: "Email", valor: dados.email },
        { rotulo: "Telefone", valor: dados.telefone },
        { rotulo: "Cidade", valor: dados.cidade },
        { rotulo: "Experiência", valor: dados.experiencia },
      ],
      "",
    ),
    respostas,
    [
      dados.registoId ? botao(`${SITE_URL}/admin/collections/applications/${dados.registoId}`, "Abrir no painel") : "",
      dados.cvUrl ? botao(dados.cvUrl, "Ver o CV", false) : "",
    ]
      .filter(Boolean)
      .join("\n"),
    p(
      `Para responder diretamente: <a href="mailto:${escapa(dados.email)}" style="color:#dd364a">${escapa(dados.email)}</a>. O email de estado envia-se do painel, para ficar registado.`,
      "24px 0 0",
    ),
  ]
    .filter(Boolean)
    .join("\n");

  const html = papel({
    locale: "pt",
    titulo: assunto,
    antevisao: `${dados.vaga ?? "Espontânea"} · ${dados.cidade || dados.email}`,
    sobretitulo: "Candidatura nova",
    cabeca: dados.nome,
    corpo,
    rodape: "interno",
  });

  const texto = [
    `Vaga: ${dados.vaga ?? "Espontânea"}`,
    dados.areas.length ? `Áreas: ${dados.areas.join(", ")}` : null,
    `Email: ${dados.email}`,
    `Telefone: ${dados.telefone}`,
    dados.cidade ? `Cidade: ${dados.cidade}` : null,
    dados.experiencia ? `Experiência: ${dados.experiencia}` : null,
    "",
    ...dados.respostas.map((resposta) => `${resposta.question}\n${resposta.answer}\n`),
    dados.cvUrl ? `CV: ${dados.cvUrl}` : null,
    dados.registoId ? `No painel: ${SITE_URL}/admin/collections/applications/${dados.registoId}` : null,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n");

  return { subject: assunto, html, text: texto };
}
