import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { isBillingHost } from "@/lib/hosts";
import { legacyDestination } from "@/lib/legacy";

const handleI18n = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;

  // billing.jelly.pt serve as rotas internas /billing/* sem as expor no URL.
  if (isBillingHost(host)) {
    if (pathname.startsWith("/billing")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/billing${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Em qualquer outro host a área de faturação responde aqui mesmo, em /billing.
  // Não se redireciona para o subdomínio: enquanto billing.jelly.pt apontar para
  // o site antigo, a página tem de existir neste; e quando ele apontar para aqui,
  // um 301 de lá para /billing não pode encontrar um 302 a mandá-lo de volta.
  if (pathname.startsWith("/billing")) return NextResponse.next();

  if (pathname.startsWith("/api")) return NextResponse.next();

  // O painel do Payload não tem árvore de línguas: passa ao lado do next-intl.
  if (pathname.startsWith("/admin")) return NextResponse.next();

  // A proposta visual vive fora das duas árvores de língua: é um ecrã para ver,
  // não uma página do site.
  if (pathname.startsWith("/proposta")) return NextResponse.next();

  // Os endereços do site antigo, antes da árvore de línguas: um artigo antigo
  // não é um caminho português, é um 301 à espera de acontecer.
  const legacy = legacyDestination(pathname);
  if (legacy) {
    const url = request.nextUrl.clone();
    url.pathname = legacy;
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
