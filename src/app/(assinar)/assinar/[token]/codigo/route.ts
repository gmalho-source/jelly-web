import { ErroDeAssinatura, pedirCodigo } from "@/lib/assinaturas/fluxo";
import { cms, emailEscondido } from "../comum";

export const runtime = "nodejs";

/** Manda o código de confirmação para o email de quem assina. */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  try {
    const { email } = await pedirCodigo(await cms(), token);
    return Response.json({ ok: true, para: emailEscondido(email) });
  } catch (erro) {
    if (erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    console.error("[assinar] código:", erro);
    return Response.json({ error: "Não foi possível enviar o código. Tente outra vez dentro de instantes." }, { status: 500 });
  }
}
