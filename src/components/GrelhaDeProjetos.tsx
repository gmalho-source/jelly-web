"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Link } from "@/i18n/navigation";
import { useChegada } from "./Chegada";

export type ProjetoDaGrelha = {
  slug: string;
  cliente: string;
  disciplinas: string;
  capa: { src: string; alt: string } | null;
  caso: boolean;
  /** O número principal do caso, só quando está validado com o cliente. */
  destaque?: string;
};

export type TextosDaGrelha = { todos: string; casos: string; filtrar: string };

/**
 * A grelha da página de projetos: todos, com os casos escritos marcados, e um
 * filtro de dois botões por cima.
 *
 * Era uma lista dos casos em texto por cima de uma grelha com o resto, e depois
 * uma grelha com tudo por baixo da lista: seis projetos a aparecer duas vezes
 * seguidas. Ficou uma grelha só. O que a lista dava — encontrar os casos de uma
 * vez, e ver o número de cada um — está aqui no filtro e no cartão.
 *
 * Todos os cartões são desenhados no servidor e o filtro esconde por CSS: o
 * Google vê as ligações todas, e a pessoa vê as que pediu. Os cartões chegam
 * com `data-chega` e não com `.entra`: a grelha muda de altura a cada clique no
 * filtro, e presos ao scroll os cartões que já tinham chegado voltavam a
 * esmorecer (ver MOVIMENTO.md).
 */
export function GrelhaDeProjetos({ projetos, textos }: { projetos: ProjetoDaGrelha[]; textos: TextosDaGrelha }) {
  const [soCasos, setSoCasos] = useState(false);
  const grelha = useRef<HTMLUListElement>(null);
  useChegada(grelha);
  const nCasos = projetos.filter((projeto) => projeto.caso).length;

  return (
    <>
      {nCasos ? (
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label={textos.filtrar}>
          <Botao activo={!soCasos} onClick={() => setSoCasos(false)}>
            {textos.todos} <span className="tabular-nums opacity-60">{projetos.length}</span>
          </Botao>
          <Botao activo={soCasos} onClick={() => setSoCasos(true)}>
            {textos.casos} <span className="tabular-nums opacity-60">{nCasos}</span>
          </Botao>
        </div>
      ) : null}

      {/* O cartão é a imagem, com o nome por cima, sobre um véu que sobe até aos
          dois terços dela — com menos, metade das capas desta casa deixava o
          nome por ler. O hover aproxima a imagem e não pinta o nome de
          vermelho: vermelho sobre fotografia escura é a pior combinação. */}
      <ul ref={grelha} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projetos.map((projeto) => (
          <li key={projeto.slug} data-chega="" className={soCasos && !projeto.caso ? "hidden" : undefined}>
            <Link
              href={{ pathname: "/projetos/[slug]", params: { slug: projeto.slug } }}
              className="group relative isolate block aspect-[4/3] overflow-hidden rounded-[20px] bg-slate"
            >
              {projeto.capa ? (
                <Image
                  src={projeto.capa.src}
                  alt={projeto.capa.alt || projeto.cliente}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />
              ) : null}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink/90 via-ink/55 to-transparent"
              />
              {/* A faixa em cima, longe do véu e do nome. */}
              {projeto.caso ? (
                <span className="absolute left-4 top-4 rounded-full bg-red px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-paper sm:left-5 sm:top-5">
                  Case
                </span>
              ) : null}
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <span className="flex min-w-0 flex-col gap-1">
                  <h3 className="text-xl text-paper">{projeto.cliente}</h3>
                  <span className="truncate text-sm text-paper/75">{projeto.disciplinas}</span>
                </span>
                {/* O número vai em baixo, onde o véu é mais escuro: é o único
                    sítio do cartão onde o vermelho se lê sobre uma fotografia. */}
                {projeto.destaque ? (
                  <span className="shrink-0 text-right font-display text-2xl leading-none tabular-nums text-red">
                    {projeto.destaque}
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Botao({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
        activo ? "border-red bg-red text-paper" : "border-line text-fg-soft hover:border-red hover:text-red"
      }`}
    >
      {children}
    </button>
  );
}
