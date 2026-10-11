import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

/**
 * As chaves das assinaturas: a ligação pessoal de cada signatário e o código de
 * confirmação que lhe chega por email.
 *
 * Não pedem variável nova no ambiente. Derivam do PAYLOAD_SECRET com um rótulo
 * próprio — quem tiver uma ligação de assinatura não tem nada que sirva no
 * painel, e vice-versa.
 */
const EMISSOR = "jelly-assinaturas";
const AUDIENCIA = "signatario";

function chave(rotulo: string): Uint8Array {
  const base = process.env.PAYLOAD_SECRET?.trim();
  if (!base || base.length < 16) throw new Error("PAYLOAD_SECRET em falta: sem ele não há ligações de assinatura.");
  return new Uint8Array(createHmac("sha256", base).update(`assinaturas:${rotulo}`).digest());
}

export type Portador = { pedido: string; signatario: string };

/** A ligação pessoal de um signatário. Vale até à data de validade do pedido. */
export async function assinaLigacao({ pedido, signatario }: Portador, validade: Date): Promise<string> {
  return new SignJWT({ s: signatario })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(pedido)
    .setIssuer(EMISSOR)
    .setAudience(AUDIENCIA)
    .setIssuedAt()
    .setExpirationTime(Math.floor(validade.getTime() / 1000))
    .sign(chave("ligacao"));
}

export async function lerLigacao(token: string): Promise<Portador | null> {
  try {
    const { payload } = await jwtVerify(token, chave("ligacao"), { issuer: EMISSOR, audience: AUDIENCIA });
    const signatario = typeof payload.s === "string" ? payload.s : "";
    if (!payload.sub || !signatario) return null;
    return { pedido: payload.sub, signatario };
  } catch {
    return null;
  }
}

/** Seis algarismos, com o zero à esquerda quando calha. */
export function novoCodigo(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** O que se guarda do código: um resumo ligado ao signatário, nunca o código. */
export function resumoDoCodigo(codigo: string, signatario: string): string {
  return createHmac("sha256", chave("codigo")).update(`${signatario}:${codigo}`).digest("hex");
}

export function codigoCerto(codigo: string, signatario: string, guardado: string): boolean {
  const a = Buffer.from(resumoDoCodigo(codigo.replace(/\D/g, ""), signatario), "hex");
  const b = Buffer.from(guardado, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** A impressão digital de um ficheiro: é ela que prova que o PDF não mudou. */
export function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}
