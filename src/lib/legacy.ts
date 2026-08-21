import generated from "@/lib/redirects.generated.json";

/**
 * Os endereços do site antigo.
 *
 * São quase mil, e um mapa no middleware resolve-os numa procura em vez de
 * quase mil rotas no `next.config` — o próprio Next avisa acima de mil ("this
 * can reduce performance"), e a maioria eram variações da mesma família.
 *
 * As famílias ficam em duas regras: a paginação dos arquivos do WordPress
 * (`/qualquer-coisa/page/2`) e os feeds (`/qualquer-coisa/feed`) resolvem-se a
 * partir do endereço base, e só caem no índice do blog quando o base também
 * não é conhecido.
 */
const exact = new Map((generated as { source: string; destination: string }[]).map((row) => [row.source, row.destination]));

const trim = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

export function legacyDestination(pathname: string): string | undefined {
  const clean = trim(pathname);
  const direct = exact.get(clean);
  if (direct) return direct;

  // /arquivo/page/2 → o que o arquivo dá, ou o índice do blog.
  const paged = /^(.*)\/page\/\d+$/.exec(clean);
  if (paged) return exact.get(trim(paged[1])) ?? (paged[1] ? "/blog" : "/");

  // /artigo/feed → o artigo. /feed de qualquer arquivo → o índice.
  const feed = /^(.*)\/feed$/.exec(clean);
  if (feed) return exact.get(trim(feed[1])) ?? "/blog";

  // Arquivos por autor: o site novo não os tem, e o índice do blog serve.
  if (clean === "/author" || clean.startsWith("/author/")) return "/blog";

  return undefined;
}
