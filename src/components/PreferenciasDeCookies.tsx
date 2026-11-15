"use client";

type Iubenda = { cs?: { api?: { openPreferences?: () => void } } };

/**
 * «Preferências de cookies», no rodapé de todas as páginas.
 *
 * Retirar o consentimento tem de ser tão fácil como dá-lo: quem aceitou no
 * banner precisa de um sítio, sempre à vista, para voltar atrás. O banner da
 * Iubenda não deixa nenhum depois de decidido, e o scan deles apontava a falta.
 *
 * Leva a classe que a Iubenda reconhece, e chama ela própria a API: o guião do
 * banner entra tarde (`lazyOnload`), e um clique antes disso não pode ficar
 * sem resposta — nesse caso abre a política de cookies, onde a pessoa pode
 * pelo menos ler o que está em causa.
 */
export function PreferenciasDeCookies({ rotulo, politica, className }: { rotulo: string; politica: string; className?: string }) {
  return (
    <a
      href={politica}
      className={`iubenda-cs-preferences-link ${className ?? ""}`}
      onClick={(evento) => {
        const abrir = (window as unknown as { _iub?: Iubenda })._iub?.cs?.api?.openPreferences;
        if (typeof abrir === "function") {
          evento.preventDefault();
          abrir();
        }
      }}
    >
      {rotulo}
    </a>
  );
}
