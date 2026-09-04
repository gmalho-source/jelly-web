import { normalizeEmail } from "./auth";
import { envOr } from "@/lib/env";
import { getCms } from "@/lib/payload/client";

/**
 * Quem é prestador.
 *
 * A resposta vem da coleção «Prestadores» do painel: existe uma ficha com este
 * email e o estado é «qualificado». Mais nada — o IBAN, o NIF e a morada que lá
 * estão nunca saem para este lado. Um prestador parado ou desqualificado tem
 * ficha e não entra; é a ficha que manda, no momento do clique.
 *
 * Sem base de dados configurada (desenvolvimento sem Postgres) vale a lista da
 * variável BILLING_ALLOWED_EMAILS, que foi a fonte antes de haver coleção.
 */
export type Prestador = { nome: string; email: string };

export async function findProvider(email: string): Promise<Prestador | null> {
  const normalizado = normalizeEmail(email);
  const payload = await getCms();
  if (!payload) {
    const allowed = envOr(process.env.BILLING_ALLOWED_EMAILS, "")
      .split(",")
      .map((entry) => normalizeEmail(entry))
      .filter(Boolean);
    return allowed.includes(normalizado) ? { nome: normalizado, email: normalizado } : null;
  }
  const { docs } = await payload.find({
    collection: "prestadores",
    where: { and: [{ email: { equals: normalizado } }, { estado: { equals: "qualificado" } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const doc = docs[0];
  return doc ? { nome: doc.nome, email: doc.email } : null;
}

export async function isRegisteredProvider(email: string): Promise<boolean> {
  return (await findProvider(email)) !== null;
}
