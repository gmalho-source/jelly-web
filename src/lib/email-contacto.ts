import { papel, p, recibo, escapa, CASA } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * A carta que quem escreve pela página de contactos recebe de volta.
 *
 * O texto mudou de propósito em relação ao que a casa enviava antes:
 *
 * — sem prazo. «Nas próximas horas vamos entrar em contacto» é uma promessa que
 *   não se pode cumprir a um sábado, e falhá-la custa mais do que não a fazer.
 * — sem «desafio aceite». Aceitar um projeto antes de o ler é uma coisa que se
 *   diz sem querer dizer; a Jelly recebe primeiro e responde depois.
 * — sem «Bem-vindo(a)». O parêntesis a resolver o género é um remendo à vista.
 * — com recibo: o que a pessoa escreveu volta com ela.
 *
 * O título é a frase da própria casa, a mesma que a página mostra depois de
 * submeter: quem carrega em enviar e depois abre o email vê a mesma coisa.
 */

export type Contacto = {
  locale: "pt" | "en";
  nome: string;
  empresa: string;
  /** Já com o indicativo à frente, ou vazio. */
  telefone: string;
  /** A janela de arranque, já em texto corrido. */
  janela: string;
  mensagem: string;
  temAnexo: boolean;
};

const T = {
  pt: {
    assunto: (nome: string) => `A mudança está prestes a começar, ${nome}`,
    antevisao: "A sua mensagem chegou. Um elemento da nossa equipa entra em contacto em breve.",
    sobretitulo: "Briefing recebido",
    cabeca: "A mudança está prestes a começar.",
    saudacao: (nome: string) => `Olá ${nome},`,
    chegou:
      "a sua mensagem chegou à Jelly. Um elemento da nossa equipa entrará brevemente em contacto para responder ao seu desafio.",
    recibo: "O que nos enviou",
    empresa: "Empresa",
    telefone: "Telefone",
    arranque: "Arranque",
    anexo: "Briefing",
    anexoValor: "recebemos o ficheiro que anexou",
    acrescentar: "Se quiser acrescentar algo, basta responder a este email — chega à mesma equipa.",
    entretanto: "Entretanto, se lhe der jeito conhecer-nos melhor:",
    trabalho: "o trabalho que fazemos",
    ideias: "o que andamos a pensar",
    assina: "Até breve,<br>Jelly",
    caminhos: { trabalho: "/projetos", ideias: "/blog" },
  },
  en: {
    assunto: (nome: string) => `The change is about to start, ${nome}`,
    antevisao: "Your message reached us. Someone from our team will be in touch shortly.",
    sobretitulo: "Brief received",
    cabeca: "The change is about to start.",
    saudacao: (nome: string) => `Hello ${nome},`,
    chegou:
      "your message reached Jelly. Someone from our team will be in touch shortly to answer your challenge.",
    recibo: "What you sent us",
    empresa: "Company",
    telefone: "Phone",
    arranque: "Kick-off",
    anexo: "Brief",
    anexoValor: "we received the file you attached",
    acrescentar: "If you want to add anything, just reply to this email — it reaches the same team.",
    entretanto: "In the meantime, if you feel like getting to know us better:",
    trabalho: "the work we do",
    ideias: "what we have been thinking about",
    assina: "Talk soon,<br>Jelly",
    caminhos: { trabalho: "/en/work", ideias: "/en/blog" },
  },
} as const;

export function cartaDeContacto({ locale, nome, empresa, telefone, janela, mensagem, temAnexo }: Contacto) {
  const t = T[locale];
  // O primeiro nome, que é como se trata alguém numa carta. O nome inteiro fica
  // no recibo interno, não aqui.
  const primeiro = nome.trim().split(/\s+/)[0] ?? nome;

  const corpo = [
    p(`${escapa(t.saudacao(primeiro))} ${escapa(t.chegou)}`),
    recibo(
      t.recibo,
      [
        { rotulo: t.empresa, valor: empresa },
        { rotulo: t.telefone, valor: telefone },
        { rotulo: t.arranque, valor: janela },
        { rotulo: t.anexo, valor: temAnexo ? t.anexoValor : "" },
      ],
      mensagem,
    ),
    p(escapa(t.acrescentar)),
    p(
      `${escapa(t.entretanto)} <a href="${SITE_URL}${t.caminhos.trabalho}" style="color:#dd364a">${escapa(t.trabalho)}</a> · <a href="${SITE_URL}${t.caminhos.ideias}" style="color:#dd364a">${escapa(t.ideias)}</a>.`,
    ),
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

  // A versão em texto não é um resto: há quem leia o email assim, e um email só
  // em HTML é lido com mais desconfiança por quem filtra o correio.
  // `null` é a linha que não se escreve; `""` é a linha em branco que separa
  // parágrafos. Confundir as duas cola o email todo num bloco.
  const texto = [
    `${t.saudacao(primeiro)} ${t.chegou}`,
    "",
    t.recibo.toUpperCase(),
    empresa ? `${t.empresa}: ${empresa}` : null,
    telefone ? `${t.telefone}: ${telefone}` : null,
    janela ? `${t.arranque}: ${janela}` : null,
    temAnexo ? `${t.anexo}: ${t.anexoValor}` : null,
    "",
    mensagem,
    "",
    t.acrescentar,
    "",
    locale === "pt" ? "Até breve,\nJelly" : "Talk soon,\nJelly",
    "",
    "—",
    `${CASA.legal} · VAT ${CASA.vat}`,
    `${CASA.rua} · ${CASA.local}`,
    `${CASA.telefone} · ${CASA.email} · ${SITE_URL}`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n");

  return { subject: t.assunto(primeiro), html, text: texto };
}
