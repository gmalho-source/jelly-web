import type { Block, Span } from "@/content/types";
import { resolveImage, type SanityImage } from "./image";

type PtSpan = { _type: "span"; text?: string; marks?: string[] };
type PtChild = PtSpan | { _type: string; [key: string]: unknown };
type MarkDef = { _key: string; _type: string; href?: string };

type FlatImage = { src?: string | null; alt?: string | null; caption?: string | null };

export type PortableTextBlock =
  | {
      _type: "block";
      style?: string;
      listItem?: string;
      children?: PtChild[];
      markDefs?: MarkDef[];
    }
  | ({ _type: "image" | "coverImage" } & NonNullable<SanityImage> & FlatImage)
  | { _type: "galleryBlock"; images?: (FlatImage | null)[] | null }
  | { _type: "videoBlock"; mp4?: string | null; webm?: string | null; portrait?: boolean | null; poster?: FlatImage | null }
  | { _type: "embedBlock"; url?: string | null }
  | { _type: "linkBlock"; label?: string | null; href?: string | null };

function isSpan(child: PtChild): child is PtSpan {
  return child._type === "span";
}

function plain(block: Extract<PortableTextBlock, { _type: "block" }>): string {
  return (block.children ?? [])
    .filter(isSpan)
    .map((child) => child.text ?? "")
    .join("")
    .trim();
}

/** Guarda negrito, itálico e links; o resto do Portable Text não se usa aqui. */
function spans(block: Extract<PortableTextBlock, { _type: "block" }>): Span[] | undefined {
  const marks = new Map((block.markDefs ?? []).map((def) => [def._key, def]));
  const out: Span[] = [];
  for (const child of block.children ?? []) {
    if (!isSpan(child) || !child.text) continue;
    const span: Span = { text: child.text };
    for (const mark of child.marks ?? []) {
      if (mark === "strong") span.bold = true;
      else if (mark === "em") span.italic = true;
      else {
        const def = marks.get(mark);
        if (def?._type === "link" && def.href) span.href = def.href;
      }
    }
    out.push(span);
  }
  const decorated = out.some((span) => span.bold || span.italic || span.href);
  return decorated ? out : undefined;
}

/**
 * Portable Text → os blocos que o ArticleBody desenha. Itens de lista
 * consecutivos juntam-se numa lista só, que é como saem do editor.
 */
export function toBlocks(input: PortableTextBlock[] | undefined | null): Block[] {
  const blocks: Block[] = [];
  if (!input) return blocks;

  for (const node of input) {
    if (node._type === "image" || node._type === "coverImage") {
      // O CMS pode devolver o endereço já resolvido (projeção da consulta) ou a
      // referência do asset (Portable Text cru).
      const flat = node as FlatImage;
      const image = flat.src ? { src: flat.src, alt: flat.alt ?? undefined, caption: flat.caption ?? undefined } : resolveImage(node as SanityImage, 1600);
      if (image?.src) blocks.push({ type: "image", src: image.src, alt: image.alt, caption: image.caption });
      continue;
    }
    if (node._type === "galleryBlock") {
      const images = (node.images ?? [])
        .filter((image): image is FlatImage & { src: string } => Boolean(image?.src))
        .map((image) => ({ src: image.src, alt: image.alt ?? undefined }));
      if (images.length) blocks.push({ type: "gallery", images });
      continue;
    }
    if (node._type === "videoBlock") {
      if (node.mp4 || node.webm) {
        blocks.push({
          type: "video",
          mp4: node.mp4 ?? undefined,
          webm: node.webm ?? undefined,
          poster: node.poster?.src ?? undefined,
          portrait: node.portrait ?? undefined,
        });
      }
      continue;
    }
    if (node._type === "embedBlock") {
      if (node.url) blocks.push({ type: "embed", url: node.url });
      continue;
    }
    if (node._type === "linkBlock") {
      if (node.label && node.href) blocks.push({ type: "link", label: node.label, href: node.href });
      continue;
    }
    if (node._type !== "block") continue;

    const text = plain(node);
    if (!text) continue;

    if (node.listItem) {
      const ordered = node.listItem === "number";
      const last = blocks[blocks.length - 1];
      if (last?.type === "list" && Boolean(last.ordered) === ordered) {
        last.items.push(text);
      } else {
        blocks.push({ type: "list", ordered: ordered || undefined, items: [text] });
      }
      continue;
    }

    if (node.style === "h2" || node.style === "h3") {
      blocks.push({ type: node.style, text });
      continue;
    }
    if (node.style === "blockquote") {
      blocks.push({ type: "quote", text });
      continue;
    }
    blocks.push({ type: "p", text, spans: spans(node) });
  }

  return blocks;
}
