import type { PayloadHandler, PayloadRequest } from "payload";
import { enviaInstrucoes } from "@/lib/billing/instrucoes";
import { registaAcesso } from "@/lib/billing/registo";
import { podeNoPedido } from "../acesso";

type Ficha = { id: number; nome?: string | null; email?: string | null; estado?: string | null };

/** Quantas vezes as instruções saíram para esta ficha, e quando foi a última. */
async function envios(req: PayloadRequest, id: number) {
  const { docs, totalDocs } = await req.payload.find({
    collection: "registo-faturacao",
    where: { and: [{ prestador: { equals: id } }, { evento: { equals: "instrucoes" } }] },
    sort: "-quando",
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return { vezes: totalDocs, ultima: (docs[0] as { quando?: string } | undefined)?.quando ?? null };
}

async function ficha(req: PayloadRequest): Promise<Ficha | Response> {
  if (!req.user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  if (!podeNoPedido(req, "prestadores")) return Response.json({ error: "Sem acesso aos prestadores." }, { status: 403 });
  const id = Number(req.routeParams?.id);
  if (!id) return Response.json({ error: "Falta a ficha." }, { status: 400 });
  const doc = await req.payload.findByID({ collection: "prestadores", id, depth: 0, overrideAccess: true }).catch(() => null);
  if (!doc) return Response.json({ error: "Ficha não encontrada." }, { status: 404 });
  return doc as unknown as Ficha;
}

/**
 * GET /api/prestadores/:id/instrucoes — o que o botão mostra: quantas vezes
 * as instruções já saíram, e quando foi a última.
 */
export const estadoDasInstrucoes: PayloadHandler = async (req) => {
  const doc = await ficha(req);
  if (doc instanceof Response) return doc;
  return Response.json(await envios(req, doc.id));
};

/**
 * POST /api/prestadores/:id/instrucoes — manda as instruções de faturação ao
 * prestador, e escreve o envio no registo, tenha saído ou não.
 *
 * Usa o que está gravado na ficha, não o formulário: o email que recebe é o
 * mesmo que billing.jelly.pt vai procurar. E só com a ficha «Qualificado» —
 * com outro estado a entrada é recusada, e as instruções levavam a pessoa a
 * uma porta fechada.
 */
export const enviarInstrucoes: PayloadHandler = async (req) => {
  const doc = await ficha(req);
  if (doc instanceof Response) return doc;
  if (!doc.email) return Response.json({ error: "A ficha não tem email." }, { status: 422 });
  if (doc.estado !== "qualificado") {
    return Response.json(
      { error: "A ficha não está «Qualificado»: com este estado, billing.jelly.pt recusa a entrada. Muda o estado, grava, e envia depois." },
      { status: 409 },
    );
  }

  const quem = String((req.user as { name?: string; email?: string } | null)?.name || req.user?.email || "alguém");
  const resultado = await enviaInstrucoes({ nome: String(doc.nome ?? ""), email: doc.email });
  // Sem chave de email (num ambiente de testes) não saiu nada, e o registo diz
  // isso mesmo: um envio que só foi para o log não é um envio.
  const saiu = resultado.ok && resultado.via !== "log";
  await registaAcesso(saiu ? "instrucoes" : "instrucoes-falhou", {
    // Sem IP nem browser: seriam os de quem carregou no botão, e nesta lista
    // essas colunas são do prestador.
    email: doc.email,
    detalhe: (saiu ? `Enviado por ${quem}` : `Tentado por ${quem}: ${resultado.erro ?? "sem razão"}`).slice(0, 300),
  });

  if (!saiu) return Response.json({ error: `O email não saiu: ${resultado.erro ?? "sem razão"}` }, { status: 502 });
  return Response.json({ ok: true, para: doc.email, ...(await envios(req, doc.id)) });
};
