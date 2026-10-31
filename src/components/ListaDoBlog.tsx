"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useChegada } from "./Chegada";

export type ArtigoDaLista = {
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  data: string;
  minutos: number;
  capa: { src: string; alt: string } | null;
};

export type TextosDaLista = {
  por: string;
  minutos: string;
  todas: string;
  verMais: string;
  filtrar: string;
};

const LEVA = 24;

/**
 * O índice do blog: as categorias em cima, a lista por baixo, e um botão que
 * traz mais.
 *
 * A decisão que faz isto valer a pena: **todos os artigos são desenhados no
 * servidor**, e os que ainda não é a vez deles ficam escondidos por CSS. Não é
 * detalhe de implementação — é o objetivo. Desenhar só os primeiros e ir
 * buscar os outros ao clique deixava cento e cinquenta e nove artigos sem
 * ligação nenhuma no documento, que era exactamente o problema que isto vem
 * resolver. Assim o Google vê-os todos à chegada, e a pessoa vê vinte e
 * quatro.
 *
 * O peso disto é markup, não pedidos: as imagens escondidas não se carregam,
 * porque o `next/image` só as vai buscar quando entram no ecrã.
 */
export function ListaDoBlog({ artigos, textos }: { artigos: ArtigoDaLista[]; textos: TextosDaLista }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [quantos, setQuantos] = useState(LEVA);
  // Os artigos chegam ao descer, uma vez cada um: com tempo próprio e não
  // presos ao scroll, porque esta lista muda de altura a cada filtro e a cada
  // «Ver mais», e o que já tinha chegado não pode voltar a esmorecer.
  const lista = useRef<HTMLDivElement>(null);
  useChegada(lista);

  // As categorias por tamanho: as que arrumam mais artigos aparecem primeiro,
  // que é a ordem por que alguém as procura.
  const categorias = useMemo(() => {
    const conta = new Map<string, number>();
    for (const artigo of artigos) conta.set(artigo.categoria, (conta.get(artigo.categoria) ?? 0) + 1);
    return [...conta.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [artigos]);

  const filtrados = useMemo(
    () => (categoria ? artigos.filter((artigo) => artigo.categoria === categoria) : artigos),
    [artigos, categoria],
  );
  const aMostrar = useMemo(
    () => new Set(filtrados.slice(0, quantos).map((artigo) => artigo.slug)),
    [filtrados, quantos],
  );
  const faltam = filtrados.length - Math.min(quantos, filtrados.length);

  const escolher = (nova: string | null) => {
    setCategoria(nova);
    setQuantos(LEVA);
  };

  return (
    <>
      {/* No telemóvel, as categorias numa só linha que desliza para o lado: em
          várias linhas eram sete filas de botões antes do primeiro artigo. A
          margem negativa deixa a linha ir até às bordas do ecrã, e o último
          botão não fica cortado a meio pelo espaço da página. No computador,
          como sempre, partem em linhas. */}
      <div
        className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label={textos.filtrar}
      >
        <Chip activa={categoria === null} onClick={() => escolher(null)}>
          {textos.todas} <span className="tabular-nums opacity-60">{artigos.length}</span>
        </Chip>
        {categorias.map(([nome, n]) => (
          <Chip key={nome} activa={categoria === nome} onClick={() => escolher(nome)}>
            {nome} <span className="tabular-nums opacity-60">{n}</span>
          </Chip>
        ))}
      </div>

      <div ref={lista}>
      {artigos.map((artigo) => (
        <Link
          key={artigo.slug}
          data-chega=""
          href={{ pathname: "/blog/[slug]", params: { slug: artigo.slug } }}
          // No telemóvel, duas colunas: o texto com a largura toda que sobra e
          // a capa à direita, quadrada e com tamanho para se reconhecer. A
          // terceira coluna da data roubava ao título quase um terço da linha,
          // e o título partia-se em seis linhas de duas palavras; a data passa
          // para a linha de baixo do título. No computador volta a coluna da
          // data, e a capa cresce para 3:2, a 208 pixéis.
          className={`group grid grid-cols-[minmax(0,1fr)_104px] items-start gap-x-4 gap-y-2 border-b border-line py-6 row-flip sm:grid-cols-[208px_minmax(0,1fr)_96px] sm:items-center sm:gap-x-8 sm:hover:pl-3 ${
            aMostrar.has(artigo.slug) ? "" : "hidden"
          }`}
        >
          {artigo.capa ? (
            <Image
              src={artigo.capa.src}
              alt=""
              width={416}
              height={312}
              sizes="(min-width: 640px) 208px, 104px"
              className="order-2 aspect-square w-full object-cover sm:order-none sm:aspect-[3/2]"
            />
          ) : (
            <span aria-hidden="true" className="order-2 block aspect-square w-full bg-slate/15 sm:order-none sm:aspect-[3/2]" />
          )}
          <div>
            <span className="eyebrow sm:hidden">{artigo.categoria}</span>
            <h3 className="editorial mt-2 text-[1.375rem] leading-[1.15] transition-colors duration-200 group-hover:text-red sm:mt-0 sm:text-2xl lg:text-[1.75rem]">
              {artigo.titulo}
            </h3>
            <p className="mt-2 text-sm text-fg-soft">
              <span className="hidden sm:inline">
                {artigo.categoria} · {textos.por} {artigo.autor}
              </span>
              <span className="tabular-nums sm:hidden">
                {artigo.data} · {artigo.minutos} {textos.minutos}
              </span>
            </p>
          </div>
          <span className="hidden self-baseline text-right text-sm tabular-nums text-fg-soft sm:block">
            {artigo.data}
            <br />
            {artigo.minutos} {textos.minutos}
          </span>
        </Link>
      ))}
      </div>

      {faltam > 0 ? (
        <div className="mt-10 flex justify-center">
          <button type="button" onClick={() => setQuantos((antes) => antes + LEVA)} className="btn-pill btn-pill-ink">
            {textos.verMais} <span className="tabular-nums opacity-70">{faltam}</span>
          </button>
        </div>
      ) : null}
    </>
  );
}

function Chip({ activa, onClick, children }: { activa: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
        activa ? "border-red bg-red text-paper" : "border-line text-fg-soft hover:border-red hover:text-red"
      }`}
    >
      {children}
    </button>
  );
}
