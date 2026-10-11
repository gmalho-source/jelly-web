import { ErroDeAssinatura } from "@/lib/assinaturas/fluxo";
import { comecarPeloLink, lerDados } from "@/lib/assinaturas/link";
import { cms, ipDe } from "../../../[token]/comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Os dados do formulário → o pedido, o NDA preenchido, e a ligação para assinar. */
export async function POST(request: Request, { params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  const corpo = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!corpo.consentimento) return Response.json({ error: "Confirme que aceita o tratamento dos dados." }, { status: 400 });
  const { dados, erros } = lerDados(corpo);
  if (!dados) return Response.json({ error: "Há campos por corrigir.", erros }, { status: 400 });
  try {
    const origem = new URL(request.url).origin;
    const { ligacao } = await comecarPeloLink(await cms(), chave, dados, { ip: ipDe(request), origem });
    return Response.json({ ligacao });
  } catch (erro) {
    if (erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    console.error("[nda-link] começar:", erro);
    return Response.json({ error: "Não foi possível preparar o NDA. Tente outra vez dentro de instantes." }, { status: 500 });
  }
}
