import type { MetadataRoute } from "next";
import { SITE_URL, isIndexable } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Fora do domínio público (staging, previews) não se indexa nada.
  if (!isIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/billing/"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
