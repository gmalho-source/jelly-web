import { enviaEmail, type Resultado } from "@/lib/email";
import { BILLING_HOST } from "@/lib/hosts";
import { botao, escapa, p, papel } from "@/lib/email-papel";
import { validade } from "./email";

/**
 * As instruções de faturação, mandadas ao prestador quando alguém da casa
 * carrega no botão da ficha — e só aí. Criar a ficha não manda nada: a ficha
 * pode estar a meio, e quem a cria sabe quando está pronta.
 *
 * O texto é curto de propósito: diz que a ficha existe e o que fazer para
 * faturar, em dois passos. O link de acesso não vai aqui — vale poucas horas
 * e só uma vez, e estas instruções servem para todas as faturas.
 */
const ENDERECO = `https://${BILLING_HOST}`;

function primeiroNome(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? "";
}

export function cartaDeInstrucoes(nome: string) {
  const ola = primeiroNome(nome) ? `Olá ${primeiroNome(nome)},` : "Olá,";
  const assunto = "A tua ficha de prestador na Jelly está criada";
  const html = papel({
    locale: "pt",
    titulo: assunto,
    antevisao: `Para faturar, entra em ${BILLING_HOST} com o teu email.`,
    sobretitulo: "Área de prestadores",
    cabeca: "Já podes submeter faturas",
    corpo: [
      p(escapa(ola)),
      p("A tua ficha de prestador já está criada na nossa plataforma. Para submeteres uma fatura:"),
      p(
        `<strong>1.</strong> Entra em <a href="${ENDERECO}" style="color:#dd364a">${BILLING_HOST}</a> e escreve o teu email.<br>` +
          "<strong>2.</strong> Recebes um link de acesso por email. Abre-o para submeteres a fatura.",
      ),
      botao(ENDERECO, `Ir para ${BILLING_HOST}`),
      p(`O link de acesso é válido durante ${validade} e só serve uma vez: em cada fatura, pede um novo.`, "18px 0 0"),
      p('Dúvidas: <a href="mailto:pagamentos@jelly.pt" style="color:#dd364a">pagamentos@jelly.pt</a>.', "14px 0 0"),
    ].join("\n"),
    rodape: "prestador",
  });
  const text = [
    ola,
    "",
    "A tua ficha de prestador já está criada na nossa plataforma. Para submeteres uma fatura:",
    "",
    `1. Entra em ${ENDERECO} e escreve o teu email.`,
    "2. Recebes um link de acesso por email. Abre-o para submeteres a fatura.",
    "",
    `O link de acesso é válido durante ${validade} e só serve uma vez: em cada fatura, pede um novo.`,
    "",
    "Dúvidas: pagamentos@jelly.pt",
  ].join("\n");
  return { subject: assunto, html, text };
}

export async function enviaInstrucoes(prestador: { nome: string; email: string }): Promise<Resultado> {
  return enviaEmail({ voz: "faturacao", to: prestador.email, ...cartaDeInstrucoes(prestador.nome) });
}
