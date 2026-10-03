import type { Locale } from "@/i18n/routing";
import { metadataDoArtigo, PaginaDeArtigo, paramsDaSeccao, type ParamsDoArtigo } from "@/components/PaginaDeArtigo";

/** Um artigo do newsroom. A página é a mesma do blog: ver `PaginaDeArtigo`. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  return paramsDaSeccao("newsroom", params.locale as Locale);
}

export function generateMetadata({ params }: { params: Promise<ParamsDoArtigo> }) {
  return metadataDoArtigo(params);
}

export default function Artigo({ params }: { params: Promise<ParamsDoArtigo> }) {
  return <PaginaDeArtigo params={params} pedida="newsroom" />;
}
