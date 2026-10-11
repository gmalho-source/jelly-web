import type { PayloadHandler } from "payload";
import { podeNoPedido } from "../acesso";

/**
 * As duas portas do painel para as assinaturas. Só a administração passa.
 *
 * POST /api/assinaturas/:id/enviar
 *   Envia (ou reenvia a quem falta) as ligações de assinatura.
 *
 * GET /api/assinaturas/imagem-jelly
 *   Diz se a imagem da assinatura da Jelly está carregada. Só sim ou não.
 *
 * POST /api/assinaturas/para-prestador/:prestador
 *   Cria um pedido em rascunho para o prestador — o NDA, com ele já como
 *   signatário — e devolve o id, para o painel abrir a ficha do pedido.
 */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!podeNoPedido(req, "assinaturas")) {
    return Response.json({ error: "Sem acesso às assinaturas." }, { status: 403 });
  }
  return null;
}

/** De onde vêm as ligações: o próprio site, no endereço por onde se entrou. */
function origemDe(req: Parameters<PayloadHandler>[0]): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.jelly.pt";
  const local = host.startsWith("localhost") || host.startsWith("127.0.0.1");
  return `${local ? "http" : "https"}://${host}`;
}

export const enviarAssinatura: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Falta o pedido." }, { status: 400 });

  const { enviar, ErroDeAssinatura } = await import("@/lib/assinaturas/fluxo");
  try {
    const resultado = await enviar(req.payload, String(id), origemDe(req));
    return Response.json(resultado);
  } catch (erro) {
    if (erro instanceof ErroDeAssinatura) return Response.json({ error: erro.message }, { status: erro.estado });
    const mensagem = erro instanceof Error ? erro.message : "erro desconhecido";
    req.payload.logger.error(`assinaturas: enviar ${id}: ${mensagem}`);
    return Response.json({ error: `Não foi possível enviar: ${mensagem}` }, { status: 500 });
  }
};

export const novoParaPrestador: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  // Lê a ficha do prestador: precisa também do módulo Prestadores.
  if (!podeNoPedido(req, "prestadores")) return Response.json({ error: "Sem acesso aos prestadores." }, { status: 403 });
  const id = req.routeParams?.prestador;
  if (!id) return Response.json({ error: "Falta o prestador." }, { status: 400 });

  const prestador = (await req.payload.findByID({ collection: "prestadores", id: String(id), depth: 0, overrideAccess: true }).catch(() => null)) as {
    id: number;
    nome?: string;
    email?: string;
  } | null;
  if (!prestador) return Response.json({ error: "Prestador não encontrado." }, { status: 404 });

  const criado = await req.payload.create({
    collection: "assinaturas",
    overrideAccess: true,
    data: {
      titulo: `NDA — ${prestador.nome ?? ""}`.trim(),
      tipo: "nda",
      origem: "modelo-nda",
      estado: "rascunho",
      prestador: prestador.id,
      signatarios: prestador.email ? [{ nome: prestador.nome ?? "", email: prestador.email, papel: "contraparte", estado: "pendente" }] : [],
    } as never,
  });
  return Response.json({ id: criado.id });
};

export const imagemJelly: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const { haImagemDaJelly } = await import("@/lib/assinaturas/imagem");
  return Response.json({ existe: await haImagemDaJelly() });
};
