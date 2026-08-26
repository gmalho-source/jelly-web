import { NextResponse, type NextRequest } from "next/server";
import { enviaEmail } from "@/lib/email";
import { cartaDeSubscricao } from "@/lib/email-subscricao";
import { DIAS_DE_VALIDADE, bilheteLido, bilheteNovo, emSilencio, guardaNoBrevo } from "@/lib/subscricao";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";

/**
 * A porta de entrada das comunicações da Jelly.
 *
 * Dois gestos, e o segundo é que conta. Pedir — e daqui sai uma carta com um
 * link assinado, sem nada ficar guardado. Confirmar — e só aí o contacto nasce
 * no Brevo, que é onde a lista vive.
 *
 * O que se escreve no registo é um resumo do email, não o email: saber que
 * alguém entrou não obriga a escrever quem no ficheiro de log de um servidor.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`subscrever:${ip}`, 10, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // A armadilha: um campo que ninguém vê e que só um robô preenche. Responde-se
  // como se tivesse corrido bem — dizer «apanhei-te» é ensinar a fugir.
  if (String(corpo.empresa ?? "").trim()) return NextResponse.json({ ok: true });

  if (corpo.token) return confirma(String(corpo.token));

  const email = normalizeEmail(String(corpo.email ?? "").slice(0, 160));
  if (!isValidEmail(email)) return NextResponse.json({ ok: false, erro: "email" }, { status: 400 });
  if (corpo.consent !== true) return NextResponse.json({ ok: false, erro: "consentimento" }, { status: 400 });

  const lingua = corpo.lingua === "en" ? "en" : "pt";
  const origem = String(corpo.origem ?? "site").slice(0, 120);
  const bilhete = bilheteNovo(email, lingua, origem);
  const raiz = SITE_URL.replace(/\/$/, "");
  const endereco = lingua === "en" ? `${raiz}/en/subscribe/${bilhete}` : `${raiz}/subscrever/${bilhete}`;

  const carta = cartaDeSubscricao({ locale: lingua, endereco, dias: DIAS_DE_VALIDADE });
  const saiu = await enviaEmail({
    to: email,
    subject: carta.subject,
    html: carta.html,
    text: carta.text,
    voz: "blog",
  }).catch((erro) => ({ ok: false, erro: erro instanceof Error ? erro.message : String(erro) }));

  if (!saiu.ok) {
    console.error(`[subscrever] a carta para ${emSilencio(email)} não saiu: ${saiu.erro ?? "sem razão"}`);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  console.log(`[subscrever] pedido de ${emSilencio(email)} (${lingua}, ${origem})`);
  return NextResponse.json({ ok: true });
}

/** O segundo gesto: o contacto nasce no Brevo. */
async function confirma(token: string) {
  const bilhete = bilheteLido(token);
  if (!bilhete) return NextResponse.json({ ok: false }, { status: 404 });

  const guardado = await guardaNoBrevo(bilhete);
  if (!guardado.ok) {
    console.error(`[subscrever] ${emSilencio(bilhete.email)} não entrou na lista: ${guardado.erro}`);
    return NextResponse.json({ ok: false }, { status: 502 });
  }

  console.log(`[subscrever] ${emSilencio(bilhete.email)} confirmou (${bilhete.lingua})`);
  return NextResponse.json({ ok: true });
}
