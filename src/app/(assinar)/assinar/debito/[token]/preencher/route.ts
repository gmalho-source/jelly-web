import { ErroDeDebito, lerDadosDoCliente, preencher } from "@/lib/debitos/fluxo";
import { ErroDeAssinatura } from "@/lib/assinaturas/fluxo";
import { cms, ipDe } from "../../../[token]/comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/** O formulário → o documento, o pedido de assinatura, e para onde segue. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const corpo = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!corpo.consentimento) return Response.json({ error: "Confirme que aceita o tratamento dos dados." }, { status: 400 });
  const { dados, erros } = lerDadosDoCliente(corpo);
  if (!dados) return Response.json({ error: "Há campos por corrigir.", erros }, { status: 400 });
  try {
    const resultado = await preencher(await cms(), token, dados, { ip: ipDe(request), origem: new URL(request.url).origin });
    return Response.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroDeDebito || erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    console.error("[debito] preencher:", erro);
    return Response.json({ error: "Não foi possível preparar a autorização. Tente outra vez dentro de instantes." }, { status: 500 });
  }
}
