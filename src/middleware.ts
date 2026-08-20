import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { BILLING_HOST, isBillingHost, isLocalHost } from "@/lib/hosts";

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

  // Fora do subdomínio, /billing/* não existe: manda para o host certo.
  if (pathname.startsWith("/billing")) {
    if (isLocalHost(host)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.host = BILLING_HOST;
    url.protocol = "https";
    url.port = "";
    url.pathname = pathname.replace(/^\/billing/, "") || "/";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/api")) return NextResponse.next();

  return handleI18n(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)"],
};
