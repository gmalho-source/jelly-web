/**
 * A pílula do topo, na página de contactos.
 *
 * Nas outras páginas ela é um convite — "Start The Change" — e leva aos
 * contactos. Aqui já se chegou: um botão que aponta para a página onde se está
 * não serve para nada. Passa a dizer que a mudança está a começar, e a assinalar
 * presença em vez de pedir um clique.
 *
 * O movimento é de respiração — três por cento de escala, quatro segundos e
 * meio — e por trás dela corre uma rede: nós ligados por fios finos, com um
 * pulso a percorrer cada fio e os nós a acender em desencontro. É desenho
 * vetorial e animação em CSS, sem javascript e sem tela: o que se move é
 * opacidade e o comprimento de um traço, e a barra do topo está fixa em cima de
 * todas as páginas — o custo por fotograma tem de ser perto de zero.
 */
export function ChangePill({ label }: { label: string }) {
  // Os nós e os fios são fixos de propósito: uma rede aleatória a cada visita
  // não é reconhecível, e esta é para se tornar familiar.
  const nos = [
    [18, 40], [58, 18], [70, 62], [112, 34], [150, 66], [186, 22],
    [206, 54], [248, 30], [274, 64], [300, 38], [330, 20], [342, 58],
  ] as const;
  const fios = [
    [0, 1], [0, 2], [1, 3], [2, 3], [2, 4], [3, 5], [4, 6], [5, 6],
    [5, 7], [6, 8], [7, 9], [8, 9], [9, 10], [9, 11], [10, 11],
  ] as const;

  return (
    <div className="pill-breathe pointer-events-none relative isolate">
      <svg
        aria-hidden="true"
        viewBox="0 0 360 84"
        className="neural absolute left-1/2 top-1/2 -z-10 h-[84px] w-[360px] -translate-x-1/2 -translate-y-1/2 overflow-visible"
      >
        {/* A rede desenha-se duas vezes: primeiro os fios, que ficam sempre
            visíveis para se ver a malha, e por cima o pulso que a percorre. Só
            com o pulso, a maior parte do tempo via-se pontos soltos. */}
        {fios.map(([de, para], indice) => (
          <line
            key={`base-${indice}`}
            x1={nos[de][0]}
            y1={nos[de][1]}
            x2={nos[para][0]}
            y2={nos[para][1]}
            className="neural-malha"
          />
        ))}
        {fios.map(([de, para], indice) => (
          <line
            key={`fio-${indice}`}
            x1={nos[de][0]}
            y1={nos[de][1]}
            x2={nos[para][0]}
            y2={nos[para][1]}
            className="neural-fio"
            style={{ animationDelay: `${(indice % 5) * 0.7}s` }}
          />
        ))}
        {nos.map(([x, y], indice) => (
          <circle
            key={`no-${indice}`}
            cx={x}
            cy={y}
            r={2}
            className="neural-no"
            style={{ animationDelay: `${(indice % 6) * 0.55}s` }}
          />
        ))}
      </svg>

      <span className="pointer-events-auto relative inline-flex items-center rounded-full bg-ink/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}
