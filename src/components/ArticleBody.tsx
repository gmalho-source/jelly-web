import Image from "next/image";
import type { Block } from "@/content/types";

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
              {block.text}
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
              <Image
                src={block.src}
                alt={block.alt ?? ""}
                width={1200}
                height={675}
                className="w-full rounded-[20px] object-cover"
                sizes="(max-width: 900px) 100vw, 720px"
              />
              {block.caption ? <figcaption className="mt-3 text-sm text-mute">{block.caption}</figcaption> : null}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
