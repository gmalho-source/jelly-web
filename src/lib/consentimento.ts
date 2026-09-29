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

/**
 * O mesmo, lido do cookie que a Iubenda guarda — `_iub_cs-<política>`, com as
 * finalidades aceites em JSON.
 *
 * Existe desde o primeiro instante da página, ao contrário do `_iub`, que só
 * se enche quando o guião do banner carrega. E o guião carrega depois de a
 * página acabar de carregar (ver `CookieConsent`), bem depois de a primeira
 * visita ser contada: sem o cookie, a primeira página de quem já tinha dito
 * que sim nunca contava. Havendo várias políticas — uma por língua — basta um
 * sim.
 */
export function consenteMedicaoNoCookie(cookies: string): boolean {
  for (const parte of cookies.split(/;\s*/)) {
    const [nome, ...resto] = parte.split("=");
    if (!/^_iub_cs-\d+$/.test(nome ?? "")) continue;
    try {
      const valor = JSON.parse(decodeURIComponent(resto.join("="))) as {
        purposes?: Record<string, boolean>;
        consent?: boolean;
      };
      if (valor.purposes?.[MEDICAO] ?? valor.consent) return true;
    } catch {
      // Um cookie ilegível não é um sim.
    }
  }
  return false;
}
