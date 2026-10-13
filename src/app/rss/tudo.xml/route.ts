import { feedDeTudo } from "@/lib/feed";

/** O blog e o newsroom juntos, em português: o feed da newsletter no Brevo. */
export async function GET() {
  return new Response(await feedDeTudo("pt"), {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
