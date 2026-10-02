"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
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
 *
 * Sem consentimento, o bloqueio automático da Iubenda apanha o `iframe` no
 * instante em que entra na página e troca-lhe o endereço por `about:blank`. Quem
 * carregava no vídeo sem ter aceitado os cookies ficava a olhar para um quadrado
 * preto, sem saber porquê. Agora o componente vê o bloqueio e diz o que se passa,
 * com duas saídas: escolher os cookies — e, quando a página recarrega com o
 * consentimento, o mesmo vídeo volta a abrir — ou ver no próprio YouTube, que
 * não precisa de consentimento nenhum aqui.
 */

/** O vídeo que se quis ver antes de a página recarregar com o consentimento. */
const A_SEGUIR = "video-a-seguir";

type ApiIubenda = { cs?: { api?: { openPreferences?: () => void } } };

/** O bloqueio automático da Iubenda deixa o `iframe` em branco e marcado. */
const bloqueadoPelaIubenda = (iframe: HTMLIFrameElement) =>
  iframe.getAttribute("src") === "about:blank" || iframe.classList.contains("_iub_cs_activate");

const TEXTOS = {
  pt: {
    titulo: (plataforma: string) => `Este vídeo está no ${plataforma}`,
    corpo: (plataforma: string) =>
      `Para o ver aqui, é preciso aceitar os cookies de terceiros — o ${plataforma} só abre com eles. Também o pode ver diretamente no ${plataforma}.`,
    escolher: "Escolher cookies",
    abrir: (plataforma: string) => `Ver no ${plataforma}`,
    aEspera: "A abrir as preferências…",
  },
  en: {
    titulo: (plataforma: string) => `This video is on ${plataforma}`,
    corpo: (plataforma: string) =>
      `To watch it here, third-party cookies need to be accepted — ${plataforma} only loads with them. You can also watch it on ${plataforma} directly.`,
    escolher: "Choose cookies",
    abrir: (plataforma: string) => `Watch on ${plataforma}`,
    aEspera: "Opening preferences…",
  },
};
export function VideoEmbed({ fonte, titulo }: { fonte: FonteDeVideo; titulo: string }) {
  const [aTocar, setATocar] = useState(false);
  // O `maxresdefault` não existe para todos os vídeos; o `hqdefault` existe
  // sempre. Trocar no erro é mais fiável do que adivinhar pelo endereço.
  const [poster, setPoster] = useState(fonte.tipo === "youtube" ? fonte.poster : undefined);

  const [bloqueado, setBloqueado] = useState(false);
  const [aAbrir, setAAbrir] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  // O sítio do `iframe`, e não o `iframe`: a Iubenda não lhe muda o endereço,
  // troca-o por uma cópia em branco. Uma referência ao elemento ficava a olhar
  // para o original, já fora da página.
  const moldura = useRef<HTMLDivElement>(null);
  const chave = fonte.tipo === "ficheiro" ? fonte.src : fonte.id;

  // Voltou depois de escolher os cookies: o vídeo que se queria ver abre sozinho.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(A_SEGUIR) !== chave) return;
      sessionStorage.removeItem(A_SEGUIR);
    } catch {
      return;
    }
    // Fora do efeito, para o render não ser em cascata.
    Promise.resolve().then(() => {
      setATocar(true);
      // Depois de desenhar: o vídeo, ou o aviso se o bloqueio ainda lá estiver.
      requestAnimationFrame(() => (moldura.current ?? caixa.current)?.scrollIntoView({ block: "center" }));
    });
  }, [chave]);

  // O bloqueio pode ser imediato ou chegar uns instantes depois, quando o guião
  // da Iubenda acorda: vê-se agora e durante dois segundos.
  useEffect(() => {
    const sitio = moldura.current;
    if (!aTocar || !sitio) return;
    const ver = () => {
      const iframe = sitio.querySelector("iframe");
      return Boolean(iframe && bloqueadoPelaIubenda(iframe));
    };
    if (ver()) {
      Promise.resolve().then(() => setBloqueado(true));
      return;
    }
    const observador = new MutationObserver(() => {
      if (ver()) setBloqueado(true);
    });
    observador.observe(sitio, { subtree: true, childList: true, attributes: true, attributeFilter: ["src", "class"] });
    const fim = window.setTimeout(() => observador.disconnect(), 2000);
    return () => {
      observador.disconnect();
      window.clearTimeout(fim);
    };
  }, [aTocar]);

  const escolherCookies = () => {
    try {
      sessionStorage.setItem(A_SEGUIR, chave);
    } catch {
      // Sem armazenamento, o vídeo não abre sozinho depois; o resto funciona.
    }
    setAAbrir(true);
    // O guião do banner pode ainda não ter chegado: espera-se por ele até dez
    // segundos, e abre-se assim que existir.
    let tentativas = 0;
    const tentar = () => {
      const api = (window as unknown as { _iub?: ApiIubenda })._iub?.cs?.api;
      if (api?.openPreferences) {
        api.openPreferences();
        setAAbrir(false);
      } else if (tentativas++ < 40) {
        window.setTimeout(tentar, 250);
      } else {
        setAAbrir(false);
      }
    };
    tentar();
  };

  const src =
    fonte.tipo === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${fonte.id}?autoplay=1&rel=0&modestbranding=1`
      : fonte.tipo === "vimeo"
        ? `https://player.vimeo.com/video/${fonte.id}?autoplay=1&dnt=1`
        : "";

  const aviso = (() => {
    if (!bloqueado) return null;
    const t = TEXTOS[typeof document !== "undefined" && document.documentElement.lang.startsWith("en") ? "en" : "pt"];
    const plataforma = fonte.tipo === "vimeo" ? "Vimeo" : "YouTube";
    const fora =
      fonte.tipo === "youtube"
        ? `https://www.youtube.com/watch?v=${fonte.id}`
        : fonte.tipo === "vimeo"
          ? `https://vimeo.com/${fonte.id}`
          : "";
    return (
      <div
        ref={caixa}
        role="status"
        className="relative grid aspect-video w-full place-items-center overflow-clip rounded-[20px] bg-ink p-6 text-center text-paper sm:p-10"
      >
        {poster ? (
          // A miniatura fica por trás, escurecida: diz que o vídeo é este.
          <Image src={poster} alt="" fill sizes="(max-width: 900px) 100vw, 720px" className="object-cover opacity-20" />
        ) : null}
        <div className="relative max-w-[46ch]">
          <p className="font-display text-xl sm:text-2xl">{t.titulo(plataforma)}</p>
          <p className="mt-3 text-sm leading-relaxed text-paper/75 sm:text-base">{t.corpo(plataforma)}</p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={escolherCookies}
              disabled={aAbrir}
              className="rounded-full bg-red px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-red-deep disabled:opacity-70"
            >
              {aAbrir ? t.aEspera : t.escolher}
            </button>
            {fora ? (
              <a
                href={fora}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-paper/40 px-5 py-2.5 text-sm font-semibold text-paper transition-colors duration-200 hover:border-paper"
              >
                {t.abrir(plataforma)} ↗
              </a>
            ) : null}
          </div>
        </div>
      </div>
    );
  })();

  if (aTocar) {
    // O `iframe` nunca sai daqui depois de entrar, nem quando é bloqueado: a
    // Iubenda troca-o por uma cópia, e se o React o tentasse tirar dava erro —
    // procurava um elemento que já não é filho de ninguém. Esconde-se a caixa,
    // e o aviso entra ao lado.
    return (
      <>
        <div ref={moldura} className={bloqueado ? "hidden" : undefined}>
          <iframe
            src={src}
            title={titulo}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className="aspect-video w-full rounded-[20px] bg-ink"
          />
        </div>
        {aviso}
      </>
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
