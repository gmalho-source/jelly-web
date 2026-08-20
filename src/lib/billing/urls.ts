import { BILLING_HOST, isBillingHost } from "@/lib/hosts";

/**
 * Constrói URLs da área de faturação. Em produção o host é billing.jelly.pt e as
 * rotas internas /billing/* aparecem sem prefixo; em desenvolvimento o prefixo
 * fica visível (localhost:3000/billing/...).
 */
export function billingUrl(request: Request, path: string): string {
  const host = request.headers.get("host") ?? BILLING_HOST;
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const prefix = isBillingHost(host) ? "" : "/billing";
  return `${protocol}://${host}${prefix}${path}`;
}

export function billingPath(request: Request, path: string): string {
  const host = request.headers.get("host") ?? BILLING_HOST;
  return isBillingHost(host) ? path : `/billing${path}`;
}
