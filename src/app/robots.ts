import type { MetadataRoute } from "next";
import { SITE_URL, isIndexable } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  // Fora do domínio público (staging, previews) não se indexa nada.
  if (!isIndexable) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }

  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/billing/"] }],
    // Sem `host`: era uma directiva do Yandex que o Google ignora, e ignorar
    // com aviso é pior do que não estar lá. Quem manda no domínio preferido é
    // o redireccionamento de jelly.pt para www e a etiqueta canónica.
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
