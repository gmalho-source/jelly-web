import { MAGIC_LINK_TTL_SECONDS } from "./auth";
import { enviaEmail } from "@/lib/email";
import { papel, p, botao } from "@/lib/email-papel";

const minutes = Math.round(MAGIC_LINK_TTL_SECONDS / 60);

/**
 * O link de acesso dos prestadores, no papel da casa.
 *
 * Era um desenho à parte, de antes de haver papel. Ficar igual aos outros
 * emails do site não é arrumação: quem recebe isto reconhece a casa de onde
 * vem, e um email de acesso que não se parece com a casa parece o contrário
 * do que é.
 */
function template(link: string) {
  return papel({
    locale: "pt",
    titulo: "O seu link de acesso",
    antevisao: `Entre na área de prestadores. O link é válido durante ${minutes} minutos.`,
    sobretitulo: "Área de prestadores",
    cabeca: "O seu link de acesso",
    corpo: [
      p("Carregue no botão para entrar e submeter a sua fatura."),
      botao(link, "Entrar"),
      p(
        `O link é válido durante ${minutes} minutos e só pode ser usado uma vez. Se não pediu este link, ignore este email — sem o abrir, nada acontece.`,
        "18px 0 0",
      ),
      p(
        'Problemas de acesso: <a href="mailto:pagamentos@jelly.pt" style="color:#dd364a">pagamentos@jelly.pt</a>.',
        "14px 0 0",
      ),
    ].join("\n"),
  });
}

export async function sendMagicLinkEmail(to: string, link: string): Promise<void> {
  const resultado = await enviaEmail({
    voz: "faturacao",
    to,
    subject: "O seu link de acesso à área de prestadores",
    html: template(link),
    // Em texto também: um cliente de email que não desenhe o botão deixa quem
    // recebe sem porta nenhuma, e a porta é o próprio endereço.
    text: [
      "Carregue no link para entrar e submeter a sua fatura.",
      "",
      link,
      "",
      `O link é válido durante ${minutes} minutos e só pode ser usado uma vez. Se não pediu este link, ignore este email.`,
      "",
      "Problemas de acesso: pagamentos@jelly.pt",
    ].join("\n"),
  });

  // Sem chave, o link fica no log — é o que serve para desenvolver. Com chave e
  // com erro, quem chamou tem de saber: um link que não chega é uma porta
  // fechada.
  if (!resultado.ok && resultado.via !== "log") throw new Error(resultado.erro ?? "email não saiu");
}
