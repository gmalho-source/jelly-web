import { MAGIC_LINK_TTL_SECONDS } from "./auth";
import { enviaEmail } from "@/lib/email";
import { papel, p, botao } from "@/lib/email-papel";

/** «2 horas», «15 minutos»: a validade do link, em português. */
const validade = MAGIC_LINK_TTL_SECONDS % 3600 === 0
  ? `${MAGIC_LINK_TTL_SECONDS / 3600} ${MAGIC_LINK_TTL_SECONDS === 3600 ? "hora" : "horas"}`
  : `${Math.round(MAGIC_LINK_TTL_SECONDS / 60)} minutos`;

/** «27/10 às 14:01», na hora de Lisboa. */
export function quando(data: Date): string {
  const dia = data.toLocaleDateString("pt-PT", { timeZone: "Europe/Lisbon", day: "2-digit", month: "2-digit" });
  const hora = data.toLocaleTimeString("pt-PT", { timeZone: "Europe/Lisbon", hour: "2-digit", minute: "2-digit" });
  return `${dia} às ${hora}`;
}

/**
 * O link de acesso dos prestadores, no papel da casa.
 *
 * Era um desenho à parte, de antes de haver papel. Ficar igual aos outros
 * emails do site não é arrumação: quem recebe isto reconhece a casa de onde
 * vem, e um email de acesso que não se parece com a casa parece o contrário
 * do que é.
 */
function template(link: string, pedidoEm: Date) {
  return papel({
    locale: "pt",
    titulo: "O seu link de acesso",
    antevisao: `Pedido a ${quando(pedidoEm)}. Válido durante ${validade}.`,
    sobretitulo: "Área de prestadores",
    cabeca: "O seu link de acesso",
    corpo: [
      p("Carregue no botão para entrar e submeter a sua fatura."),
      botao(link, "Entrar"),
      // A hora do pedido no próprio email: com alguns serviços de email a
      // atrasar a entrega, quem pediu dois links tem de saber qual é o novo.
      p(
        `Pediu este link a ${quando(pedidoEm)}. É válido durante ${validade} e só pode ser usado uma vez. Se pediu mais do que um, use o mais recente. Se não pediu este link, ignore este email — sem carregar em «Entrar», nada acontece.`,
        "18px 0 0",
      ),
      p(
        'Problemas de acesso: <a href="mailto:pagamentos@jelly.pt" style="color:#dd364a">pagamentos@jelly.pt</a>.',
        "14px 0 0",
      ),
    ].join("\n"),
  });
}

export async function sendMagicLinkEmail(to: string, link: string, pedidoEm: Date): Promise<void> {
  const resultado = await enviaEmail({
    voz: "faturacao",
    to,
    // A hora no assunto também: na lista da caixa de correio vê-se qual é o
    // link mais recente sem abrir nenhum.
    subject: `O seu link de acesso à área de prestadores (${quando(pedidoEm).replace(" às ", ", ")})`,
    html: template(link, pedidoEm),
    // Em texto também: um cliente de email que não desenhe o botão deixa quem
    // recebe sem porta nenhuma, e a porta é o próprio endereço.
    text: [
      "Carregue no link para entrar e submeter a sua fatura.",
      "",
      link,
      "",
      `Pediu este link a ${quando(pedidoEm)}. É válido durante ${validade} e só pode ser usado uma vez. Se pediu mais do que um, use o mais recente. Se não pediu este link, ignore este email.`,
      "",
      "Problemas de acesso: pagamentos@jelly.pt",
    ].join("\n"),
  });

  // Sem chave, o link fica no log — é o que serve para desenvolver. Com chave e
  // com erro, quem chamou tem de saber: um link que não chega é uma porta
  // fechada.
  if (!resultado.ok && resultado.via !== "log") throw new Error(resultado.erro ?? "email não saiu");
}
