import { getCms } from "@/lib/payload/client";
import { normalizeEmail } from "./auth";

/**
 * Escreve uma linha no registo da área de prestadores (ver `RegistoFaturacao`
 * em src/payload/collections/prestadores.ts).
 *
 * Nada disto pode impedir alguém de entrar: uma falha a escrever fica no log
 * e não sobe. Corre depois da resposta (`after()` em quem chama), para quem
 * pediu o link não esperar por uma escrita na base.
 */
export type Evento =
  | "pedido"
  | "pedido-nao-prestador"
  | "pedido-limite"
  | "envio-falhou"
  | "aberto"
  | "entrada"
  | "expirado"
  | "usado"
  | "invalido"
  | "sem-ficha";

const DOZE_MESES = 365 * 24 * 60 * 60 * 1000;

export async function registaAcesso(
  evento: Evento,
  dados: { email?: string | null; pedidoEm?: Date | null; request?: { headers: { get(nome: string): string | null } }; detalhe?: string },
): Promise<void> {
  try {
    const payload = await getCms();
    if (!payload) return;
    const email = dados.email ? normalizeEmail(dados.email) : null;
    const ficha = email
      ? (
          await payload.find({ collection: "prestadores", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
        ).docs[0]
      : undefined;
    const agora = Date.now();
    await payload.create({
      collection: "registo-faturacao",
      data: {
        quando: new Date(agora).toISOString(),
        evento,
        email,
        prestador: ficha ? Number(ficha.id) : undefined,
        pedidoEm: dados.pedidoEm?.toISOString(),
        minutosDesdeOPedido: dados.pedidoEm ? Math.round((agora - dados.pedidoEm.getTime()) / 60_000) : undefined,
        ip: dados.request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        navegador: dados.request?.headers.get("user-agent")?.slice(0, 300) || undefined,
        detalhe: dados.detalhe,
      },
      overrideAccess: true,
    });
    // Doze meses chegam para perceber um caso; o resto sai.
    await payload.delete({
      collection: "registo-faturacao",
      where: { quando: { less_than: new Date(agora - DOZE_MESES).toISOString() } },
      overrideAccess: true,
    });
  } catch (erro) {
    console.error("[billing] o registo não ficou escrito", evento, erro);
  }
}
