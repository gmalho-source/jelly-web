/**
 * A pílula do topo, na página de contactos.
 *
 * Nas outras páginas ela é um convite — "Start The Change" — e leva aos
 * contactos. Aqui já se chegou: um botão que aponta para a página onde se está
 * não serve para nada. Passa a dizer que a mudança está a começar, e a assinalar
 * presença em vez de pedir um clique.
 *
 * Por trás dela corre luz. Quatro manchas — as quatro cores da paleta Jelly
 * 2026 — atravessam a pílula em períodos diferentes e desencontrados, e é o
 * cruzamento delas que faz a cor mudar: onde o vermelho passa por cima da
 * lavanda dá um roxo que não está em nenhuma das camadas. Nenhum período é
 * múltiplo de outro, para o conjunto não voltar ao mesmo sítio à vista.
 *
 * A primeira versão desenhava uma rede neuronal — nós e fios com um pulso a
 * percorrê-los. Lia-se como um diagrama, e um diagrama no topo de uma página
 * pede para ser entendido em vez de ficar em fundo.
 *
 * Move-se transformação e mais nada: a barra do topo está fixa em cima de todas
 * as páginas, e o custo por fotograma tem de ser perto de zero. O desfoque e a
 * máscara são estáticos — pintam-se uma vez.
 */
export function ChangePill({ label }: { label: string }) {
  return (
    <div className="pill-breathe pointer-events-none relative isolate">
      <div aria-hidden="true" className="fluxo-luz">
        <span className="fluxo-mancha fluxo-1" />
        <span className="fluxo-mancha fluxo-2" />
        <span className="fluxo-mancha fluxo-3" />
        <span className="fluxo-mancha fluxo-4" />
      </div>

      <span className="pointer-events-auto relative inline-flex items-center rounded-full bg-ink/[0.62] px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}
