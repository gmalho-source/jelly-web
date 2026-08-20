import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";

export const runtime = "nodejs";

/** Briefing curto da página de contactos. Vai por email; não guarda nada. */
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
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[contacto] briefing de ${email}\n${text}`);
    return NextResponse.json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.BILLING_FROM_EMAIL ?? "Jelly <geral@jelly.pt>",
    to: process.env.CONTACT_TO_EMAIL ?? "geral@jelly.pt",
    replyTo: email,
    subject: `Briefing de ${name}${company ? ` (${company})` : ""}`,
    text,
  });

  if (error) {
    console.error("[contacto] falha ao enviar", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
