import { getCms } from "@/lib/payload/client";

/**
 * Estado de curta duração do fluxo de magic link: tokens já gastos e contadores
 * de pedidos.
 *
 * Guarda-se na base de dados, nas duas coleções escondidas do Payload. A versão
 * anterior era um Map em memória: servia numa máquina só, e na Vercel não —
 * cada pedido pode cair numa instância diferente, e um link gasto numa podia
 * abrir outra vez noutra. Sem base de dados configurada (desenvolvimento sem
 * Postgres) volta à memória, que é o que havia.
 */
type Entry = { expiresAt: number };
const memTokens = new Map<string, Entry>();
const memAttempts = new Map<string, { count: number; resetAt: number }>();

const TOKENS = "billing-tokens" as const;
const ATTEMPTS = "billing-attempts" as const;

/** Marca o token como gasto. Devolve false se já tinha sido usado. */
export async function consumeToken(jti: string, ttlSeconds: number): Promise<boolean> {
  const now = Date.now();
  const payload = await getCms();
  if (!payload) {
    for (const [k, e] of memTokens) if (e.expiresAt <= now) memTokens.delete(k);
    if (memTokens.has(jti)) return false;
    memTokens.set(jti, { expiresAt: now + ttlSeconds * 1000 });
    return true;
  }
  // Varrer o que já expirou: os tokens duram quinze minutos e não vale a pena
  // guardá-los para além disso.
  await payload.delete({ collection: TOKENS, where: { expiresAt: { less_than: new Date(now).toISOString() } }, overrideAccess: true });
  try {
    // É a restrição de unicidade que decide, e não uma leitura antes da escrita:
    // duas instâncias a tentar ao mesmo tempo, só uma consegue.
    await payload.create({
      collection: TOKENS,
      data: { jti, expiresAt: new Date(now + ttlSeconds * 1000).toISOString() },
      overrideAccess: true,
    });
    return true;
  } catch {
    return false;
  }
}

export async function withinRateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Date.now();
  const payload = await getCms();
  if (!payload) {
    for (const [k, e] of memAttempts) if (e.resetAt <= now) memAttempts.delete(k);
    const e = memAttempts.get(key);
    if (!e) {
      memAttempts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return true;
    }
    if (e.count >= limit) return false;
    e.count += 1;
    return true;
  }
  const existente = await payload.find({ collection: ATTEMPTS, where: { chave: { equals: key } }, limit: 1, overrideAccess: true });
  const doc = existente.docs[0];
  const janelaNova = { chave: key, count: 1, resetAt: new Date(now + windowSeconds * 1000).toISOString() };
  if (!doc) {
    try {
      await payload.create({ collection: ATTEMPTS, data: janelaNova, overrideAccess: true });
    } catch {
      // Outra instância criou-o no mesmo instante: conta como um pedido feito.
    }
    return true;
  }
  if (new Date(doc.resetAt).getTime() <= now) {
    await payload.update({ collection: ATTEMPTS, id: doc.id, data: janelaNova, overrideAccess: true });
    return true;
  }
  if (doc.count >= limit) return false;
  await payload.update({ collection: ATTEMPTS, id: doc.id, data: { count: doc.count + 1 }, overrideAccess: true });
  return true;
}
