"use client";

import { useState, type ComponentProps } from "react";
import { Link } from "@/i18n/navigation";

/** Uma ligação do verso: o nome e para onde leva. */
export type LigacaoDeArea = { nome: string; href: ComponentProps<typeof Link>["href"] };

/**
 * Um quadrado da faixa das áreas, que vira.
 *
 * À frente, o nome da área e a linha com o que lá cabe; atrás, as ligações —
 * as páginas dos serviços no Marketing, o que a área inclui na Tecnologia — na
 * mesma cor — a faixa fica inteira quando um quadrado vira. Com
 * rato vira ao passar por cima; com o dedo vira ao tocar, e o
 * verso tem um botão para voltar. Com o teclado vira quando o foco chega a uma
 * ligação do verso. As duas faces estão sempre no documento, e quem pediu
 * menos movimento vê-as trocar sem rodar.
 */
export function CartaoDeArea({
  numero,
  nome,
  resumo,
  ligacoes,
  cor,
  rotulos,
}: {
  numero: string;
  nome: string;
  resumo: string;
  ligacoes: LigacaoDeArea[];
  /** A superfície das duas faces, por exemplo «surface-red». */
  cor: string;
  rotulos: { ver: string; voltar: string };
}) {
  const [virado, setVirado] = useState(false);

  return (
    <div className={`cartao-area ${ligacoes.length > 3 ? "cartao-area-cheio" : ""} ${virado ? "cartao-area-virado" : ""}`} onMouseLeave={() => setVirado(false)}>
      <div className="cartao-area-dentro">
        <div className={`cartao-area-face cartao-area-frente ${cor}`} aria-hidden={virado}>
          <span className="text-[13px] font-semibold tabular-nums tracking-[0.08em] text-fg-soft">{numero}</span>
          <div>
            <h3 className="max-w-[11ch] font-display text-[clamp(32px,3.1vw,48px)] leading-[1.0] tracking-[-0.02em]">{nome}</h3>
            <p className="mt-4 max-w-[30ch] text-[15px] leading-snug text-fg-soft">{resumo}</p>
          </div>
          {/* O quadrado inteiro é o botão: com o dedo, toca-se onde calhar. */}
          <button
            type="button"
            className="absolute inset-0 cursor-pointer"
            aria-expanded={virado}
            aria-label={`${rotulos.ver}: ${nome}`}
            tabIndex={-1}
            onClick={() => setVirado(true)}
          >
            <span aria-hidden="true" className="absolute right-6 top-5 text-2xl leading-none lg:right-8 lg:top-7">
              ↻
            </span>
          </button>
        </div>

        <div className={`cartao-area-face cartao-area-verso ${cor}`}>
          <div className="flex items-start justify-between gap-4">
            <span className="eyebrow text-fg-soft">{nome}</span>
            <button
              type="button"
              className="cartao-area-voltar -m-2 p-2 [@media(hover:hover)]:invisible text-[13px] font-semibold uppercase tracking-[0.08em] text-fg-soft hover:text-fg"
              tabIndex={virado ? 0 : -1}
              onClick={() => setVirado(false)}
            >
              ← {rotulos.voltar}
            </button>
          </div>
          <ul className="border-t border-line">
            {ligacoes.map((s) => (
              <li key={s.nome} className="border-b border-line">
                <Link
                  href={s.href}
                  className="group flex items-baseline justify-between gap-3 py-3 font-display text-[clamp(19px,1.6vw,23px)] leading-[1.15] "
                  onFocus={() => setVirado(true)}
                >
                  {s.nome}
                  <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
