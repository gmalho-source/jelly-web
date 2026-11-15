"use client";

import { useLayoutEffect, useRef } from "react";

/** Uma capa já pronta para o `<img>`: os endereços vêm do otimizador do Next. */
export type CapaDoTopo = { src: string; srcSet?: string; sizes?: string; alt: string };

/** Quantas capas passam no topo, uma por slide. */
const QUANTAS = 4;

/** Quanto tempo cada uma fica à vista, em segundos (o mesmo que o topo já tinha). */
const SEGUNDOS = 5.2;

/**
 * Sorteia `quantas` capas e põe-nas na caixa, antes de `antes` (ou no fim).
 *
 * Corre de duas maneiras: escrita tal e qual num `<script>` dentro do HTML
 * (`String(monta)`), e chamada aqui no browser quando se chega à homepage por
 * um link do próprio site. Por isso não pode usar nada de fora de si — nem
 * imports, nem constantes do módulo: tudo entra pelos argumentos.
 */
function monta(caixa: HTMLElement, capas: CapaDoTopo[], quantas: number, segundos: number, antes: Node | null) {
  const lista = capas.slice();
  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const troca = lista[i];
    lista[i] = lista[j];
    lista[j] = troca;
  }
  const escolhidas = lista.slice(0, quantas);
  const varias = escolhidas.length > 1;
  for (let indice = 0; indice < escolhidas.length; indice++) {
    const capa = escolhidas[indice];
    const img = document.createElement("img");
    img.alt = capa.alt;
    img.width = 1600;
    img.height = 1600;
    img.decoding = "async";
    // A primeira é o LCP da homepage; as outras só aparecem passados uns
    // segundos, e pedem-se com prioridade baixa para não lhe disputarem a rede.
    img.setAttribute("fetchpriority", indice === 0 ? "high" : "low");
    img.className = varias ? "grayscale hero-fade absolute inset-0 h-full w-full object-cover" : "grayscale h-full w-full object-cover";
    if (varias) {
      img.style.animationDuration = segundos * escolhidas.length + "s";
      img.style.animationDelay = "-" + segundos * indice + "s";
    }
    // `sizes` e `srcset` antes do `src`: com o `src` primeiro, o browser
    // começava logo a pedir a imagem grande.
    if (capa.sizes) img.sizes = capa.sizes;
    if (capa.srcSet) img.srcset = capa.srcSet;
    img.src = capa.src;
    caixa.insertBefore(img, antes);
  }
}

/** JSON que pode ir dentro de um `<script>` sem o fechar a meio. */
const seguro = (valor: unknown) => JSON.stringify(valor).replace(/</g, "\\u003c");

/**
 * O topo da homepage: quatro capas sorteadas, a cada visita, entre as dos doze
 * projetos mais recentes — uma por slide, a preto e branco, em fundido.
 *
 * O sorteio é do browser: a página é a mesma para toda a gente (vem da cache),
 * e um sorteio no servidor dava as mesmas quatro a quem chegasse na mesma hora.
 * Mas a primeira capa é a imagem que se vê primeiro (o LCP), e esperar pelo
 * React para a escolher deixava o topo vazio até o JavaScript correr — segundos,
 * num telemóvel. Por isso o sorteio vai num `<script>` pequeno dentro do próprio
 * HTML: corre enquanto a página está a ser lida, antes de se pintar, e a imagem
 * começa a descarregar ali. Ninguém vê uma capa a ser trocada por outra.
 *
 * O React não mexe no que está dentro da caixa (`dangerouslySetInnerHTML`, que
 * ele não reconcilia), para não apagar as imagens que o script lá pôs. Quando
 * se chega por um link do site, o HTML não é lido de novo e o script não corre:
 * aí é o `useLayoutEffect` que sorteia, antes de se pintar.
 *
 * O preto e branco é do CSS (`grayscale`), não do ficheiro: as capas continuam
 * a cores no resto do site.
 */
export function CapasDoTopo({ capas }: { capas: CapaDoTopo[] }) {
  const caixa = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el || el.querySelector("img")) return;
    const script = el.querySelector("script");
    monta(el, capas, QUANTAS, SEGUNDOS, script);
    script?.remove();
  }, [capas]);

  // Corre dentro da caixa e sai dela a seguir, para a primeira capa ser o
  // primeiro filho (o CSS do fundido conta com isso).
  const script =
    `<script>(function(){var s=document.currentScript;` +
    `(${String(monta)})(s.parentNode,${seguro(capas)},${QUANTAS},${SEGUNDOS},s);s.remove()})()</script>`;

  return (
    <div
      ref={caixa}
      className="drift-hero relative aspect-square overflow-hidden"
      data-hero-count={Math.min(QUANTAS, capas.length)}
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
