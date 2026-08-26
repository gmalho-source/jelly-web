import { feedDoBlog } from "@/lib/feed";

/** O feed em português, na raiz — como estava no site antigo. */
export async function GET() {
  return new Response(await feedDoBlog("pt"), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      // Uma hora de cache no CDN, e mais um dia a servir o antigo enquanto
      // revalida: um leitor de feeds bate a esta porta muitas vezes por dia.
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
