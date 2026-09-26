import Image from "next/image";
import type { Block } from "@/content/types";
import { CaseVideo } from "@/components/CaseVideo";
import { Galeria, type TextosDaGaleria } from "@/components/Galeria";

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
function Bloco({ block, client, poster, textos }: { block: Block; client: string; poster?: string; textos: TextosDaGaleria }) {
  if (block.type === "h2") {
    return (
      <h2 className="mt-16 max-w-[24ch] text-chapter">
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
    // A fita e a lente que a abre em grande vivem no `Galeria`: é a única
    // parte de um caso que precisa de estado no cliente.
    return <Galeria imagens={block.images} cliente={client} textos={textos} />;
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
              <Bloco key={ordem} block={dentro} client={client} poster={poster} textos={textos} />
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
export function CaseStory({
  blocks,
  client,
  poster,
  textos,
}: {
  blocks: Block[];
  client: string;
  poster?: string;
  /** Os rótulos da lente da galeria, já na língua da página. */
  textos: TextosDaGaleria;
}) {
  if (!blocks.length) return null;

  return (
    // A margem de cima cai só no primeiro bloco da história, por aqui. Era o
    // título que a tirava a si próprio (`first:mt-0`), mas desde que cada bloco
    // vem dentro de um invólucro todos os títulos são o primeiro do seu — e
    // colavam à imagem de cima.
    <div className="mt-14 flex flex-col [&>:first-child>*]:mt-0">
      {/* Cada bloco chega quando assoma: sobe 32px e acende, com o vocabulário
          da casa. O invólucro não mexe no desenho — a margem do bloco atravessa-o
          — e é nele que fica o `transform`, para não tocar no que cada bloco
          faz por dentro. A lente da galeria sai daqui por um portal: com um
          `transform` à volta, um `fixed` deixava de ser o ecrã. */}
      {/* O primeiro fica quieto: logo a seguir à ficha, está quase sempre à
          vista quando a página abre — e o que está no ecrã à chegada não se
          anima. `entra-alto` e não `entra`: um bloco de imagem pode ter 700px,
          e a janela do `entra` cresce com a altura. */}
      {blocks.map((block, index) => (
        <div key={index} className={index === 0 ? undefined : "entra-alto"}>
          <Bloco block={block} client={client} poster={poster} textos={textos} />
        </div>
      ))}
    </div>
  );
}
