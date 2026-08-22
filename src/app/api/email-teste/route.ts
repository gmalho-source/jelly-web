import { NextResponse, type NextRequest } from "next/server";
import { enviaEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Prova o caminho do email e devolve o que o fornecedor respondeu.
 *
 * Existe porque «não recebi email nenhum» tem meia dúzia de causas — chave em
 * falta, remetente não verificado, domínio sem autenticação — e nenhuma delas
 * se distingue do lado de fora. Com isto, distingue-se numa chamada.
 *
 * Fechada com o mesmo segredo que purga o cache: não é para andar aberta.
 *
 *   curl -X POST https://…/api/email-teste \
 *     -H "authorization: Bearer $REVALIDATE_SECRET" \
 *     -H "content-type: application/json" -d '{"para":"alguem@jelly.pt"}'
 */
export async function POST(request: NextRequest) {
  const segredo = env(process.env.REVALIDATE_SECRET);
  const dado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!segredo || dado !== segredo) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let corpo: { para?: string; de?: string } = {};
  try {
    corpo = (await request.json()) as typeof corpo;
  } catch {
    // Sem corpo, envia para a caixa da casa.
  }

  const para = (corpo.para ?? "hello@jelly.pt").trim();
  const resultado = await enviaEmail({
    to: para,
    ...(corpo.de ? { from: corpo.de } : {}),
    subject: "Teste do caminho do email — Jelly",
    text: "Se este email chegou, o caminho está de pé. Enviado pelo /api/email-teste.",
  });

  return NextResponse.json({
    para,
    via: resultado.via,
    ok: resultado.ok,
    erro: resultado.erro ?? null,
    chaves: {
      brevo: Boolean(env(process.env.BREVO_API_KEY)),
      resend: Boolean(env(process.env.RESEND_API_KEY)),
      remetente: process.env.MAIL_FROM ?? "(por omissão: Jelly <hello@jelly.pt>)",
    },
  });
}
