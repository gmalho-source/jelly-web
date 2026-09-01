"use client";

import { useState } from "react";
import type { Locale } from "@/i18n/routing";
import { branding, type Decisao } from "@/content/branding";

/**
 * Anatomia de uma marca: quatro interruptores, um espécime.
 *
 * Tipo, cor, ritmo e voz são as quatro decisões. Cada interruptor retira uma
 * e o espécime — a nossa própria marca, feita dos tokens deste site — degrada-
 * se até ao que a maioria das empresas tem: um nome cinzento a dizer «soluções
 * integradas de comunicação». Voltam a ligar-se e é a Jelly outra vez.
 *
 * A voz é a decisão que mais gente esquece que é design, e por isso é a única
 * que muda o texto e não só a forma dele.
 *
 * O espécime é nosso e não de um cliente de propósito: mostrar a anatomia de
 * uma marca alheia com tokens inventados a partir de uma fotografia era o
 * contrário do que a página defende. Com os tokens verdadeiros de um cliente,
 * o mecanismo serve tal e qual.
 */
export function AnatomiaDaMarca({ locale }: { locale: Locale }) {
  const a = branding.anatomia;
  const [ligadas, setLigadas] = useState<Record<Decisao["chave"], boolean>>({ tipo: true, cor: true, ritmo: true, voz: true });
  const ativas = Object.values(ligadas).filter(Boolean).length;
  const texto = ligadas.voz ? a.especime.com : a.especime.sem;

  const classes = [
    "especime",
    !ligadas.tipo && "sem-tipo",
    !ligadas.cor && "sem-cor",
    !ligadas.ritmo && "sem-ritmo",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start lg:gap-16">
      <div>
        <div className="border-t border-line">
          {a.decisoes.map((decisao, indice) => (
            <button
              key={decisao.chave}
              type="button"
              aria-pressed={ligadas[decisao.chave]}
              onClick={() => setLigadas((estado) => ({ ...estado, [decisao.chave]: !estado[decisao.chave] }))}
              className="grid w-full grid-cols-[48px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-5 text-left transition-colors duration-200 hover:bg-paper-2/60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red"
            >
              <span className="font-display text-2xl leading-none text-red">{String(indice + 1).padStart(2, "0")}</span>
              <span>
                <span className="block font-display text-xl leading-tight">{decisao.nome[locale]}</span>
                <span className="mt-1 block text-sm text-fg-soft">{decisao.texto[locale]}</span>
              </span>
              <span aria-hidden="true" className="interruptor" />
            </button>
          ))}
        </div>
        <p className="mt-5 max-w-[46ch] text-sm text-fg-soft">{a.nota[locale]}</p>
      </div>

      <div className="lg:sticky lg:top-24">
        <div className={classes}>
          <div className="marca">
            <span className="quad">J</span>
            <span className="nome">Jelly</span>
          </div>
          <div>
            <p className="titulo">
              {ligadas.voz ? (
                <>
                  Be the <em>change</em>.
                </>
              ) : (
                texto.titulo[locale]
              )}
            </p>
            <p className="corpo">{texto.corpo[locale]}</p>
          </div>
          <div className="base">
            <span className="pilula">{texto.botao[locale]}</span>
            <span className="url">jelly.pt</span>
          </div>
        </div>
        <p className="mt-4 flex justify-between gap-4 text-sm text-fg-soft" aria-live="polite">
          <span>
            {a.ativas[locale]}: <b className="font-semibold text-fg">{ativas} de 4</b>
          </span>
          <b className="font-semibold text-fg">{a.vereditos[locale][ativas]}</b>
        </p>
      </div>
    </div>
  );
}
