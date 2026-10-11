import { ErroDeAssinatura } from "@/lib/assinaturas/fluxo";
import { ErroDeDebito, lerDadosDoCliente, preencherPeloLink } from "@/lib/debitos/fluxo";
import { cms, ipDe } from "../../../[token]/comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/** O formulário do link único → a autorização, o documento, e para onde segue. */
export async function POST(request: Request, { params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  const corpo = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  if (!corpo.consentimento) return Response.json({ error: "Confirme que aceita o tratamento dos dados." }, { status: 400 });

  const quem = { nome: String(corpo.quemNome ?? "").trim().replace(/\s+/g, " ").slice(0, 160), email: String(corpo.quemEmail ?? "").trim().toLowerCase().slice(0, 160) };
  const errosQuem: { nome?: string; email?: string } = {};
  if (quem.nome.split(" ").length < 2) errosQuem.nome = "Escreva o seu nome completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(quem.email)) errosQuem.email = "Este email não parece certo.";
  const { dados, erros } = lerDadosDoCliente(corpo);
  if (!dados || Object.keys(errosQuem).length) return Response.json({ error: "Há campos por corrigir.", erros, errosQuem }, { status: 400 });

  try {
    const resultado = await preencherPeloLink(await cms(), chave, dados, quem, { ip: ipDe(request), origem: new URL(request.url).origin });
    return Response.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroDeDebito || erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    console.error("[debito-link] preencher:", erro);
    return Response.json({ error: "Não foi possível preparar a autorização. Tente outra vez dentro de instantes." }, { status: 500 });
  }
}
