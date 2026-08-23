import { env, envOr } from "@/lib/env";

/**
 * O envio de email transacional da casa, num sítio só.
 *
 * Há dois caminhos porque há duas contas: o Brevo, que é onde a Jelly passou a
 * ter a lista e onde a chave já está configurada, e o Resend, que era o
 * anterior. Usa-se o que existir, por esta ordem. Sem chave nenhuma — em
 * desenvolvimento — escreve-se no log em vez de falhar, mas quem chama fica a
 * saber que não saiu nada: um formulário que diz «enviado» sem ter enviado é
 * pior do que um que diz que falhou.
 *
 * Isto é email transacional: confirmações, avisos, links de acesso. Não é
 * marketing, e não passa pelas listas nem pelas campanhas.
 */
export type Carta = {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
  from?: string;
};

export type Resultado = { ok: boolean; via: "brevo" | "resend" | "log"; erro?: string; id?: string };

/** "Jelly <hello@jelly.pt>" → { nome, email } */
function remetente(valor: string) {
  const combina = valor.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return combina ? { nome: combina[1] || "Jelly", email: combina[2] } : { nome: "Jelly", email: valor.trim() };
}

async function peloBrevo(chave: string, carta: Carta): Promise<Resultado> {
  const de = remetente(carta.from ?? envOr(process.env.MAIL_FROM, "Jelly <hello@jelly.pt>"));
  const resposta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": chave, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender: { name: de.nome, email: de.email },
      to: [{ email: carta.to }],
      ...(carta.replyTo ? { replyTo: { email: carta.replyTo } } : {}),
      subject: carta.subject,
      ...(carta.text ? { textContent: carta.text } : {}),
      ...(carta.html ? { htmlContent: carta.html } : {}),
    }),
  });

  if (resposta.ok) {
    // O identificador serve para ir buscar o estado da entrega ao registo do
    // Brevo: aceitar não é entregar, e a diferença entre as duas coisas é
    // exactamente onde estes problemas vivem.
    const corpo = (await resposta.json().catch(() => ({}))) as { messageId?: string };
    return { ok: true, via: "brevo", id: corpo.messageId };
  }

  // A mensagem do Brevo diz o que se passa — remetente não verificado, chave
  // sem permissão — e é isso que interessa ver no log, não um 400 seco.
  const corpo = await resposta.text().catch(() => "");
  return { ok: false, via: "brevo", erro: `${resposta.status} ${corpo.slice(0, 300)}` };
}

async function peloResend(chave: string, carta: Carta): Promise<Resultado> {
  const { Resend } = await import("resend");
  const de = carta.from ?? envOr(process.env.MAIL_FROM, "Jelly <hello@jelly.pt>");
  const comum = { from: de, to: carta.to, replyTo: carta.replyTo, subject: carta.subject };
  const { error } = carta.html
    ? await new Resend(chave).emails.send({ ...comum, html: carta.html })
    : await new Resend(chave).emails.send({ ...comum, text: carta.text ?? "" });

  return error ? { ok: false, via: "resend", erro: error.message } : { ok: true, via: "resend" };
}

export async function enviaEmail(carta: Carta): Promise<Resultado> {
  const brevo = env(process.env.BREVO_API_KEY);
  if (brevo) return peloBrevo(brevo, carta);

  const resend = env(process.env.RESEND_API_KEY);
  if (resend) return peloResend(resend, carta);

  console.info(`[email] sem chave neste ambiente. Para ${carta.to}: ${carta.subject}\n${carta.text ?? carta.html ?? ""}`);
  return { ok: false, via: "log", erro: "sem chave de email neste ambiente" };
}
