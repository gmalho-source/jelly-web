import { dataset, projectId } from "../../../sanity/env";

type AssetRef = { _ref?: string; url?: string } | undefined;

export type SanityImage = {
  alt?: string;
  caption?: string;
  asset?: AssetRef;
} | null;

export type ResolvedImage = { src: string; alt?: string; caption?: string; width?: number; height?: number };

/**
 * Constrói o URL do CDN a partir da referência do asset
 * (image-<id>-<largura>x<altura>-<extensão>), sem depender de @sanity/image-url.
 * Traz as dimensões de borla, que é o que o next/image precisa.
 */
export function resolveImage(image: SanityImage, width?: number): ResolvedImage | undefined {
  if (!image?.asset) return undefined;
  const direct = image.asset.url;
  const ref = image.asset._ref;
  if (!ref && !direct) return undefined;

  let src = direct ?? "";
  let dimensions: { width: number; height: number } | undefined;

  if (ref) {
    const match = /^image-([0-9a-f]+)-(\d+)x(\d+)-(\w+)$/.exec(ref);
    if (!match) return direct ? { src: direct, alt: image.alt, caption: image.caption } : undefined;
    const [, id, w, h, extension] = match;
    src = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${w}x${h}.${extension}`;
    dimensions = { width: Number(w), height: Number(h) };
  }

  if (width) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("auto", "format");
    src = url.toString();
  }

  return { src, alt: image.alt, caption: image.caption, ...dimensions };
}
