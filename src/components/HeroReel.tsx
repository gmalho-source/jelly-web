"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  /** Fontes por ordem de preferência. MP4/H.264 entra aqui quando existir, para Safari. */
  sources: { src: string; type: string }[];
  poster: string;
  label: string;
  caption?: string;
  playLabel: string;
  pauseLabel: string;
  openLabel: string;
  closeLabel: string;
};

/**
 * Reel do herói: 9:16, sem som, em loop, dentro de um cartão de 20 px.
 * Nunca é fundo de texto — vive na coluna da direita, para o título continuar
 * legível. Quem tiver "reduzir movimento" ativo vê o poster e decide.
 */
export function HeroReel({ sources, poster, label, caption, playLabel, pauseLabel, openLabel, closeLabel }: Props) {
  const video = useRef<HTMLVideoElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [playing, setPlaying] = useState(true);
  const [open, setOpen] = useState(false);

  // O efeito só fala com o elemento; o estado vem dos eventos do próprio vídeo.
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.pause();
      return;
    }
    element.play().catch(() => element.pause());
  }, []);

  function toggle() {
    const element = video.current;
    if (!element) return;
    if (element.paused) element.play().catch(() => undefined);
    else element.pause();
  }

  function openFull() {
    setOpen(true);
    dialog.current?.showModal();
  }

  function closeFull() {
    setOpen(false);
    dialog.current?.close();
  }

  return (
    <figure className="m-0">
      <div className="card relative mx-auto aspect-[9/16] w-full max-w-[320px] overflow-hidden lg:mr-0">
        <video
          ref={video}
          className="h-full w-full object-cover"
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={label}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {sources.map((source) => (
            <source key={source.src} src={source.src} type={source.type} />
          ))}
        </video>

        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? pauseLabel : playLabel}
          className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center rounded-full bg-ink/70 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-ink"
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>

      <figcaption className="mx-auto mt-3 flex w-full max-w-[320px] flex-wrap items-center justify-between gap-2 text-sm text-mute lg:mr-0">
        {caption ? <span>{caption}</span> : <span />}
        <button type="button" onClick={openFull} className="font-semibold text-red hover:underline">
          {openLabel} →
        </button>
      </figcaption>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,420px)] rounded-[20px] bg-ink p-0 backdrop:bg-ink/60"
      >
        {open ? (
          <div className="flex flex-col">
            <video className="aspect-[9/16] w-full rounded-t-[20px] object-cover" controls autoPlay playsInline poster={poster}>
              {sources.map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
              ))}
            </video>
            <button type="button" onClick={closeFull} className="p-4 text-sm font-semibold text-paper hover:text-red">
              {closeLabel}
            </button>
          </div>
        ) : null}
      </dialog>
    </figure>
  );
}
