"use client";

/**
 * Faixa cinética com as frases-âncora. Uma única animação por ecrã, parada em
 * prefers-reduced-motion (aí lê-se como friso estático).
 */
export function Ticker({ items }: { items: string[] }) {
  const line = [...items, ...items];

  return (
    <div className="overflow-hidden border-y border-line bg-chartreuse py-3">
      <div className="ticker flex w-max gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-[0.08em] text-fg">
        {line.map((item, index) => (
          <span key={`${item}-${index}`} className="flex items-center gap-10">
            {item}
            <span aria-hidden="true" className="text-red">
              ✳
            </span>
          </span>
        ))}
      </div>
      <style>{`
        .ticker { animation: jelly-ticker 34s linear infinite; }
        @keyframes jelly-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @media (prefers-reduced-motion: reduce) { .ticker { animation: none; } }
      `}</style>
    </div>
  );
}
