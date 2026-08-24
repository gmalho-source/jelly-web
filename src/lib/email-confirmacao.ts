import { papel, p, botao, escapa, recibo, CASA } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * A carta que pede a confirmação dos dados.
 *
 * Vai para quem nunca preencheu o formulário do site: mandou o currículo por
 * email, ou entregou-o em mão a alguém da casa. Trata por «tu», como todas as
 * cartas do talento.
 *
 * O tom é o que a situação pede: não é uma promessa nem uma triagem, é uma
 * pergunta. Temos isto, veio do teu currículo, confirma se está certo e diz-nos
 * se podemos guardar. E diz também o que acontece se não fizer nada — que é
 * nada, e o que está guardado é apagado no fim do prazo.
 */
export type PedidoDeConfirmacao = {
  locale: "pt" | "en";
  nome: string;
  email: string;
  telefone?: string;
  cidade?: string;
  vaga?: string;
  endereco: string;
  dias: number;
};

const T = {
  pt: {
    assunto: "Confirmas os teus dados?",
    antevisao: "Recebemos o teu currículo. Falta a tua palavra.",
    sobretitulo: "Candidatura por confirmar",
    cabeca: "Recebemos o teu currículo.",
    corpo: (nome: string) =>
      `Olá ${nome}, o teu currículo chegou-nos por fora do formulário do site — por email, ou pela mão de alguém da equipa. Guardámos o que ele diz, mas não queremos ficar com nada teu sem tu saberes.`,
    recibo: "O que temos",
    nome: "Nome",
    email: "Email",
    telefone: "Telefone",
    cidade: "Cidade",
    vaga: "Vaga",
    espontanea: "Candidatura espontânea",
    pedido:
      "No link abaixo vês tudo o que ficou registado, corriges o que estiver errado, e dizes se autorizas que guardemos a tua candidatura. Leva um minuto.",
    botao: "Ver e confirmar",
    prazo: (dias: number) =>
      `O link é só teu e fica de pé ${dias} dias. Se não fizeres nada, também está bem: não te voltamos a escrever e o que temos é apagado.`,
    apagar: "Na mesma página podes pedir que apaguemos tudo já — e é apagado no momento, sem ninguém do meio.",
    assina: "Até breve,<br>Equipa Jelly",
  },
  en: {
    assunto: "Can you confirm your details?",
    antevisao: "We received your CV. Your word is missing.",
    sobretitulo: "Application to confirm",
    cabeca: "We received your CV.",
    corpo: (nome: string) =>
      `Hello ${nome}, your CV reached us outside the site form — by email, or through someone on the team. We kept what it says, but we do not want to hold anything of yours without you knowing.`,
    recibo: "What we have",
    nome: "Name",
    email: "Email",
    telefone: "Phone",
    cidade: "City",
    vaga: "Role",
    espontanea: "Speculative application",
    pedido:
      "The link below shows everything on file, lets you fix what is wrong, and asks whether you allow us to keep your application. It takes a minute.",
    botao: "See and confirm",
    prazo: (dias: number) =>
      `The link is yours alone and stands for ${dias} days. If you do nothing, that is fine too: we will not write again and what we have is deleted.`,
    apagar: "On the same page you can ask us to delete everything now — and it is deleted right there, with nobody in between.",
    assina: "Talk soon,<br>Jelly team",
  },
} as const;

export function cartaDeConfirmacao(dados: PedidoDeConfirmacao) {
  const t = T[dados.locale];
  const primeiro = dados.nome.trim().split(/\s+/)[0] ?? dados.nome;

  const corpo = [
    p(escapa(t.corpo(primeiro))),
    recibo(
      t.recibo,
      [
        { rotulo: t.nome, valor: dados.nome },
        { rotulo: t.email, valor: dados.email },
        { rotulo: t.telefone, valor: dados.telefone ?? "" },
        { rotulo: t.cidade, valor: dados.cidade ?? "" },
        { rotulo: t.vaga, valor: dados.vaga ?? t.espontanea },
      ],
      "",
    ),
    p(escapa(t.pedido)),
    botao(dados.endereco, t.botao),
    p(escapa(t.prazo(dados.dias)), "26px 0 18px"),
    p(escapa(t.apagar)),
    p(t.assina, "26px 0 0"),
  ].join("\n");

  const html = papel({
    locale: dados.locale,
    titulo: t.assunto,
    antevisao: t.antevisao,
    sobretitulo: t.sobretitulo,
    cabeca: t.cabeca,
    corpo,
  });

  const texto = [
    t.corpo(primeiro),
    "",
    `${t.nome}: ${dados.nome}`,
    `${t.email}: ${dados.email}`,
    dados.telefone ? `${t.telefone}: ${dados.telefone}` : null,
    dados.cidade ? `${t.cidade}: ${dados.cidade}` : null,
    `${t.vaga}: ${dados.vaga ?? t.espontanea}`,
    "",
    t.pedido,
    "",
    dados.endereco,
    "",
    t.prazo(dados.dias),
    t.apagar,
    "",
    dados.locale === "pt" ? "Até breve,\nEquipa Jelly" : "Talk soon,\nJelly team",
    "",
    "—",
    `${CASA.legal} · VAT ${CASA.vat}`,
    `${CASA.talento} · ${SITE_URL}`,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n");

  return { subject: t.assunto, html, text: texto };
}
