"use client";

import { useEffect, useRef } from "react";

/**
 * Vídeo de caso: corre sozinho, sem som e sem controlos, como no site antigo —
 * mas para quem pediu menos movimento ao sistema operativo. Clicar alterna,
 * para o vídeo não ser uma coisa que só acontece.
 */
export function CaseVideo({
  mp4,
  webm,
  poster,
  portrait,
  label,
}: {
  mp4?: string;
  webm?: string;
  poster?: string;
  portrait?: boolean;
  label: string;
}) {
  const video = useRef<HTMLVideoElement>(null);

  useEffect(() => {
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
  }, []);

  return (
    <video
      ref={video}
      className={`w-full rounded-[20px] bg-ink object-cover ${portrait ? "mx-auto max-w-[340px] aspect-[9/16]" : "aspect-video"}`}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={label}
      onClick={(event) => {
        const element = event.currentTarget;
        if (element.paused) void element.play().catch(() => undefined);
        else element.pause();
      }}
    >
      {webm ? <source src={webm} type="video/webm" /> : null}
      {mp4 ? <source src={mp4} type="video/mp4" /> : null}
    </video>
  );
}
