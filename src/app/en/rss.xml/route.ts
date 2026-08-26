import { feedDoBlog } from "@/lib/feed";

/** O mesmo, em inglês. Fora da árvore traduzida: um endereço com ponto não
 *  passa pelo middleware que traduz os caminhos. */
export async function GET() {
  return new Response(await feedDoBlog("en"), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
