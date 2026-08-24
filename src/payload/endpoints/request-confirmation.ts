import type { PayloadHandler } from "payload";
import { pedeConfirmacao } from "@/lib/pede-confirmacao";

/**
 * POST /api/applications/:id/confirmacao
 *
 * O pedido de confirmação disparado à mão, no painel. É a porta A: um currículo
 * entregue em mão pode já ter vindo com autorização, e por isso aqui não sai
 * nada sem alguém carregar — ao contrário do email reenviado, onde sai sozinho.
 */
export const requestConfirmation: PayloadHandler = async (req) => {
  const user = req.user as { roles?: string[] | null } | undefined;
  if (!user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  const perfis = user.roles ?? [];
  if (perfis.length && !perfis.includes("admin") && !perfis.includes("recrutamento")) {
    return Response.json({ error: "Isto é para quem trata de recrutamento." }, { status: 403 });
  }

  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Sem ficha." }, { status: 400 });

  const ficha = await req.payload.findByID({ collection: "applications", id: String(id), depth: 1 });
  if (!ficha) return Response.json({ error: "Candidatura não encontrada." }, { status: 404 });

  const lingua = new URL(req.url ?? "http://localhost").searchParams.get("lingua") === "en" ? "en" : "pt";
  const feito = await pedeConfirmacao(req.payload, ficha as never, lingua);
  if (!feito.ok) return Response.json({ error: feito.erro ?? "Não deu." }, { status: 502 });

  return Response.json({ ok: true, para: ficha.email });
};
