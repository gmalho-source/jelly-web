import { NextResponse, type NextRequest } from "next/server";
import { isValidEmail, normalizeEmail, MAGIC_LINK_TTL_SECONDS } from "@/lib/billing/auth";
import { sendMagicLinkEmail } from "@/lib/billing/email";
import { isRegisteredProvider } from "@/lib/billing/providers";
import { signMagicLink } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { billingUrl } from "@/lib/billing/urls";

export const runtime = "nodejs";

const PER_EMAIL = { limit: 3, windowSeconds: 15 * 60 };
const PER_IP = { limit: 10, windowSeconds: 60 * 60 };

export async function POST(request: NextRequest) {
  let email: string;
  try {
    const body = (await request.json()) as { email?: unknown };
    email = normalizeEmail(String(body.email ?? ""));
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (!isValidEmail(email)) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (
    !withinRateLimit(`email:${email}`, PER_EMAIL.limit, PER_EMAIL.windowSeconds) ||
    !withinRateLimit(`ip:${ip}`, PER_IP.limit, PER_IP.windowSeconds)
  ) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  // A resposta é sempre a mesma: o formulário nunca confirma quem é prestador.
  if (await isRegisteredProvider(email)) {
    try {
      const token = await signMagicLink(email);
      await sendMagicLinkEmail(email, billingUrl(request, `/entrar?t=${encodeURIComponent(token)}`));
    } catch (error) {
      console.error("[billing] falha ao enviar magic link", error);
      return NextResponse.json({ ok: false }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true, expiresIn: MAGIC_LINK_TTL_SECONDS });
}
