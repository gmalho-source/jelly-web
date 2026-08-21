import Image from "next/image";
import type { Block, Span } from "@/content/types";

/** Negrito, itálico e links escritos no CMS. O texto migrado não tem marcação. */
function Inline({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, index) => {
        const content = span.bold ? <strong className="font-semibold">{span.text}</strong> : span.italic ? <em>{span.text}</em> : span.text;
        if (span.href) {
          return (
            <a key={index} href={span.href} className="text-red underline decoration-1 underline-offset-2 hover:no-underline">
              {content}
            </a>
          );
        }
        return <span key={index}>{content}</span>;
      })}
    </>
  );
}

/**
 * Corpo de artigo migrado do WordPress. Lora, medida de 66 caracteres,
 * capitular vermelha no primeiro parágrafo.
 */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  // Índice do primeiro parágrafo: é o que leva capitular.
  const dropCapIndex = blocks.findIndex((block) => block.type === "p");

  return (
    <div className="max-w-[66ch]">
      {blocks.map((block, index) => {
        if (block.type === "p") {
          const isFirst = index === dropCapIndex;
          return (
            <p
              key={index}
              className={`reading ${isFirst ? "first-letter:float-left first-letter:pr-2 first-letter:font-reading first-letter:text-[3.2em] first-letter:font-semibold first-letter:leading-[0.86] first-letter:text-red" : "mt-6"}`}
            >
              {block.spans ? <Inline spans={block.spans} /> : block.text}
            </p>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={index} className="mt-12 text-chapter">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} className="mt-10 text-xl">
              {block.text}
            </h3>
          );
        }
        if (block.type === "quote") {
          return (
            <blockquote key={index} className="my-8 border-l-2 border-red pl-5">
              <p className="reading italic">{block.text}</p>
            </blockquote>
          );
        }
        if (block.type === "list") {
          const List = block.ordered ? "ol" : "ul";
          return (
            <List key={index} className="mt-6 flex flex-col gap-2.5">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="reading flex gap-3">
                  <span aria-hidden="true" className="mt-4 block h-px w-4 shrink-0 bg-red" />
                  <span>{item}</span>
                </li>
              ))}
            </List>
          );
        }
        if (block.type === "image" && block.src) {
          return (
            <figure key={index} className="my-10">
              {/* As medidas vêm da imagem: cortar uma infografia a 16:9 é
                  perder metade do que ela diz. */}
              <Image
                src={block.src}
                alt={block.alt ?? ""}
                width={block.width ?? 1200}
                height={block.height ?? 675}
                className="h-auto w-full rounded-[20px]"
                sizes="(max-width: 900px) 100vw, 720px"
              />
              {block.caption ? <figcaption className="mt-3 text-sm text-fg-soft">{block.caption}</figcaption> : null}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
