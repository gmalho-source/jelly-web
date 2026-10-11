import { getPayload } from "payload";
import config from "@payload-config";

/** O Payload, para as rotas de quem assina (que não têm sessão no painel). */
export const cms = () => getPayload({ config });

/** O IP de quem assina, tal como a Vercel o vê. */
export function ipDe(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "desconhecido"
  );
}

export const navegadorDe = (request: Request) => request.headers.get("user-agent")?.slice(0, 300) ?? "desconhecido";

/** a.silva@exemplo.pt → a••••a@exemplo.pt: para mostrar sem expor. */
export function emailEscondido(email: string): string {
  const [nome, dominio] = email.split("@");
  if (!dominio) return email;
  const visivel = nome.length <= 2 ? nome[0] : `${nome[0]}${"•".repeat(Math.min(4, nome.length - 2))}${nome.at(-1)}`;
  return `${visivel}@${dominio}`;
}
