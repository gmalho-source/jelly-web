import Image from "next/image";
import type { Block, Span } from "@/content/types";
import { Galeria, type TextosDaGaleria } from "@/components/Galeria";
import { Inline } from "@/components/Marcado";
import { VideoEmbed } from "@/components/VideoEmbed";
import { fonteDeVideo, videoDeParagrafo } from "@/lib/video";

/**
 * Corpo de artigo migrado do WordPress. Lora, medida de 66 caracteres,
 * capitular vermelha no primeiro parágrafo.
 */
export function ArticleBody({
  blocks,
  galeria,
}: {
  blocks: Block[];
  /** Os rótulos da galeria e o nome para as imagens sem texto alternativo. Sem eles, as galerias não se desenham. */
  galeria?: { textos: TextosDaGaleria; rotulo: string };
}) {
  // Um parágrafo que é só o endereço de um vídeo é um vídeo. Trata-se aqui, à
  // entrada, e não em cada conversor: assim vale para o que se escreve no
  // painel, para o Markdown importado e para os artigos que vieram do site
  // antigo com o endereço do ficheiro a nu no meio do texto.
  const body: Block[] = blocks.map((block) =>
    block.type === "p" && !block.spans && videoDeParagrafo(block.text)
      ? { type: "embed", url: block.text.trim() }
      : block,
  );

  // Índice do primeiro parágrafo: é o que leva capitular.
  const dropCapIndex = body.findIndex((block) => block.type === "p");

  return (
    // `flow-root` para uma imagem a contornar no fim do artigo não escapar
    // para o que vem a seguir; `@container` para o contorno ser decidido pela
    // largura desta coluna e não pela da janela.
    <div className="@container coluna-de-leitura flow-root">
      {body.map((block, index) => {
        if (block.type === "p") {
          const isFirst = index === dropCapIndex;
          // A margem cai só quando o parágrafo abre mesmo o texto. O primeiro
          // parágrafo depois de um título — o da capitular — ficava colado a
          // ele, enquanto os títulos seguintes tinham o respiro dos outros.
          const margem = index > 0 ? "mt-6" : "";
          return (
            <p
              key={index}
              className={`reading ${isFirst ? `${margem} first-letter:float-left first-letter:pr-2 first-letter:font-reading first-letter:text-[3.2em] first-letter:font-semibold first-letter:leading-[0.86] first-letter:text-red` : "mt-6"}`}
            >
              {block.spans ? <Inline spans={block.spans} /> : block.text}
            </p>
          );
        }
        if (block.type === "h2") {
          return (
            <h2 key={index} className="mt-12 clear-both text-chapter">
              {block.text}
            </h2>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={index} className="mt-10 clear-both text-xl">
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
        if (block.type === "table") return <Tabela key={index} rows={block.rows} />;
        if (block.type === "gallery") {
          // A fita dos casos, dentro da coluna de texto e alinhada com os
          // parágrafos (`sangra={false}`); `clear-both` para não se encostar a
          // uma imagem a contornar o texto.
          return galeria ? (
            <div key={index} className="clear-both">
              <Galeria imagens={block.images} cliente={galeria.rotulo} textos={galeria.textos} sangra={false} />
            </div>
          ) : null;
        }
        if (block.type === "image" && block.src) {
          // A contornar: pouco menos de metade da coluna, e só a partir de 30rem
          // de coluna — abaixo disso volta a ocupar a largura toda.
          const contorno =
            block.float === "left"
              ? "my-6 @[30rem]:float-left @[30rem]:my-2 @[30rem]:mr-8 @[30rem]:w-[40%]"
              : block.float === "right"
                ? "my-6 @[30rem]:float-right @[30rem]:my-2 @[30rem]:ml-8 @[30rem]:w-[40%]"
                : // Com legenda, a figura é `relative` para o cartão se lhe
                  // sobrepor, e ganha em baixo o espaço que o cartão ocupa.
                  block.caption
                  ? "relative my-10 sm:mb-[4.75rem]"
                  : "my-10";
          const medidas = block.float ? "(max-width: 640px) 100vw, 320px" : "(max-width: 900px) 100vw, 720px";
          return (
            <figure key={index} className={contorno}>
              {/* As medidas vêm da imagem: cortar uma infografia a 16:9 é
                  perder metade do que ela diz. Quando não as sabemos — um SVG,
                  um ficheiro que o CMS não mediu — vale mais deixar o browser
                  descobri-las do que inventar uma proporção e esticar a
                  imagem. */}
              {block.width && block.height ? (
                <Image
                  src={block.src}
                  alt={block.alt ?? ""}
                  width={block.width}
                  height={block.height}
                  className="h-auto w-full rounded-[20px]"
                  sizes={medidas}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={block.src} alt={block.alt ?? ""} loading="lazy" className="h-auto w-full rounded-[20px]" />
              )}
              {/* A contornar, o cartão não se pode sobrepor à fotografia — a
                  imagem é estreita de mais. A legenda mantém a linguagem e
                  muda de sítio: fica encostada por baixo. */}
              {block.caption ? (
                <figcaption className={block.float ? "legenda-imagem legenda-imagem-estreita" : "legenda-imagem"}>
                  {block.caption}
                </figcaption>
              ) : null}
            </figure>
          );
        }
        if (block.type === "embed") {
          const fonte = fonteDeVideo(block.url);
          if (!fonte) return null;
          return (
            <figure key={index} className={block.caption ? "relative my-10 sm:mb-[4.75rem]" : "my-10"}>
              {fonte.tipo === "ficheiro" ? (
                // Ficheiro nosso: não há plataforma a quem pedir licença, e os
                // controlos do browser bastam. `preload="metadata"` traz a
                // duração e não o vídeo. Sem forma imposta: um vídeo vertical
                // fica vertical, até 80% da altura do ecrã.
                <video
                  src={fonte.src}
                  poster={block.poster}
                  controls
                  preload="metadata"
                  playsInline
                  className="mx-auto block max-h-[80vh] w-auto max-w-full rounded-[20px] bg-ink"
                />
              ) : (
                <VideoEmbed fonte={fonte} titulo={block.caption ?? "Vídeo"} />
              )}
              {block.caption ? <figcaption className="legenda-imagem">{block.caption}</figcaption> : null}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}

type Linha = Extract<Block, { type: "table" }>["rows"][number];

/** Um número, uma percentagem, um preço: o que se alinha à direita. */
const NUMERO = /^[\s+\-−–~≈<>]*[€$£]?\s*[\d.,\s]+\s*(%|€|\$|£|x|×|k|m|mil|pp|p\.p\.)?$/i;

const textoDe = (spans: Span[]) => spans.map((span) => span.text).join("").trim();

/**
 * Uma tabela do corpo de um artigo.
 *
 * Em letra de sistema e não na do texto corrido: uma tabela lê-se na vertical,
 * a comparar, e os algarismos da Poppins alinham em coluna. O cabeçalho é o
 * rótulo pequeno em maiúsculas que a casa usa noutros sítios, com a linha
 * grossa por baixo; as outras linhas separam-se com um fio.
 *
 * As linhas do princípio que são só cabeçalho vão para o `thead`; uma célula de
 * cabeçalho no meio da tabela é o rótulo da sua linha. Uma coluna em que todas
 * as células são números alinha à direita, para as casas decimais ficarem umas
 * por baixo das outras.
 *
 * Numa coluna estreita a tabela não aperta: desliza para o lado dentro da sua
 * caixa, e a página não ganha barra horizontal.
 */
function Tabela({ rows }: { rows: Linha[] }) {
  let nCabecalho = 0;
  while (nCabecalho < rows.length - 1 && rows[nCabecalho]!.every((cell) => cell.th)) nCabecalho += 1;
  const cabecalho = rows.slice(0, nCabecalho);
  const corpo = rows.slice(nCabecalho);
  const colunas = Math.max(...rows.map((row) => row.length));

  const numerica = Array.from({ length: colunas }, (_, coluna) => {
    const valores = corpo.map((row) => row[coluna]).filter((cell) => cell && !cell.th && textoDe(cell.spans));
    return valores.length > 0 && valores.every((cell) => NUMERO.test(textoDe(cell!.spans)));
  });
  const alinhamento = (coluna: number) => (numerica[coluna] ? "text-right" : "text-left");
  const rotulo = cabecalho[0]?.map((cell) => textoDe(cell.spans)).filter(Boolean).join(" · ");

  const celula = "px-3 py-3 first:pl-0 last:pr-0";
  return (
    <div
      className="clear-both my-10 overflow-x-auto"
      // Com teclado, uma caixa que desliza tem de se poder focar.
      tabIndex={0}
      role="region"
      aria-label={rotulo || undefined}
    >
      <table
        className={`w-full border-collapse font-sans text-[15px] leading-snug tabular-nums text-fg ${colunas >= 4 ? "min-w-[36rem]" : ""}`}
      >
        {cabecalho.length ? (
          <thead>
            {cabecalho.map((row, r) => (
              <tr key={r} className={r === cabecalho.length - 1 ? "border-b-2 border-fg" : undefined}>
                {row.map((cell, c) => (
                  <th
                    key={c}
                    scope="col"
                    className={`${celula} ${alinhamento(c)} align-bottom text-[12px] font-semibold uppercase tracking-[0.1em]`}
                  >
                    <Inline spans={cell.spans} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        ) : null}
        <tbody>
          {corpo.map((row, r) => (
            <tr key={r} className="border-b border-line">
              {row.map((cell, c) =>
                cell.th ? (
                  <th key={c} scope="row" className={`${celula} ${alinhamento(c)} align-top font-semibold`}>
                    <Inline spans={cell.spans} />
                  </th>
                ) : (
                  <td key={c} className={`${celula} ${alinhamento(c)} align-top`}>
                    <Inline spans={cell.spans} />
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
