"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type Pessoa = {
  nome: string;
  funcao?: string;
  apresentacao?: string;
  pb?: { src: string; alt?: string };
  cor?: { src: string; alt?: string };
  linkedin?: string;
};

type Copy = { open: string; close: string; linkedin: string; noBio: string };

/**
 * A grelha da equipa, com o gesto da página antiga traduzido.
 *
 * Lá, os retratos estavam a preto e branco na grelha e a cor aparecia com a
 * apresentação, em ecrã cheio. Aqui é igual, num diálogo em vez de um ecrã: a
 * grelha é a preto e branco, e a cor chega quando se abre a pessoa.
 *
 * A cor não entra na grelha de propósito, embora fosse tentador: os retratos a
 * cores são verticais e os a preto e branco horizontais, e trocá-los na mesma
 * moldura cortava as cabeças a meio.
 *
 * O diálogo é o `<dialog>` do browser e não uma caixa desenhada por mim: fecha
 * com Esc, prende o foco, e escurece o resto da página sem eu escrever uma linha
 * de javascript para isso. O que fica meu é o X — como no menu, e pela mesma
 * razão: «esc» só se lê se já se souber.
 */
export function EquipaGrelha({ pessoas, copy }: { pessoas: Pessoa[]; copy: Copy }) {
  const [aberta, setAberta] = useState<Pessoa | null>(null);
  const caixa = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialogo = caixa.current;
    if (!dialogo) return;
    if (aberta && !dialogo.open) dialogo.showModal();
    if (!aberta && dialogo.open) dialogo.close();
  }, [aberta]);

  return (
    <>
      <ul className="grid gap-px bg-paper-3 sm:grid-cols-2 lg:grid-cols-3">
        {pessoas.map((pessoa) => (
          <li key={pessoa.nome} className="bg-paper">
            <button
              type="button"
              onClick={() => setAberta(pessoa)}
              aria-label={`${copy.open}: ${pessoa.nome}`}
              className="group block w-full text-left"
            >
              <span className="relative block aspect-[3/2] overflow-clip bg-paper-3">
                {pessoa.pb ? (
                  <Image
                    src={pessoa.pb.src}
                    alt={pessoa.pb.alt ?? pessoa.nome}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                ) : null}
              </span>
              <span className="flex items-baseline justify-between gap-3 px-1 py-4">
                <span>
                  <span className="block font-display text-lg lg:text-xl">{pessoa.nome}</span>
                  {pessoa.funcao ? (
                    <span className="mt-1 block text-xs uppercase tracking-[0.08em] text-fg-soft">{pessoa.funcao}</span>
                  ) : null}
                </span>
                <span aria-hidden="true" className="text-red opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  →
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={caixa}
        onClose={() => setAberta(null)}
        onClick={(evento) => {
          // Clicar fora fecha: o alvo do clique só é o próprio diálogo quando se
          // acerta no fundo escurecido.
          if (evento.target === caixa.current) setAberta(null);
        }}
        className="w-[min(92vw,900px)] rounded-[6px] bg-paper p-0 text-ink backdrop:bg-ink/80"
      >
        {aberta ? (
          <div className="grid sm:grid-cols-[minmax(0,42%)_minmax(0,1fr)]">
            <div className="relative aspect-[3/4] bg-paper-3 sm:aspect-auto sm:min-h-[420px]">
              {aberta.cor || aberta.pb ? (
                <Image
                  src={(aberta.cor ?? aberta.pb)!.src}
                  alt={aberta.nome}
                  fill
                  sizes="(max-width: 640px) 100vw, 380px"
                  className="object-cover"
                />
              ) : null}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl">{aberta.nome}</h2>
                  {aberta.funcao ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.08em] text-red">{aberta.funcao}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => setAberta(null)}
                  aria-label={copy.close}
                  className="-mr-2 -mt-2 grid size-11 shrink-0 place-items-center rounded-full text-ink/60 transition-colors hover:bg-ink/5 hover:text-ink"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5">
                    <path d="M5 5 19 19M19 5 5 19" stroke="currentColor" strokeWidth="1.6" fill="none" />
                  </svg>
                </button>
              </div>
              <div className="mt-5 max-w-[52ch] space-y-3 text-sm leading-relaxed text-ink/75">
                {(aberta.apresentacao ?? copy.noBio).split("\n").map((paragrafo, indice) => (
                  <p key={indice}>{paragrafo}</p>
                ))}
              </div>
              {aberta.linkedin ? (
                <a
                  href={aberta.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-block text-sm font-semibold text-red hover:underline"
                >
                  {copy.linkedin} →
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </dialog>
    </>
  );
}
