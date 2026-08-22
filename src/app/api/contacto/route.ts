import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import { Resend } from "resend";
import config from "@/../payload.config";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { env, envOr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Briefing curto da página de contactos.
 *
 * Grava primeiro, avisa depois: o email é o aviso, não o arquivo. Antes isto só
 * enviava, e um email que se perdesse levava o pedido com ele.
 *
 * Saem dois emails: um para a casa, com o briefing, e um para quem escreveu, a
 * dizer que chegou e quando terá resposta. O segundo é o que evita a dúvida de
 * quem carrega em enviar e não vê nada acontecer.
 */
export async function POST(request: NextRequest) {
  let body: { name?: string; company?: string; email?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 120);
  const company = (body.company ?? "").trim().slice(0, 120);
  const email = normalizeEmail(body.email ?? "");
  const message = (body.message ?? "").trim().slice(0, 4000);

  if (!name || !message || !isValidEmail(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`contacto:${ip}`, 5, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const text = [`Nome: ${name}`, `Empresa: ${company || "—"}`, `Email: ${email}`, "", message].join("\n");
  const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "pt";

  // O registo primeiro. Se a base falhar, o pedido não se perde por isso: o
  // email sai a seguir de qualquer maneira.
  try {
    const payload = await getPayload({ config });
    await payload.create({ collection: "messages", data: { name, company, email, message, locale, status: "nova" } });
  } catch (error) {
    console.error("[contacto] não gravou a mensagem", error);
  }

  const apiKey = env(process.env.RESEND_API_KEY);
  if (!apiKey) {
    console.info(`[contacto] briefing de ${email}\n${text}`);
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const from = envOr(process.env.BILLING_FROM_EMAIL, "Jelly <hello@jelly.pt>");

  const aviso = await resend.emails.send({
    from,
    to: envOr(process.env.CONTACT_TO_EMAIL, "gmalho@jelly.pt"),
    replyTo: email,
    subject: `Briefing de ${name}${company ? ` (${company})` : ""}`,
    text: `${text}\n\nFica também no painel, em Mensagens.`,
  });

  if (aviso.error) {
    console.error("[contacto] falha ao avisar a casa", aviso.error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  // A confirmação a quem escreveu. Falhar aqui não invalida o pedido, que já
  // está gravado e já foi avisado — por isso não devolve erro.
  const confirmacao =
    locale === "en"
      ? {
          subject: "We received your briefing",
          text: `Hello ${name.split(" ")[0]},\n\nYour briefing reached us and someone is reading it. We reply within 24 working hours.\n\nWhat you sent us:\n\n${message}\n\nIf you want to add anything, just reply to this email.\n\nJelly`,
        }
      : {
          subject: "Recebemos o seu briefing",
          text: `Olá ${name.split(" ")[0]},\n\nO seu briefing chegou e já está a ser lido. Respondemos em 24 horas úteis.\n\nO que nos enviou:\n\n${message}\n\nSe quiser acrescentar algo, basta responder a este email.\n\nJelly`,
        };

  const recibo = await resend.emails.send({
    from,
    to: email,
    replyTo: envOr(process.env.CONTACT_TO_EMAIL, "gmalho@jelly.pt"),
    ...confirmacao,
  });

  if (recibo.error) console.error("[contacto] falha na confirmação ao remetente", recibo.error);

  return NextResponse.json({ ok: true });
}
