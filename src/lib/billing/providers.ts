import { normalizeEmail } from "./auth";

/**
 * Prestadores registados. Fonte temporária: variável de ambiente
 * BILLING_ALLOWED_EMAILS (lista separada por vírgulas). Passa para o board de
 * prestadores do Monday — ou para o Sanity — sem alterar a assinatura.
 */
export async function isRegisteredProvider(email: string): Promise<boolean> {
  const allowed = (process.env.BILLING_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);

  return allowed.includes(normalizeEmail(email));
}
