/**
 * O que a página da equipa precisa de saber sobre cada pessoa antes de a
 * desenhar: o endereço dela e a cor que lhe pertence.
 *
 * Vive fora dos componentes porque a grelha e a página de cada pessoa têm de
 * chegar exactamente à mesma resposta — é isso que faz o retrato voar de uma
 * para a outra sem trocar de cor a meio do caminho.
 */

/** O endereço de uma pessoa: o nome sem acentos nem espaços. */
export function slugDaPessoa(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * As cores que podem aparecer atrás de uma pessoa.
 *
 * São as da paleta, sem o papel e sem a tinta: o papel não se veria e a tinta
 * daria um retrato preto. Cada cor é um `var()` para o dia em que a paleta
 * mudar de valor — muda num sítio só.
 */
const CORES = [
  "var(--color-red)",
  "var(--color-coral)",
  "var(--color-lavender)",
  "var(--color-chartreuse)",
  "var(--color-slate)",
  "var(--color-red-deep)",
] as const;

/**
 * Uma amostra que muda de dia para dia.
 *
 * A página «Sobre» mostra seis caras de vinte e uma, e mostrava as seis
 * primeiras — que, com a lista do painel ordenada por nome, eram sempre as
 * mesmas seis. Quinze pessoas da casa não apareciam nunca.
 *
 * Sorteia-se, mas não a cada visita: a semente é o dia. Toda a gente vê as
 * mesmas seis no mesmo dia, o servidor e o browser concordam — que é o que
 * evita o salto à chegada de que o `coresDaEquipa` aqui ao lado fala — e
 * amanhã são outras. Com seis lugares e vinte e uma pessoas, a casa inteira
 * passa por ali em poucos dias.
 *
 * O baralho é um Fisher-Yates com um gerador próprio: o `Math.random` não
 * aceita semente, e sem semente isto não seria reproduzível nem verificável.
 */
export function amostraDoDia<T>(lista: T[], quantos: number, dia = Math.floor(Date.now() / 86_400_000)): T[] {
  const baralhada = [...lista];
  // Gerador congruencial linear, os números do Numerical Recipes. Chega bem
  // para escolher seis caras; não chega para nada que precise de segredo.
  let estado = (dia * 1_664_525 + 1_013_904_223) >>> 0;
  const proximo = () => {
    estado = (estado * 1_664_525 + 1_013_904_223) >>> 0;
    return estado / 4_294_967_296;
  };
  for (let i = baralhada.length - 1; i > 0; i--) {
    const j = Math.floor(proximo() * (i + 1));
    [baralhada[i], baralhada[j]] = [baralhada[j], baralhada[i]];
  }
  return baralhada.slice(0, quantos);
}

/** Um número estável a partir do nome. Não é aleatório: é sempre o mesmo. */
function semente(nome: string) {
  let valor = 0;
  for (const letra of nome) valor = (valor * 31 + (letra.codePointAt(0) ?? 0)) % 1_000_003;
  return valor;
}

/**
 * A cor de cada pessoa.
 *
 * Parece sorteada e não é: sai do nome, e por isso a mesma pessoa tem sempre a
 * mesma cor — na grelha, na página dela, e amanhã outra vez. Uma cor a sorte
 * verdadeira mudava a cada visita e mudava entre o servidor e o browser, o que
 * daria um salto de cor à chegada.
 *
 * Depois de sorteada, a cor foge dos vizinhos: as três posições anteriores
 * ficam proibidas, o que cobre o lado e o de cima tanto na grelha de três
 * colunas como na de duas. Com seis cores e três proibições há sempre saída.
 */
export function coresDaEquipa(nomes: string[]) {
  const escolhidas: string[] = [];

  nomes.forEach((nome, posicao) => {
    const vizinhas = new Set([escolhidas[posicao - 1], escolhidas[posicao - 2], escolhidas[posicao - 3]]);
    let indice = semente(nome) % CORES.length;
    for (let volta = 0; volta < CORES.length && vizinhas.has(CORES[indice]); volta += 1) {
      indice = (indice + 1) % CORES.length;
    }
    escolhidas.push(CORES[indice]);
  });

  return new Map(nomes.map((nome, posicao) => [nome, escolhidas[posicao]]));
}
