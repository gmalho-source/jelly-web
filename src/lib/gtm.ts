declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Um evento para o Google Tag Manager. O único sítio do site que escreve na
 * `dataLayer` — o que lá entra decide-se no GTM, por acionadores de «Evento
 * personalizado» com este nome.
 *
 * A fila cria-se se ainda não existir, em vez de o evento se perder: o GTM
 * chega depois da página, e quem envia um formulário ou muda de página nesse
 * intervalo conta na mesma — o GTM lê a fila quando chega.
 *
 * Nos parâmetros nunca vai o que alguém escreveu num formulário (nome, email,
 * telefone, mensagem): isso sairia para o Google, e são dados pessoais.
 */
export function pushEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}
