/**
 * O que a Iubenda respondeu sobre medição.
 *
 * Vive fora do componente para se poder conferir sem browser: é a peça que
 * decide se uma visita é contada, e uma peça dessas não se verifica a olho.
 *
 * A Iubenda numera as finalidades e a 4 é a medição. Com consentimento por
 * finalidade — que é como o banner da casa está configurado — é a finalidade
 * que manda; sem ele, vale o sim geral.
 *
 * Sem resposta nenhuma responde que não: ainda não carregou, foi bloqueada, ou
 * ninguém decidiu. Entre contar a mais e contar a menos, conta-se a menos.
 */
export type EstadoIubenda = {
  cs?: { consent?: { purposes?: Record<string, boolean>; given?: boolean } };
};

const MEDICAO = "4";

export function consenteMedicao(iub: EstadoIubenda | undefined): boolean {
  const consentimento = iub?.cs?.consent;
  if (!consentimento) return false;
  return consentimento.purposes?.[MEDICAO] ?? consentimento.given ?? false;
}
