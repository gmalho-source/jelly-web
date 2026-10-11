import { assinar, ErroDeAssinatura } from "@/lib/assinaturas/fluxo";
import { cms, ipDe, navegadorDe } from "../comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/** A assinatura: o código, o nome escrito e a declaração de aceitação. */
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const corpo = (await request.json().catch(() => ({}))) as { codigo?: string; nome?: string; aceito?: boolean };
  if (!corpo.aceito) return Response.json({ error: "Confirme que leu e aceita o documento." }, { status: 400 });
  try {
    const resultado = await assinar(await cms(), token, {
      codigo: String(corpo.codigo ?? ""),
      nome: String(corpo.nome ?? ""),
      ip: ipDe(request),
      navegador: navegadorDe(request),
    });
    return Response.json({ ok: true, ...resultado });
  } catch (erro) {
    if (erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    console.error("[assinar] confirmar:", erro);
    return Response.json({ error: "Não foi possível concluir a assinatura. Tente outra vez dentro de instantes." }, { status: 500 });
  }
}
