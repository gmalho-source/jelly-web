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
      <div className="mt-10 flex flex-wrap gap-2" role="group" aria-label={textos.filtrar}>
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
          className={`group grid grid-cols-[68px_minmax(0,1fr)_84px] items-center gap-4 border-b border-line py-5 row-flip hover:pl-3 sm:grid-cols-[104px_minmax(0,1fr)_84px] ${
            aMostrar.has(artigo.slug) ? "" : "hidden"
          }`}
        >
          {artigo.capa ? (
            <Image
              src={artigo.capa.src}
              alt=""
              width={208}
              height={156}
              sizes="104px"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <span aria-hidden="true" className="block aspect-[4/3] w-full bg-slate/15" />
          )}
          <div>
            <h3 className="editorial text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
              {artigo.titulo}
            </h3>
            <p className="mt-1 text-sm text-fg-soft">
              {artigo.categoria} · {textos.por} {artigo.autor}
            </p>
          </div>
          <span className="self-baseline text-right text-sm tabular-nums text-fg-soft">
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
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-200 ${
        activa ? "border-red bg-red text-paper" : "border-line text-fg-soft hover:border-red hover:text-red"
      }`}
    >
      {children}
    </button>
  );
}
