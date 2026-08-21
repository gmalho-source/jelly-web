import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { env } from "@/lib/env";

/**
 * Purga manual do site. O painel já revalida sozinho o que muda (ver
 * src/payload/hooks/revalidate.ts); esta rota existe para os casos em que se
 * quer forçar tudo — uma migração, uma mudança de estrutura.
 *
 *   curl -X POST https://<host>/api/revalidate -H "Authorization: Bearer $SEGREDO"
 */
export const dynamic = "force-dynamic";

function authorized(request: Request): boolean {
  const secret = env(process.env.REVALIDATE_SECRET);
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided =
    (header.startsWith("Bearer ") ? header.slice(7) : request.headers.get("x-jelly-secret")) ??
    new URL(request.url).searchParams.get("secret") ??
    "";

  const expected = Buffer.from(secret);
  const given = Buffer.from(provided);
  // Comparação de tempo constante, e sem revelar o comprimento do segredo.
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(request: Request) {
  if (!env(process.env.REVALIDATE_SECRET)) {
    return Response.json({ ok: false, error: "REVALIDATE_SECRET não está definido." }, { status: 503 });
  }
  if (!authorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  // "layout" apanha tudo o que vive debaixo da raiz de cada língua.
  revalidatePath("/", "layout");
  revalidatePath("/en", "layout");
  return Response.json({ ok: true, revalidated: "site" });
}
