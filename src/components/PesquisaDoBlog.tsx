"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

/**
 * A pesquisa do índice do blog, com sugestões enquanto se escreve.
 *
 * O índice inteiro vem na página — título, resumo, categoria, temas, autor,
 * data e endereço de cada artigo, uns sessenta KB para os 181 — e a procura
 * faz-se no browser, sem pedido nenhum por tecla. Cada palavra escrita tem de
 * aparecer em algum lado; o título vale mais do que o resumo, e entre iguais
 * ganha o mais recente. As sugestões são seis, com o que bateu certo
 * sublinhado, e navegam-se com as setas: Enter abre a escolhida, ou a primeira
 * se nenhuma estiver escolhida; Escape limpa.
 *
 * Sem JavaScript, o campo não faz nada — é um extra sobre uma lista que já se
 * lê inteira. Sem movimento próprio: é um controlo, não uma cena.
 */
export type ArtigoParaPesquisa = {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  temas: string[];
  autor: string;
  data: string;
  dataLegivel: string;
};

type Textos = { titulo: string; placeholder: string; rotulo: string; semResultados: string; resultados: string; abrir: string };

const MAXIMO = 6;

/** Sem acentos nem maiúsculas: «Inteligência» encontra-se com «inteligen». */
const chao = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function pontuar(artigo: ArtigoParaPesquisa, termos: string[]): number {
  let total = 0;
  const titulo = chao(artigo.titulo);
  const resto = chao([artigo.categoria, ...artigo.temas, artigo.autor].join(" "));
  const resumo = chao(artigo.resumo);
  for (const termo of termos) {
    let pontos = 0;
    if (titulo.includes(termo)) pontos += titulo.startsWith(termo) || titulo.includes(" " + termo) ? 4 : 3;
    if (resto.includes(termo)) pontos += 2;
    if (resumo.includes(termo)) pontos += 1;
    if (!pontos) return 0;
    total += pontos;
  }
  return total;
}

/** O texto com o que bateu certo em `<mark>`, para se ver porque é que a sugestão apareceu. */
function Realce({ texto, termos }: { texto: string; termos: string[] }) {
  if (!termos.length) return <>{texto}</>;
  const plano = chao(texto);
  const cortes: [number, number][] = [];
  for (const termo of termos) {
    let i = plano.indexOf(termo);
    while (i >= 0) {
      cortes.push([i, i + termo.length]);
      i = plano.indexOf(termo, i + termo.length);
    }
  }
  if (!cortes.length) return <>{texto}</>;
  cortes.sort((a, b) => a[0] - b[0]);
  const partes: React.ReactNode[] = [];
  let pos = 0;
  for (const [a, b] of cortes) {
    if (a < pos) continue;
    if (a > pos) partes.push(texto.slice(pos, a));
    partes.push(
      <mark key={a} className="rounded-[2px] bg-chartreuse/70 text-ink">
        {texto.slice(a, b)}
      </mark>,
    );
    pos = b;
  }
  if (pos < texto.length) partes.push(texto.slice(pos));
  return <>{partes}</>;
}

export function PesquisaDoBlog({ artigos, textos }: { artigos: ArtigoParaPesquisa[]; textos: Textos }) {
  const [texto, setTexto] = useState("");
  const [ativo, setAtivo] = useState(-1);
  const [aberto, setAberto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const idLista = useId();

  const termos = useMemo(() => chao(texto).split(/\s+/).filter((t) => t.length >= 2), [texto]);
  const { sugestoes, total } = useMemo(() => {
    if (!termos.length) return { sugestoes: [] as ArtigoParaPesquisa[], total: 0 };
    const pontuados = artigos
      .map((a) => ({ a, p: pontuar(a, termos) }))
      .filter((x) => x.p > 0)
      .sort((x, y) => y.p - x.p || y.a.data.localeCompare(x.a.data));
    return { sugestoes: pontuados.slice(0, MAXIMO).map((x) => x.a), total: pontuados.length };
  }, [artigos, termos]);

  // Fechar ao clicar fora.
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  const abrir = (slug: string) => router.push({ pathname: "/blog/[slug]", params: { slug } });

  const teclas = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => (sugestoes.length ? (i + 1) % sugestoes.length : -1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((i) => (sugestoes.length ? (i <= 0 ? sugestoes.length - 1 : i - 1) : -1));
    } else if (e.key === "Enter") {
      const escolha = sugestoes[ativo] ?? sugestoes[0];
      if (escolha) {
        e.preventDefault();
        abrir(escolha.slug);
      }
    } else if (e.key === "Escape") {
      setTexto("");
      setAtivo(-1);
      setAberto(false);
    }
  };

  const mostrar = aberto && termos.length > 0;

  return (
    <div ref={raiz} className="relative">
      <label htmlFor={`${idLista}-campo`} className="editorial block text-2xl lg:text-3xl">
        {textos.titulo}
      </label>
      <div className="relative mt-5">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-soft" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          id={`${idLista}-campo`}
          type="search"
          role="combobox"
          aria-label={textos.rotulo}
          aria-autocomplete="list"
          aria-expanded={mostrar}
          aria-controls={`${idLista}-lista`}
          aria-activedescendant={ativo >= 0 && mostrar ? `${idLista}-${ativo}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={textos.placeholder}
          value={texto}
          onChange={(e) => {
            setTexto(e.target.value);
            setAtivo(-1);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onKeyDown={teclas}
          className="w-full rounded-full border border-line bg-white py-4 pl-14 pr-6 text-md text-ink shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-fg-soft/70 focus:border-red focus:shadow-md [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {mostrar ? (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-[6px] bg-white shadow-lg ring-1 ring-line">
          {sugestoes.length ? (
            <>
              <ul id={`${idLista}-lista`} role="listbox" className="m-0 list-none p-0">
                {sugestoes.map((a, i) => (
                  <li key={a.slug} id={`${idLista}-${i}`} role="option" aria-selected={i === ativo} className="border-b border-line last:border-b-0">
                    <Link
                      href={{ pathname: "/blog/[slug]", params: { slug: a.slug } }}
                      onMouseEnter={() => setAtivo(i)}
                      className={`grid gap-1 px-6 py-4 transition-colors duration-150 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-x-6 ${i === ativo ? "bg-paper" : "hover:bg-paper"}`}
                    >
                      <span className="editorial text-lg leading-snug">
                        <Realce texto={a.titulo} termos={termos} />
                      </span>
                      <span className="text-xs text-fg-soft sm:text-right">
                        <Realce texto={a.categoria} termos={termos} /> · {a.dataLegivel}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between gap-4 border-t border-line bg-paper px-6 py-2.5 text-xs text-fg-soft">
                <span className="tabular-nums">{textos.resultados.replace("{n}", String(total))}</span>
                <span>{textos.abrir}</span>
              </div>
            </>
          ) : (
            <p className="m-0 px-6 py-5 text-sm text-fg-soft">{textos.semResultados}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
