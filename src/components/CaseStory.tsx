import Image from "next/image";
import type { Block } from "@/content/types";
import { CaseVideo } from "@/components/CaseVideo";

/** ID de um vídeo do YouTube, das duas formas em que o site antigo os guardava. */
function youtubeId(url: string): string | undefined {
  const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/.exec(url);
  return match?.[1];
}

/**
 * Um bloco da história.
 *
 * Vive fora do `CaseStory` porque as colunas o reutilizam: uma coluna é uma
 * história pequena dentro da grande, e desenhar o mesmo bloco de duas maneiras
 * conforme o sítio onde está seria ter dois desenhos para a mesma coisa.
 *
 * A margem de cima está em cada bloco e não no contentor, e é por isso que o
 * primeiro de cada coluna a perde (`first:mt-0`): dentro de uma coluna, o
 * primeiro bloco tem de alinhar com o primeiro da coluna do lado.
 */
function Bloco({ block, client, poster }: { block: Block; client: string; poster?: string }) {
  if (block.type === "h2") {
    return (
      <h2 className="mt-16 max-w-[24ch] text-chapter first:mt-0">
        {block.text}
      </h2>
    );
  }
  if (block.type === "h3") {
    return (
      <h3 className="mt-12 text-xl">
        {block.text}
      </h3>
    );
  }
  if (block.type === "p") {
    return (
      <p className="subtitle mt-5 max-w-[62ch]">
        {block.text}
      </p>
    );
  }
  if (block.type === "list") {
    return (
      <ul className="mt-5 flex max-w-[62ch] flex-col gap-2.5">
        {block.items.map((item, itemIndex) => (
          <li key={itemIndex} className="subtitle flex gap-3">
            <span aria-hidden="true" className="mt-3.5 block h-px w-4 shrink-0 bg-red" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (block.type === "image") {
    return (
      <figure className="mt-10">
        <Image
          src={block.src}
          alt={block.alt || client}
          width={1600}
          height={1000}
          className="w-full rounded-[20px] object-cover"
          sizes="(max-width: 1100px) 100vw, 1000px"
        />
        {block.caption ? <figcaption className="mt-3 text-sm text-fg-soft">{block.caption}</figcaption> : null}
      </figure>
    );
  }
  if (block.type === "gallery") {
    return (
      // Fita horizontal com paragem por imagem: mostra que há mais sem
      // encher a página, e funciona com o dedo tal como com a roda.
      <div
       
        className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 [scrollbar-width:thin]"
      >
        {block.images.map((image, imageIndex) => (
          <Image
            key={imageIndex}
            src={image.src}
            alt={image.alt || client}
            width={1200}
            height={900}
            className="h-[46vw] max-h-[420px] w-auto shrink-0 snap-start rounded-[20px] object-cover"
            sizes="(max-width: 900px) 80vw, 620px"
          />
        ))}
      </div>
    );
  }
  if (block.type === "video") {
    return (
      <div className="mt-10">
        {/* Sem primeiro fotograma, um vídeo é um retângulo negro à espera:
            usa-se a capa do projeto até haver poster próprio. */}
        <CaseVideo
        mp4={block.mp4}
        webm={block.webm}
        poster={block.poster ?? poster}
        portrait={block.portrait}
        modo={block.modo}
        label={client}
      />
      </div>
    );
  }
  if (block.type === "embed") {
    const id = youtubeId(block.url);
    if (!id) return null;
    return (
      <div className="mt-10 overflow-hidden rounded-[20px] bg-ink">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title={`${client} — vídeo`}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </div>
    );
  }
  if (block.type === "link") {
    return (
      <p className="mt-8">
        <a href={block.href} className="btn btn-ghost" target="_blank" rel="noreferrer noopener">
          {block.label} <span aria-hidden="true">↗</span>
        </a>
      </p>
    );
  }
  if (block.type === "columns") {
    // Uma coluna por peça, todas com a mesma largura, e no telemóvel empilhadas.
    // O `mt` do primeiro bloco de cada coluna cai, para as colunas alinharem
    // pelo topo em vez de cada uma começar onde calhar.
    const colunas = { 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" } as const;
    return (
      <div className={`mt-10 grid gap-6 ${colunas[block.columns.length as 2 | 3 | 4] ?? "sm:grid-cols-2"}`}>
        {block.columns.map((coluna, indice) => (
          <div key={indice} className="flex flex-col [&>*:first-child]:mt-0">
            {coluna.map((dentro, ordem) => (
              <Bloco key={ordem} block={dentro} client={client} poster={poster} />
            ))}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Narrativa de um caso: títulos de secção, texto, imagens, galerias e vídeos,
 * na ordem em que a história foi escrita.
 *
 * Segue o modelo das páginas de portfolio do jelly.pt — claim, corpo, secções
 * com media — mas no sistema da marca: Bree Serif nos títulos, Poppins no
 * corpo, medida curta, cor plana, cartões de 20 px. Sem texto por cima de
 * imagem e sem gradiente, que o design system não usa.
 */
export function CaseStory({ blocks, client, poster }: { blocks: Block[]; client: string; poster?: string }) {
  if (!blocks.length) return null;

  return (
    <div className="mt-14 flex flex-col">
      {blocks.map((block, index) => (
        <Bloco key={index} block={block} client={client} poster={poster} />
      ))}
    </div>
  );
}
