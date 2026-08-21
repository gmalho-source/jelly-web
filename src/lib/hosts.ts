import { envOr } from "@/lib/env";

/** Host do subdomínio de faturação. Configurável para dev e para ambientes de preview. */
export const BILLING_HOST = envOr(process.env.NEXT_PUBLIC_BILLING_HOST, "billing.jelly.pt");

/** Em desenvolvimento aceitamos billing.localhost e o prefixo /billing direto. */
export function isBillingHost(host: string): boolean {
  const clean = host.split(":")[0].toLowerCase();
  return clean === BILLING_HOST.toLowerCase() || clean === "billing.localhost";
}

/** Em local (dev ou build de produção corrido na máquina) /billing responde no próprio host. */
export function isLocalHost(host: string): boolean {
  const clean = host.split(":")[0].toLowerCase();
  return clean === "localhost" || clean === "127.0.0.1" || clean.endsWith(".local");
}
