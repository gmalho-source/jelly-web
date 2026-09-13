import type { Block, Span } from "@/content/types";

/**
 * Negrito, itálico e links escritos no painel.
 *
 * Vivia dentro do `ArticleBody`, que é o corpo de um artigo migrado do
 * WordPress. Saiu de lá quando as vagas passaram a poder ser escritas com
 * marcação: são o mesmo desenho — a mesma negrita, o mesmo sublinhado vermelho
 * — e ter duas cópias dele era ter duas casas.
 *
 * O texto migrado não tem marcação nenhuma, e por isso quem o desenha continua
 * a poder escrever a string directa sem passar por aqui.
 */
export function Inline({ spans }: { spans: Span[] }) {
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
 * Texto corrido com marcação: a abertura e o fecho de uma vaga.
 *
 * Só desenha parágrafos. O painel de uma vaga não deixa escrever mais do que
 * isso de propósito — sem títulos, sem listas dentro de listas — e por isso
 * este componente também não os sabe desenhar. Se um dia souber, é sinal de
 * que a régua do painel mudou, e as duas coisas mudam juntas.
 *
 * `className` é o desenho do parágrafo, que muda conforme o sítio: a abertura
 * é maior do que o fecho.
 */
export function Paragrafos({ blocos, className }: { blocos: Block[]; className?: string }) {
  const paragrafos = blocos.filter((bloco): bloco is Extract<Block, { type: "p" }> => bloco.type === "p");
  if (!paragrafos.length) return null;
  return (
    <>
      {paragrafos.map((bloco, indice) => (
        <p key={indice} className={className}>
          {bloco.spans ? <Inline spans={bloco.spans} /> : bloco.text}
        </p>
      ))}
    </>
  );
}

/**
 * O mesmo texto, sem marcação nenhuma.
 *
 * Serve a `description` do Google e os dados estruturados de uma vaga, que são
 * texto simples e não aguentam etiquetas. Sai daqui e não de um segundo campo
 * no painel: um resumo que se escreve à parte é um resumo que fica velho.
 */
export function textoDe(blocos: Block[]): string {
  return blocos
    .filter((bloco): bloco is Extract<Block, { type: "p" }> => bloco.type === "p")
    .map((bloco) => bloco.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** O mesmo, para uma linha de lista que já vem em pedaços. */
export function textoDosPedacos(pedacos: Span[]): string {
  return pedacos
    .map((pedaco) => pedaco.text)
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}
