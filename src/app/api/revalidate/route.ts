import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/sanity/client";
import { env } from "@/lib/env";

/**
 * Webhook do Sanity. Publicar no Studio invalida a etiqueta do conteúdo e o
 * site relê o CMS no pedido seguinte — sem esperar pelos 300 segundos de cache
 * nem por um deploy novo.
 *
 * No Sanity: API → Webhooks → URL desta rota, método POST, e o segredo em
 * `Authorization: Bearer <SANITY_REVALIDATE_SECRET>`. Dataset e trigger em
 * create/update/delete, projeção vazia — não usamos o corpo do pedido.
 */
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = env(process.env.SANITY_REVALIDATE_SECRET);
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : (request.headers.get("x-jelly-secret") ?? "");
  const expected = Buffer.from(secret);
  const given = Buffer.from(provided);
  // Comparação de tempo constante, e sem revelar o comprimento do segredo.
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!env(process.env.SANITY_REVALIDATE_SECRET)) {
    return Response.json({ ok: false, error: "SANITY_REVALIDATE_SECRET não está definido." }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // "max" no Next 16: expira tudo o que leva esta etiqueta, não só o que está velho.
  revalidateTag(CMS_TAG, "max");
  return Response.json({ ok: true, revalidated: CMS_TAG });
}
