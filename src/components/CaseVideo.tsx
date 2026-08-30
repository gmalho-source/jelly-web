"use client";

import { useEffect, useRef } from "react";

/**
 * O vídeo de um caso, de duas maneiras.
 *
 * **Ambiente** é o que o site antigo fazia e continua a ser o que se quer num
 * fundo: corre sozinho, sem som, em ciclo, sem controlos. Clicar alterna, para
 * o vídeo não ser uma coisa que só acontece. E para quem pediu menos movimento
 * ao sistema operativo, fica parado no primeiro fotograma.
 *
 * **Filme** é para uma peça que alguém se senta a ver: controlos à vista, som,
 * e começa parado. Um vídeo com som que começa sozinho é a coisa mais próxima
 * de gritar com quem chega a uma página — os browsers bloqueiam-no, e fazem
 * bem. Também não repete: um filme acaba.
 */
export function CaseVideo({
  mp4,
  webm,
  poster,
  portrait,
  modo = "ambiente",
  label,
}: {
  mp4?: string;
  webm?: string;
  poster?: string;
  portrait?: boolean;
  modo?: "ambiente" | "filme";
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const ambiente = modo !== "filme";

  useEffect(() => {
    if (!ambiente) return;
    const element = video.current;
    if (!element) return;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (calm.matches) element.pause();
      else void element.play().catch(() => undefined);
    };
    apply();
    calm.addEventListener("change", apply);
    return () => calm.removeEventListener("change", apply);
  }, [ambiente]);

  const forma = portrait ? "mx-auto max-w-[340px] aspect-[9/16]" : "aspect-video";

  return (
    <video
      ref={video}
      className={`w-full rounded-[20px] bg-ink object-cover ${forma}`}
      muted={ambiente}
      loop={ambiente}
      controls={!ambiente}
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={label}
      onClick={
        ambiente
          ? (event) => {
              const element = event.currentTarget;
              if (element.paused) void element.play().catch(() => undefined);
              else element.pause();
            }
          : undefined
      }
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      {mp4 ? <source src={mp4} type="video/mp4" /> : null}
    </video>
  );
}
