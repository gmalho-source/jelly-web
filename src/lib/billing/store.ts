/**
 * Estado de curta duração do fluxo de magic link: tokens já gastos e contadores
 * de pedidos. A implementação em memória serve desenvolvimento e uma instância
 * única; em produção na Vercel trocar por Upstash Redis (ou KV equivalente)
 * mantendo estas duas funções.
 */
type Entry = { expiresAt: number };

const usedTokens = new Map<string, Entry>();
const attempts = new Map<string, { count: number; resetAt: number }>();

function sweep(now: number) {
  for (const [key, entry] of usedTokens) if (entry.expiresAt <= now) usedTokens.delete(key);
  for (const [key, entry] of attempts) if (entry.resetAt <= now) attempts.delete(key);
}

/** Marca o token como gasto. Devolve false se já tinha sido usado. */
export function consumeToken(jti: string, ttlSeconds: number): boolean {
  const now = Date.now();
  sweep(now);
  if (usedTokens.has(jti)) return false;
  usedTokens.set(jti, { expiresAt: now + ttlSeconds * 1000 });
  return true;
}

export function withinRateLimit(key: string, limit: number, windowSeconds: number): boolean {
  const now = Date.now();
  sweep(now);
  const entry = attempts.get(key);
  if (!entry) {
    attempts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}
