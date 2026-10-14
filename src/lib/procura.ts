/**
 * A comparação de palavras da procura do índice.
 *
 * Sem acentos nem maiúsculas — «video» encontra «Vídeo» — e com singular e
 * plural tratados como a mesma palavra: «audiovisual» encontra
 * «Audiovisuais», que era o que falhava. Não é um dicionário: são as
 * terminações do português e do inglês que mais mudam de uma forma para a
 * outra, e chegam para um índice de duzentas e tal entradas.
 *
 * Várias palavras procuram-se todas: «seo local» devolve o que tiver as duas.
 * Cada palavra escrita encontra uma palavra do texto que comece por ela —
 * «brand» encontra «branding» — e, a partir de quatro letras, também dentro
 * de palavras compostas («ecommerce» em «e-commerce»).
 */

export function normaliza(valor: string): string {
  return valor.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

const palavras = (valor: string) => normaliza(valor).split(/[^a-z0-9]+/).filter(Boolean);

/** A forma comum do singular e do plural. */
export function raiz(palavra: string): string {
  if (palavra.length <= 3) return palavra;
  const troca = (fim: string, por: string) => palavra.slice(0, -fim.length) + por;
  // produções → produção, alemães → alemão, irmãos → irmão (já sem acentos)
  if (palavra.endsWith("oes") || palavra.endsWith("aes")) return troca("oes", "ao");
  if (palavra.endsWith("aos")) return troca("s", "");
  if (palavra.endsWith("ais")) return troca("ais", "al");
  if (palavra.endsWith("eis")) return troca("eis", "el");
  if (palavra.endsWith("ois")) return troca("ois", "ol");
  if (palavra.endsWith("ies")) return troca("ies", "y");
  if (palavra.endsWith("ns")) return troca("ns", "m");
  if (palavra.length > 4 && /(r|z)es$/.test(palavra)) return troca("es", "");
  if (palavra.endsWith("s") && !palavra.endsWith("ss")) return troca("s", "");
  return palavra;
}

/** O texto de uma entrada, preparado uma vez para ser comparado muitas. */
export type Preparado = { raizes: string[]; corrido: string };

export function prepara(texto: string): Preparado {
  return { raizes: palavras(texto).map(raiz), corrido: normaliza(texto).replace(/[^a-z0-9]+/g, "") };
}

/** A consulta, partida nas palavras que tem de encontrar. */
export function consulta(texto: string): string[] {
  return palavras(texto);
}

export function corresponde(entrada: Preparado, termos: string[]): boolean {
  return termos.every((termo) => {
    const procurada = raiz(termo);
    if (entrada.raizes.some((palavra) => palavra.startsWith(procurada))) return true;
    return termo.length >= 4 && entrada.corrido.includes(termo);
  });
}
