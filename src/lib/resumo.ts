import type { Block } from "@/content/types";

/**
 * O resumo de um artigo — o que serve de `description` e de primeira linha.
 *
 * Existe porque 123 dos 179 artigos importados do WordPress trouxeram no campo
 * do resumo o código do construtor de páginas em vez de texto:
 * `[vc_column column_padding=…]`. Isso estava a ser publicado como description
 * no Google e impresso no topo do artigo. Um resumo assim não é um resumo mau,
 * é lixo — e mais vale a primeira frase do próprio artigo do que uma linha de
 * código a fazer de resumo.
 *
 * A limpeza fica aqui, na leitura, e não só nos dados: um próximo ficheiro
 * importado do WordPress traria o mesmo problema outra vez.
 */

/* Os shortcodes que o WordPress da Jelly usava, e a família toda por precaução. */
const SHORTCODE = /\[[a-z_/][a-z0-9_-]*(?:[^\]]*)\]?/gi;
const ENTIDADE = /&#\d+;|&[a-z]+;/gi;

/** O texto sem shortcodes. Vazio, se não houver nada a não ser shortcodes. */
export function semShortcodes(texto: string | undefined): string {
  const limpo = (texto ?? "")
    .replace(SHORTCODE, " ")
    .replace(ENTIDADE, " ")
    .replace(/\s+/g, " ")
    .trim();
  // Menos de doze caracteres não é uma frase, é o que sobrou de um shortcode.
  return limpo.length < 12 ? "" : limpo;
}

/**
 * As primeiras frases do artigo, cortadas onde uma frase acaba.
 *
 * O limite é 165 caracteres: o Google mostra cerca de 155 e cortar a meio de
 * uma palavra lê-se pior do que uma frase mais curta.
 */
export function resumoDoCorpo(blocks: Block[] | undefined, limite = 165): string {
  const paragrafos = (blocks ?? [])
    .filter((bloco): bloco is Extract<Block, { type: "p" }> => bloco.type === "p")
    .map((bloco) => semShortcodes(bloco.text))
    .filter((valor) => valor.length > 40);

  /*
   * O primeiro parágrafo não é sempre o começo do artigo: em vários artigos
   * importados é a assinatura do autor — «Ana Mendonça Morais – Marketing &
   * Communication Strategist –». Isso não é um resumo. Por isso procura-se
   * primeiro uma frase a sério: comprida e com ponto final. Sem nenhuma, serve
   * o primeiro parágrafo, que é sempre melhor do que um shortcode.
   */
  const texto =
    paragrafos.find((valor) => valor.length >= 90 && /[.!?]/.test(valor)) ?? paragrafos[0];

  if (!texto) return "";
  if (texto.length <= limite) return texto;

  const corte = texto.slice(0, limite + 1);
  // Onde acaba a última frase inteira; se não houver nenhuma, a última palavra.
  const frase = Math.max(corte.lastIndexOf(". "), corte.lastIndexOf("! "), corte.lastIndexOf("? "));
  if (frase > 80) return corte.slice(0, frase + 1).trim();
  return `${corte.slice(0, corte.lastIndexOf(" ")).trim()}…`;
}

/** O resumo a publicar: o do campo se for texto, senão o começo do artigo. */
export function resumoPublicavel(excerpt: string | undefined, blocks: Block[] | undefined): string {
  return semShortcodes(excerpt) || resumoDoCorpo(blocks);
}
