"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { consenteMedicao, type EstadoIubenda } from "@/lib/consentimento";

/**
 * As medições da Vercel, com a contagem de visitas presa ao consentimento.
 *
 * São duas coisas diferentes, e é por isso que só uma leva guarda:
 *
 * O **Speed Insights** mede tempos de carregamento e de interação. Não conta
 * pessoas nem as segue de página em página. Corre sempre.
 *
 * O **Web Analytics** conta visitantes e páginas vistas. Não usa cookies, mas é
 * medição de audiência, e a casa pede consentimento para isso. Aqui espera por
 * ele.
 *
 * Porquê no código e não no bloqueio automático da Iubenda: aquele bloqueio
 * funciona reescrevendo o `src` das etiquetas de terceiros que conhece, e este
 * guião não é de terceiros à vista do browser — é servido do próprio domínio,
 * em `/_vercel/insights/script.js`, e injetado depois da página estar de pé.
 * Passa-lhe ao lado. O `beforeSend` é o único sítio onde isto se decide.
 *
 * Quem lê a resposta da Iubenda é o `consenteMedicao`, em `@/lib/consentimento`:
 * está fora daqui para se poder conferir sem browser.
 *
 * Não é preciso voltar a perguntar quando alguém aceita: a configuração do
 * banner tem `reloadOnConsent`, e a página que recarrega já arranca com a
 * resposta na mão.
 */
const podeContar = () => consenteMedicao((window as unknown as { _iub?: EstadoIubenda })._iub);

export function MedicoesDaVercel() {
  return (
    <>
      <SpeedInsights />
      <Analytics beforeSend={(evento) => (podeContar() ? evento : null)} />
    </>
  );
}
