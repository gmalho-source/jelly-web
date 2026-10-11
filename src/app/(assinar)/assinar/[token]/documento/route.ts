import { abrir, ErroDeAssinatura } from "@/lib/assinaturas/fluxo";
import { fluxoDoPdf } from "@/lib/assinaturas/ficheiros";
import { cms } from "../comum";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * O PDF, para quem traz a ligação. O que foi enviado, ou — depois de todos
 * assinarem — o assinado, com o certificado. Abrir o documento fica registado:
 * é aqui, e não na página, porque os filtros de email abrem páginas sozinhos e
 * raramente vão buscar o PDF.
 */
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const payload = await cms();
  try {
    const { pedido } = await abrir(payload, token, true);
    const versao = new URL(request.url).searchParams.get("versao");
    const qual = versao === "assinado" && pedido.estado === "concluido" ? pedido.assinado : pedido.original;
    const id = qual && typeof qual === "object" ? qual.id : qual;
    if (!id) return new Response("Documento indisponível.", { status: 404 });
    // Em fluxo: um PDF de 10 MB não cabe numa resposta inteira (4,5 MB na Vercel).
    const { corpo, tamanho } = await fluxoDoPdf(payload, id);
    const descarregar = new URL(request.url).searchParams.has("descarregar");
    const nome = `${pedido.titulo.replace(/[^\p{L}\p{N} ._-]+/gu, " ").replace(/\s+/g, " ").trim() || "documento"}${versao === "assinado" ? " - assinado" : ""}.pdf`;
    return new Response(corpo as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        ...(tamanho ? { "Content-Length": String(tamanho) } : {}),
        "Content-Disposition": `${descarregar ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(nome)}`,
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
      },
    });
  } catch (erro) {
    if (erro instanceof ErroDeAssinatura) return new Response(erro.message, { status: erro.estado });
    throw erro;
  }
}
