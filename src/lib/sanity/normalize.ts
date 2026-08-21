import type { Block, Span } from "@/content/types";
import { resolveImage, type SanityImage } from "./image";

type PtSpan = { _type: "span"; text?: string; marks?: string[] };
type PtChild = PtSpan | { _type: string; [key: string]: unknown };
type MarkDef = { _key: string; _type: string; href?: string };

export type PortableTextBlock =
  | {
      _type: "block";
      style?: string;
      listItem?: string;
      children?: PtChild[];
      markDefs?: MarkDef[];
    }
  | ({ _type: "image" | "coverImage" } & NonNullable<SanityImage>);

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
      const image = resolveImage(node as SanityImage, 1600);
      if (image) blocks.push({ type: "image", src: image.src, alt: image.alt, caption: image.caption });
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
