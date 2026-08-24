import { NextResponse, type NextRequest } from "next/server";
import { recebe } from "../comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * A mesma porta, com o segredo no caminho em vez de na interrogação.
 *
 * É esta que o Brevo aceita registar: um endereço com query string é recusado
 * na criação do webhook, com um «Enter valid notify url» que não explica nada.
 * O segredo tem de ir a algum lado — sem ele, quem soubesse o endereço escrevia
 * fichas na base de dados — e o caminho serve tão bem como a query.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  return recebe(request, chave);
}

/**
 * Um sim a quem vem espreitar. O Brevo verifica o endereço antes de registar o
 * webhook, e quem chega aqui já provou saber o segredo.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  const segredo = process.env.CV_INBOUND_SECRET?.trim();
  if (!segredo || chave !== segredo) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json({ ok: true, estado: "porta aberta, à espera de correio" });
}
