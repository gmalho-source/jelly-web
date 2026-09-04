import { NextResponse, type NextRequest } from "next/server";
import { MAGIC_LINK_TTL_SECONDS, verifyMagicLink } from "@/lib/billing/auth";
import { isRegisteredProvider } from "@/lib/billing/providers";
import { startSession } from "@/lib/billing/session";
import { consumeToken } from "@/lib/billing/store";
import { billingUrl } from "@/lib/billing/urls";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t");
  const fail = NextResponse.redirect(billingUrl(request, "/?erro=link"));
  if (!token) return fail;

  const payload = await verifyMagicLink(token);
  if (!payload) return fail;

  // Uso único: o mesmo link não abre duas vezes.
  if (!(await consumeToken(payload.jti, MAGIC_LINK_TTL_SECONDS))) return fail;

  // O registo pode ter sido revogado entre o pedido e o clique.
  if (!(await isRegisteredProvider(payload.email))) return fail;

  await startSession(payload.email);
  return NextResponse.redirect(billingUrl(request, "/faturacao"));
}
