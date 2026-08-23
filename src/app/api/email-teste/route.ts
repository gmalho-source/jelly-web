import { NextResponse, type NextRequest } from "next/server";
import { enviaEmail, remetentePara } from "@/lib/email";
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
/** Aceitar não é entregar: isto vai ver o que o Brevo fez com as mensagens. */
export async function GET(request: NextRequest) {
  const segredo = env(process.env.REVALIDATE_SECRET);
  const dado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!segredo || dado !== segredo) return NextResponse.json({ ok: false }, { status: 401 });

  const chave = env(process.env.BREVO_API_KEY);
  if (!chave) return NextResponse.json({ erro: "sem chave do Brevo" }, { status: 400 });

  const pede = async (caminho: string) => {
    const resposta = await fetch(`https://api.brevo.com/v3/${caminho}`, {
      headers: { "api-key": chave, accept: "application/json" },
    });
    const texto = await resposta.text();
    try {
      return { estado: resposta.status, dados: JSON.parse(texto) as unknown };
    } catch {
      return { estado: resposta.status, dados: texto.slice(0, 400) };
    }
  };

  // Um caminho à escolha, de uma lista fechada: chega para ver o que se passa
  // sem transformar isto numa porta para a API do fornecedor.
  const PERMITIDOS: Record<string, string> = {
    conta: "account",
    remetentes: "senders",
    dominios: "senders/domains",
    eventos: "smtp/statistics/events?limit=20&sort=desc",
    agregado: "smtp/statistics/aggregatedReport",
  };

  const pedido = request.nextUrl.searchParams.get("ver");
  const email = request.nextUrl.searchParams.get("email");
  const dominio = request.nextUrl.searchParams.get("dominio");

  // Os registos de DNS que o fornecedor quer para autenticar o domínio. É a
  // informação que falta a quem tem de os publicar.
  if (dominio) return NextResponse.json(await pede(`senders/domains/${encodeURIComponent(dominio)}`));

  if (email) {
    return NextResponse.json(await pede(`smtp/emails?limit=10&sort=desc&email=${encodeURIComponent(email)}`));
  }

  if (pedido) {
    const caminho = PERMITIDOS[pedido];
    if (!caminho) return NextResponse.json({ erro: `ver= um de: ${Object.keys(PERMITIDOS).join(", ")}` }, { status: 400 });
    return NextResponse.json(await pede(caminho));
  }

  const [conta, remetentes, dominios] = await Promise.all([pede("account"), pede("senders"), pede("senders/domains")]);
  return NextResponse.json({ conta, remetentes, dominios });
}

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
    id: resultado.id ?? null,
    erro: resultado.erro ?? null,
    chaves: {
      brevo: Boolean(env(process.env.BREVO_API_KEY)),
      resend: Boolean(env(process.env.RESEND_API_KEY)),
      remetentes: {
        cliente: remetentePara("cliente"),
        talento: remetentePara("talento"),
        blog: remetentePara("blog"),
        faturacao: remetentePara("faturacao"),
      },
    },
  });
}
