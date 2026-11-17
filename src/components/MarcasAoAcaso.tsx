"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { ObrasComAcento } from "@/components/ObrasComAcento";

/** Uma marca do bloco do trabalho, já com os textos na língua da página. */
export type MarcaDoBloco = {
  slug: string;
  date: string;
  cliente: string;
  subtitulo?: string;
  disciplinas: string[];
  capa: { src: string; alt: string };
};

/** Baralhar a sério (Fisher–Yates), para cada visita ter a sua escolha. */
function sorteia<T>(lista: T[], quantas: number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, quantas);
}

const porData = (a: MarcaDoBloco, b: MarcaDoBloco) => b.date.localeCompare(a.date);

/**
 * O bloco do trabalho da página de Branding: algumas marcas sorteadas, a cada
 * visita, entre as mais recentes que o painel dá — e, das escolhidas, a mais
 * recente primeiro.
 *
 * O HTML traz as mais recentes (é o que lê quem não corre JavaScript, e os
 * motores de busca); o sorteio é do browser, logo a seguir à hidratação. O
 * bloco está longe do topo da página: quando alguém lá chega, a troca já
 * aconteceu.
 *
 * As cores da casa seguem a posição, não a marca: a primeira é sempre lavanda,
 * a segunda chartreuse, a terceira coral — como estava.
 */
export function MarcasAoAcaso({
  marcas,
  quantas,
  acentos,
  textos,
}: {
  marcas: MarcaDoBloco[];
  quantas: number;
  acentos: string[];
  textos: { eyebrow: string; titulo: string; ver: string };
}) {
  const [escolhidas, setEscolhidas] = useState(() => marcas.slice(0, quantas));

  // No fotograma a seguir à hidratação, como o carrossel da homepage: o
  // sorteio no servidor dava as mesmas a toda a gente.
  useEffect(() => {
    const fotograma = requestAnimationFrame(() => setEscolhidas(sorteia(marcas, quantas).sort(porData)));
    return () => cancelAnimationFrame(fotograma);
  }, [marcas, quantas]);

  if (!escolhidas.length) return null;

  return (
    // A `key` volta a montar a secção depois do sorteio: o ObrasComAcento só
    // observa as obras que encontra quando monta.
    <ObrasComAcento key={escolhidas.map((marca) => marca.slug).join("|")} className="obras surface-ink">
      <div className="mx-auto max-w-[1200px] px-5 pb-6 pt-24 sm:px-8 lg:pt-28">
        <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
          <div>
            <span className="eyebrow acento-vivo">{textos.eyebrow}</span>
            <h2 className="mt-4 max-w-[22ch] text-chapter">{textos.titulo}</h2>
          </div>
          <span aria-hidden="true" className="acento-vivo-contorno font-display text-[clamp(40px,6vw,88px)] leading-[0.85]">
            {String(escolhidas.length).padStart(2, "0")}
          </span>
        </div>

        {escolhidas.map((projeto, i) => {
          const acento = acentos[i % acentos.length];
          return (
            <article
              key={projeto.slug}
              data-acento={acento}
              style={{ "--acento": acento } as React.CSSProperties}
              className="border-b border-line/60"
            >
              <Link
                href={{ pathname: "/projetos/[slug]", params: { slug: projeto.slug } }}
                className="group grid items-center gap-7 py-16 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] md:gap-16 lg:py-20"
              >
                <div className={`entra ${i % 2 ? "md:order-2" : ""}`}>
                  <span aria-hidden="true" className="varre block h-0.5 w-[72px] bg-[var(--acento)]" />
                  {projeto.subtitulo ? <span className="eyebrow mt-6 block text-[var(--acento)]">{projeto.subtitulo}</span> : null}
                  <h3 className="editorial mt-3 text-[clamp(28px,3.6vw,50px)] leading-[1.02] tracking-[-0.02em]">{projeto.cliente}</h3>
                  <ul className="mt-6 flex flex-wrap gap-2">
                    {projeto.disciplinas.map((disciplina) => (
                      <li key={disciplina} className="rounded-full border border-line px-3 py-1.5 text-[11.5px] uppercase tracking-[0.06em] text-fg-soft">
                        {disciplina}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-[var(--acento)]">
                    {textos.ver}
                    <span aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
                <figure className={`entra-tarde relative m-0 aspect-[4/3] overflow-hidden rounded-[6px] ${i % 2 ? "md:order-1" : ""}`}>
                  <Image
                    src={projeto.capa.src}
                    alt={projeto.capa.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 660px"
                    className="scale-[1.02] object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                  />
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1.5 bg-[var(--acento)]" />
                </figure>
              </Link>
            </article>
          );
        })}
      </div>
    </ObrasComAcento>
  );
}
