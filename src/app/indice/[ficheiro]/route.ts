import { routing, type Locale } from "@/i18n/routing";
import { entradasDaProcura } from "@/lib/indice";

/**
 * As entradas que o índice procura mas não mostra, numa língua:
 * `/indice/pt.json` e `/indice/en.json`.
 *
 * Com extensão de propósito: o middleware das línguas não toca em caminhos com
 * ponto, e este não é uma página. Guardado cinco minutos na rede da Vercel — um
 * artigo novo aparece na procura pouco depois de publicado, e entretanto ninguém
 * paga o pedido ao servidor.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ ficheiro: string }> }) {
  const { ficheiro } = await params;
  const lingua = ficheiro.replace(/\.json$/, "") as Locale;
  if (!ficheiro.endsWith(".json") || !routing.locales.includes(lingua)) {
    return new Response("Não existe.", { status: 404 });
  }
  const entradas = await entradasDaProcura(lingua);
  return Response.json(entradas, {
    headers: { "cache-control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" },
  });
}
