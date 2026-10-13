import { feedDeTudo } from "@/lib/feed";

/** O mesmo, em inglês. */
export async function GET() {
  return new Response(await feedDeTudo("en"), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
