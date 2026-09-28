/**
 * A impressão digital de uma imagem: os primeiros dezasseis caracteres do
 * SHA-256 dos bytes tal como vieram, antes de qualquer encolhimento.
 *
 * Serve para a importação de artigos reaproveitar o que já está na biblioteca.
 * Reimportar um Word corrigido carregava outra vez todas as imagens, e ao fim
 * de três versões havia três cópias de cada uma. Agora a impressão vai no nome
 * do ficheiro — `artigo-3f9c0a7e12b45d68.webp` — e antes de carregar procura-se
 * na biblioteca um ficheiro com ela. Existindo, usa-se esse, com o texto
 * alternativo que lá tiver: se alguém o melhorou no painel, não se perde.
 *
 * No nome, e não num campo da biblioteca, para não pedir uma coluna nova na
 * base de dados: o nome do ficheiro já está lá, já se pesquisa, e não muda
 * depois de carregado. O que foi carregado antes disto não tem impressão, e
 * volta a entrar uma vez; daí para a frente já se reconhece.
 *
 * Dezasseis caracteres hexadecimais são 64 bits: duas imagens diferentes com a
 * mesma impressão numa biblioteca de milhares não é coisa que aconteça.
 */
export async function impressao(bytes: ArrayBuffer | Uint8Array): Promise<string> {
  const dados = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const resumo = await crypto.subtle.digest("SHA-256", dados as BufferSource);
  return [...new Uint8Array(resumo)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** O nome do ficheiro com a impressão antes da extensão. */
export function comImpressao(nome: string, marca: string): string {
  const semMarca = nome.replace(/-[0-9a-f]{16}(?=\.[^.]+$|$)/, "");
  const ponto = semMarca.lastIndexOf(".");
  return ponto > 0 ? `${semMarca.slice(0, ponto)}-${marca}${semMarca.slice(ponto)}` : `${semMarca}-${marca}`;
}
