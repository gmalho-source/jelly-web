"use client";

import Image from "next/image";
import { useState } from "react";
import type { FonteDeVideo } from "@/lib/video";

/**
 * Vídeo de plataforma no corpo de um artigo, com a moldura da casa.
 *
 * Antes do clique não há YouTube nenhum na página: há a miniatura, servida pelo
 * nosso otimizador, e um botão. Isto não é só cuidado com o peso — um `iframe`
 * do YouTube são perto de dois megabytes de javascript e um cookie posto antes
 * de a pessoa decidir se quer ver o vídeo. Ao clique carrega-se o `iframe`, já
 * a tocar, no domínio sem cookies. Custa um clique e poupa a página inteira.
 *
 * O botão é um botão a sério: quem navega por teclado chega-lhe e o Enter toca.
 */
export function VideoEmbed({ fonte, titulo }: { fonte: FonteDeVideo; titulo: string }) {
  const [aTocar, setATocar] = useState(false);
  // O `maxresdefault` não existe para todos os vídeos; o `hqdefault` existe
  // sempre. Trocar no erro é mais fiável do que adivinhar pelo endereço.
  const [poster, setPoster] = useState(fonte.tipo === "youtube" ? fonte.poster : undefined);

  const src =
    fonte.tipo === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${fonte.id}?autoplay=1&rel=0&modestbranding=1`
      : fonte.tipo === "vimeo"
        ? `https://player.vimeo.com/video/${fonte.id}?autoplay=1&dnt=1`
        : "";

  if (aTocar) {
    return (
      <iframe
        src={src}
        title={titulo}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
        allowFullScreen
        className="aspect-video w-full rounded-[20px] bg-ink"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setATocar(true)}
      aria-label={`Ver o vídeo: ${titulo}`}
      className="group relative block aspect-video w-full overflow-clip rounded-[20px] bg-ink"
    >
      {poster ? (
        <Image
          src={poster}
          alt=""
          fill
          sizes="(max-width: 900px) 100vw, 720px"
          onError={() =>
            setPoster((atual) =>
              atual?.includes("maxresdefault") ? atual.replace("maxresdefault", "hqdefault") : undefined,
            )
          }
          className="object-cover opacity-90 transition-opacity duration-300 group-hover:opacity-100"
        />
      ) : null}
      {/* O triângulo é desenhado, não é uma imagem: um ícone de 40px que se
          carrega para tapar um vídeo que ainda não se carregou não faz sentido. */}
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 grid h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-red transition-transform duration-500 ease-out group-hover:scale-110"
      >
        <span className="ml-1 block h-0 w-0 border-y-[13px] border-l-[21px] border-y-transparent border-l-paper" />
      </span>
    </button>
  );
}
