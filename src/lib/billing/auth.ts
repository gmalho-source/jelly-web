import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

const ISSUER = "jelly-billing";
const MAGIC_AUDIENCE = "magic-link";
const SESSION_AUDIENCE = "session";

export const MAGIC_LINK_TTL_SECONDS = 15 * 60;
// Um dia. É uma página onde se submete uma fatura, não uma área onde se vive:
// quem voltar na semana seguinte pede outro link, que chega em segundos.
export const SESSION_TTL_SECONDS = 24 * 60 * 60;
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

export async function verifyMagicLink(token: string): Promise<{ email: string; jti: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: MAGIC_AUDIENCE });
    if (!payload.sub || !payload.jti) return null;
    return { email: payload.sub, jti: payload.jti };
  } catch {
    return null;
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
