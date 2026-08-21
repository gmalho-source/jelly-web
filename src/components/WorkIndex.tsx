"use client";

import Link from "next/link";
import { useState } from "react";

export type WorkRow = {
  client: string;
  discipline: string;
  value: string;
  label: string;
  href: string;
  tone: "slate" | "red" | "lavender" | "chartreuse" | "coral";
};

const tones: Record<WorkRow["tone"], string> = {
  slate: "bg-slate text-paper",
  red: "bg-red text-white",
  lavender: "bg-lavender text-ink",
  chartreuse: "bg-chartreuse text-ink",
  coral: "bg-coral text-ink",
};

/**
 * Índice de trabalho com painel de revelação: ao passar o rato numa linha, o
 * resultado aparece em bloco de cor plana à direita. Em ecrãs pequenos o painel
 * não existe — a linha já leva o número.
 */
export function WorkIndex({ rows }: { rows: WorkRow[] }) {
  const [active, setActive] = useState<number | null>(null);
  const shown = active === null ? null : rows[active];

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
      <div className="border-t border-ink" onMouseLeave={() => setActive(null)}>
        {rows.map((row, index) => (
          <Link
            key={row.href}
            href={row.href}
            onMouseEnter={() => setActive(index)}
            onFocus={() => setActive(index)}
            className={`group grid grid-cols-[minmax(0,1fr)_84px] items-baseline gap-4 border-b border-paper-2 py-5 transition-[padding,opacity] duration-200 ease-out hover:pl-3 sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_96px] ${
              active !== null && active !== index ? "lg:opacity-40" : ""
            }`}
          >
            <span className="font-display text-2xl tracking-[-0.02em] transition-colors duration-200 group-hover:text-red lg:text-[34px]">
              {row.client}
            </span>
            <span className="hidden text-sm text-mute sm:block">{row.discipline}</span>
            <span className="text-right text-lg font-semibold tabular-nums text-red">{row.value}</span>
          </Link>
        ))}
      </div>

      <aside aria-hidden="true" className="hidden lg:block">
        <div className="sticky top-28">
          {shown ? (
            <div className={`flex aspect-[4/5] flex-col justify-between rounded-[20px] p-6 ${tones[shown.tone]}`}>
              <span className="text-xs font-semibold uppercase tracking-[0.08em] opacity-70">{shown.discipline}</span>
              <div>
                <span className="block font-display text-5xl tracking-[-0.02em] tabular-nums">{shown.value}</span>
                <span className="editorial mt-2 block text-lg leading-snug">{shown.label}</span>
              </div>
            </div>
          ) : (
            <div className="flex aspect-[4/5] items-end rounded-[20px] border border-dashed border-paper-3 p-6">
              <span className="editorial text-lg text-mute">Passa o rato numa linha.</span>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
