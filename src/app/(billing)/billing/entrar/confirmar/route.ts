import { NextResponse, after, type NextRequest } from "next/server";
import { MAGIC_LINK_TTL_SECONDS, lerLink } from "@/lib/billing/auth";
import { isRegisteredProvider } from "@/lib/billing/providers";
import { registaAcesso } from "@/lib/billing/registo";
import { startSession } from "@/lib/billing/session";
import { consumeToken } from "@/lib/billing/store";
import { billingUrl } from "@/lib/billing/urls";

export const runtime = "nodejs";

/**
 * O botão «Entrar» da página do link: é aqui, e só aqui, que o link se gasta.
 * As respostas são redireções (303, para o browser seguir com um GET), e cada
 * falha diz qual foi, para a página de entrada mostrar a mensagem certa.
 */
export async function POST(request: NextRequest) {
  const para = (caminho: string) => NextResponse.redirect(billingUrl(request, caminho), { status: 303 });
  let token = "";
  try {
    token = String((await request.formData()).get("t") ?? "");
  } catch {
    return para("/?erro=link");
  }

  const leitura = await lerLink(token);
  if (leitura.estado === "invalido") {
    after(() => registaAcesso("invalido", { request, detalhe: "ao entrar" }));
    return para("/?erro=link");
  }
  if (leitura.estado === "expirado") {
    after(() => registaAcesso("expirado", { email: leitura.email, pedidoEm: leitura.pedidoEm, request, detalhe: "ao entrar" }));
    return para("/?erro=expirado");
  }

  // Uso único: o mesmo link não abre duas vezes.
  if (!(await consumeToken(leitura.jti, MAGIC_LINK_TTL_SECONDS))) {
    after(() => registaAcesso("usado", { email: leitura.email, pedidoEm: leitura.pedidoEm, request, detalhe: "ao entrar" }));
    return para("/?erro=usado");
  }

  // A ficha pode ter mudado entre o pedido e o clique.
  if (!(await isRegisteredProvider(leitura.email))) {
    after(() => registaAcesso("sem-ficha", { email: leitura.email, pedidoEm: leitura.pedidoEm, request }));
    return para("/?erro=link");
  }

  await startSession(leitura.email);
  after(() => registaAcesso("entrada", { email: leitura.email, pedidoEm: leitura.pedidoEm, request }));
  return para("/faturacao");
}
