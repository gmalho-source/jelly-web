"use client";

import { useEffect, useRef, useState } from "react";

/**
 * O artigo lido em voz alta.
 *
 * Um `<audio>` verdadeiro por baixo, com os controlos do browser escondidos e
 * os nossos por cima — e não porque os do browser sejam feios: é que ocupam a
 * largura toda de uma coluna de 150px de marginália e trazem consigo um menu de
 * descarregar que não pertence aqui. O elemento nativo fica no documento com
 * `preload="none"`: quem passa pelo artigo e não carrega no botão não
 * descarrega um megabyte de voz.
 *
 * O que se vê é um botão e o tempo. Quem quiser saltar para o meio arrasta a
 * barra; quem só quiser ouvir carrega uma vez e esquece.
 */
export function OuvirArtigo({
  src,
  segundos,
  textos,
}: {
  src: string;
  segundos?: number;
  textos: { convite: string; ouvir: string; pausar: string; barra: string };
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const [atocar, setAtocar] = useState(false);
  const [posicao, setPosicao] = useState(0);
  // A duração vem do CMS, medida quando o ficheiro foi gerado: assim o tempo
  // aparece antes de alguém carregar em tocar, que é quando ajuda a decidir.
  const [duracao, setDuracao] = useState(segundos ?? 0);

  useEffect(() => {
    const elemento = audio.current;
    if (!elemento) return;
    const anda = () => setPosicao(elemento.currentTime);
    const mede = () => setDuracao(elemento.duration || segundos || 0);
    const acaba = () => {
      setAtocar(false);
      setPosicao(0);
    };
    elemento.addEventListener("timeupdate", anda);
    elemento.addEventListener("loadedmetadata", mede);
    elemento.addEventListener("ended", acaba);
    return () => {
      elemento.removeEventListener("timeupdate", anda);
      elemento.removeEventListener("loadedmetadata", mede);
      elemento.removeEventListener("ended", acaba);
    };
  }, [segundos]);

  const relogio = (valor: number) => {
    const total = Math.max(0, Math.round(valor));
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
  };

  function alterna() {
    const elemento = audio.current;
    if (!elemento) return;
    if (elemento.paused) {
      void elemento.play();
      setAtocar(true);
    } else {
      elemento.pause();
      setAtocar(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <audio ref={audio} src={src} preload="none" />

      {/* O convite, antes do botão: nesta coluna o leitor aparece a seguir a
          um nome e a uma data, e um triângulo sozinho ali não diz que há uma
          gravação — diz que há um controlo qualquer. A frase é que abre a
          porta a quem passou os olhos pelo artigo e não tem mãos para o ler. */}
      <p className="text-xs text-fg-soft">{textos.convite}</p>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={alterna}
          aria-label={atocar ? textos.pausar : textos.ouvir}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-paper transition-colors duration-200 hover:bg-red"
        >
          {/* Dois triângulos e duas barras, em traço: um ícone carregado de fora
              para dois estados é uma viagem à rede por catorze píxeis. */}
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="currentColor">
            {atocar ? <path d="M8 5h3v14H8zM13 5h3v14h-3z" /> : <path d="M8 5.5v13l11-6.5z" />}
          </svg>
        </button>
        <span className="text-xs tabular-nums text-fg-soft">
          {relogio(posicao)}
          {duracao ? ` / ${relogio(duracao)}` : ""}
        </span>
      </div>

      {/* A barra é um `range` verdadeiro: arrasta-se com o rato, anda com as
          setas do teclado e um leitor de ecrã sabe dizer onde está. */}
      <input
        type="range"
        min={0}
        max={duracao || 1}
        step={1}
        value={posicao}
        aria-label={textos.barra}
        onChange={(evento) => {
          const valor = Number(evento.target.value);
          setPosicao(valor);
          if (audio.current) audio.current.currentTime = valor;
        }}
        className="h-1 w-full max-w-[150px] cursor-pointer appearance-none rounded-full bg-line accent-[var(--color-red)]"
      />
    </div>
  );
}
