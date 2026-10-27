import { SignJWT, errors, jwtVerify } from "jose";
import { env } from "@/lib/env";

const ISSUER = "jelly-billing";
const MAGIC_AUDIENCE = "magic-link";
const SESSION_AUDIENCE = "session";

// Duas horas. Eram quinze minutos, e não chegavam: os emails para o iCloud
// chegaram a demorar mais de uma hora entre o Brevo e a caixa de quem pediu
// (outubro de 2026, 1h07 e 1h26 em dois pedidos seguidos). O link continua a
// ser de uso único, e só se gasta no botão «Entrar».
export const MAGIC_LINK_TTL_SECONDS = 2 * 60 * 60;
// Trinta dias no mesmo browser. Com um dia, quem fatura uma vez por mês
// precisava de um link de cada vez — e cada link é um email que pode atrasar.
// A ficha volta a ser lida em cada página: um prestador desativado deixa de
// entrar no momento seguinte, com sessão ou sem ela.
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_COOKIE = "jelly_billing_session";

function secret(): Uint8Array {
  const value = env(process.env.BILLING_AUTH_SECRET);
  if (!value || value.length < 32) {
    throw new Error("BILLING_AUTH_SECRET em falta ou com menos de 32 caracteres.");
  }
  return new TextEncoder().encode(value);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Token de uso único que autoriza a entrada. Vai dentro do link enviado por email. */
export async function signMagicLink(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(normalizeEmail(email))
    .setIssuer(ISSUER)
    .setAudience(MAGIC_AUDIENCE)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime(`${MAGIC_LINK_TTL_SECONDS}s`)
    .sign(secret());
}

export type LeituraDoLink =
  | { estado: "valido"; email: string; jti: string; pedidoEm: Date }
  | { estado: "expirado"; email: string | null; pedidoEm: Date | null }
  | { estado: "invalido" };

/**
 * O que um link diz de si: se vale, se já passou do prazo, ou se não é nosso.
 *
 * Um link expirado continua a dizer de quem é e quando foi pedido — a
 * assinatura está certa, só o prazo passou —, e é isso que deixa a página
 * dizer «este link era de há três horas» e o registo guardar de quem era.
 */
export async function lerLink(token: string): Promise<LeituraDoLink> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: MAGIC_AUDIENCE });
    if (!payload.sub || !payload.jti || !payload.iat) return { estado: "invalido" };
    return { estado: "valido", email: payload.sub, jti: payload.jti, pedidoEm: new Date(payload.iat * 1000) };
  } catch (erro) {
    // A assinatura já foi verificada quando o prazo falha, mas o emissor e o
    // destino podem ainda não ter sido: confirma-se aqui que é um link nosso, e
    // não uma sessão vencida.
    if (erro instanceof errors.JWTExpired && erro.payload.iss === ISSUER && [erro.payload.aud].flat().includes(MAGIC_AUDIENCE)) {
      const { sub, iat } = erro.payload;
      return { estado: "expirado", email: sub ?? null, pedidoEm: iat ? new Date(iat * 1000) : null };
    }
    return { estado: "invalido" };
  }
}

export async function signSession(email: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(normalizeEmail(email))
    .setIssuer(ISSUER)
    .setAudience(SESSION_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: SESSION_AUDIENCE });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}
