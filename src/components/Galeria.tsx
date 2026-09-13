"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

export type ImagemDaGaleria = { src: string; alt?: string; width?: number; height?: number };

/**
 * A medida da fita, escrita uma vez.
 *
 * A lente pede exactamente a mesma: assim o browser serve a imagem que já tem
 * em cache no instante em que a lente abre, em vez de ir buscar outro recorte.
 */
const MEDIDA_DA_FITA = "(max-width: 900px) 80vw, 620px";

/**
 * A medida da lente.
 *
 * Travada em 1200px de propósito. Medido em produção: a primeira vez que
 * alguém pede um recorte que o otimizador ainda não fez, ele fá-lo naquele
 * instante — o `w=2048` desta galeria demorou trinta segundos a responder, e
 * 0,17s da segunda vez em diante. A fita já aquece os recortes pequenos; a
 * lente ficar neles é a diferença entre abrir já e abrir daqui a meio minuto.
 *
 * O que se perde: num ecrã 4K a fotografia é esticada. O que se ganha: a lente
 * abre sempre. Numa galeria de caso, a segunda vale mais do que a primeira.
 */
const MEDIDA_DA_LENTE = "(max-width: 1200px) 100vw, 1200px";

export type TextosDaGaleria = {
  /** O que o botão de cada imagem diz a quem usa leitor de ecrã. */
  ver: string;
  fechar: string;
  anterior: string;
  seguinte: string;
  /** «{n} de {total}» */
  contador: string;
};

/**
 * A galeria de um caso: a fita que se desliza, e a lente que a abre em grande.
 *
 * A fita fica como estava — paragem por imagem, funciona com o dedo e com a
 * roda — porque é o que mostra que há mais sem encher a página. O que faltava
 * era o passo seguinte: uma imagem de projeto é o argumento, e vê-la a 420px de
 * altura no meio de uma história é vê-la pela rama.
 *
 * A lente é a mesma fita, em grande: um deslizador com paragem por imagem, a
 * ocupar o ecrã todo. Não é um carrossel novo com a sua própria mecânica de
 * arrastar — é o mesmo gesto que já estava na página, e por isso o dedo já sabe
 * o que fazer. As setas do teclado andam nela, o Escape fecha, e o fundo
 * clicado também.
 *
 * Sem javascript não há lente, e a fita continua a deslizar como sempre: a
 * página está de pé sem isto.
 */
export function Galeria({
  imagens,
  legenda,
  textos,
}: {
  imagens: ImagemDaGaleria[];
  /** O nome do cliente, para as imagens sem texto alternativo. */
  legenda: string;
  textos: TextosDaGaleria;
}) {
  const [aberta, setAberta] = useState<number | null>(null);
  const lente = useRef<HTMLDivElement>(null);
  const fechar = useRef<HTMLButtonElement>(null);

  const abre = useCallback((indice: number) => setAberta(indice), []);
  const fecha = useCallback(() => setAberta(null), []);

  /*
   * Andar na lente é rolar a lente, e não trocar o que lá está.
   *
   * Assim o dedo desliza como na fita, o teclado anda de um em um, e o
   * contador sai da posição do scroll em vez de um estado à parte que podia
   * ficar a dizer outra coisa do que se vê.
   */
  const anda = useCallback((passo: number) => {
    const caixa = lente.current;
    if (!caixa) return;
    caixa.scrollBy({ left: passo * caixa.clientWidth, behavior: "smooth" });
  }, []);

  // Ao abrir, a lente salta para a imagem escolhida — sem animação, que aqui
  // seria ver passar tudo o que está antes dela.
  useEffect(() => {
    if (aberta === null) return;
    const caixa = lente.current;
    if (!caixa) return;
    caixa.scrollTo({ left: aberta * caixa.clientWidth, behavior: "instant" as ScrollBehavior });
    fechar.current?.focus({ preventScroll: true });
  }, [aberta]);

  // O fundo não rola por trás da lente.
  useEffect(() => {
    if (aberta === null) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [aberta]);

  useEffect(() => {
    if (aberta === null) return;
    function tecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") return fecha();
      if (evento.key === "ArrowRight") {
        evento.preventDefault();
        anda(1);
      }
      if (evento.key === "ArrowLeft") {
        evento.preventDefault();
        anda(-1);
      }
    }
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberta, anda, fecha]);

  // Qual das imagens está à vista, para o contador. Sai do scroll, que é a
  // única verdade quando se desliza com o dedo.
  const [aVista, setAVista] = useState(0);
  useEffect(() => {
    if (aberta === null) return;
    const caixa = lente.current;
    if (!caixa) return;
    const conta = () => setAVista(Math.round(caixa.scrollLeft / caixa.clientWidth));
    conta();
    caixa.addEventListener("scroll", conta, { passive: true });
    return () => caixa.removeEventListener("scroll", conta);
  }, [aberta]);

  return (
    <>
      {/* A fita. Cada imagem é um botão: quem navega com o teclado chega-lhe
          por tabulação, e quem usa leitor de ecrã ouve o que ele faz. */}
      <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
        {imagens.map((imagem, indice) => (
          <button
            key={indice}
            type="button"
            onClick={() => abre(indice)}
            aria-label={`${textos.ver}: ${imagem.alt || legenda}`}
            className="group relative shrink-0 snap-start overflow-hidden rounded-[20px]"
          >
            <Image
              src={imagem.src}
              alt={imagem.alt || legenda}
              width={imagem.width ?? 1200}
              height={imagem.height ?? 900}
              className="h-[46vw] max-h-[420px] w-auto object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
              sizes={MEDIDA_DA_FITA}
            />
            {/* A lupa só aparece ao passar: em repouso, a imagem é a imagem. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-ink/70 text-paper opacity-0 backdrop-blur-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5M11 8.5v5M8.5 11h5" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {aberta !== null ? (
        <div role="dialog" aria-modal="true" aria-label={textos.ver} className="fixed inset-0 z-50 bg-ink/98 backdrop-blur-xl">
          {/* O deslizador. `overscroll-contain` para o gesto não passar à
              página por trás quando se chega ao fim. */}
          <div
            ref={lente}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-contain"
          >
            {imagens.map((imagem, indice) => {
              // A que se vê e as duas do lado carregam já; as outras esperam
              // pela vez delas. Sem isto, cada deslize começava a descarregar
              // uma imagem do zero, e via-se.
              const perto = Math.abs(indice - aVista) <= 1 || indice === aberta;
              return (
                <div className="flex h-full w-full shrink-0 snap-center items-center justify-center p-4 sm:p-10" key={indice}>
                  {/* A moldura é a célula inteira, e as duas camadas enchem-na
                      com `object-contain`: dá o mesmo retângulo às duas, ao
                      pixel, e deixa a fotografia crescer até onde o ecrã der.
                      Medir a moldura pela imagem carregada — que foi o que
                      tentei primeiro — encolhia a lente para os 620px da fita,
                      porque a de baixo é mesmo a pequena. */}
                  <span className="relative block h-full w-full">
                    {/* A que a fita já descarregou, por baixo: dá que ver no
                        instante em que a lente abre. Desfocada de propósito,
                        para a passagem à nítida se ler como foco e não como
                        troca. */}
                    <Image
                      aria-hidden="true"
                      src={imagem.src}
                      alt=""
                      fill
                      sizes={MEDIDA_DA_FITA}
                      loading={perto ? "eager" : "lazy"}
                      className="object-contain blur-[2px]"
                    />
                    <Image
                      src={imagem.src}
                      alt={imagem.alt || legenda}
                      fill
                      sizes={MEDIDA_DA_LENTE}
                      loading={perto ? "eager" : "lazy"}
                      onLoad={(evento) => evento.currentTarget.classList.remove("opacity-0")}
                      className="object-contain opacity-0 transition-opacity duration-300"
                    />
                  </span>
                </div>
              );
            })}
          </div>

          {/* O fundo fecha. Fica por baixo dos controlos e por cima das
              imagens só nas margens, para um clique ao lado da fotografia não
              obrigar a procurar a cruz. */}
          <button
            type="button"
            onClick={fecha}
            aria-label={textos.fechar}
            className="absolute inset-0 -z-10 cursor-zoom-out"
            tabIndex={-1}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between gap-4 p-4 sm:p-6">
            <span className="rounded-full bg-ink/70 px-3 py-1.5 text-xs tabular-nums text-paper backdrop-blur-md">
              {textos.contador.replace("{n}", String(aVista + 1)).replace("{total}", String(imagens.length))}
            </span>
            <button
              ref={fechar}
              type="button"
              onClick={fecha}
              aria-label={textos.fechar}
              className="pointer-events-auto grid size-11 place-items-center rounded-full bg-ink/70 text-paper backdrop-blur-md transition-colors duration-200 hover:bg-red"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            </button>
          </div>

          {/* As setas. Escondidas ao dedo — lá o gesto é deslizar — e presentes
              a quem tem rato ou teclado. */}
          {imagens.length > 1 ? (
            <div className="absolute inset-y-0 left-0 right-0 hidden items-center justify-between p-4 sm:flex sm:p-6">
              {[
                { rotulo: textos.anterior, passo: -1, seta: "M15 5l-7 7 7 7" },
                { rotulo: textos.seguinte, passo: 1, seta: "M9 5l7 7-7 7" },
              ].map((botao) => (
                <button
                  key={botao.passo}
                  type="button"
                  onClick={() => anda(botao.passo)}
                  aria-label={botao.rotulo}
                  className="grid size-12 place-items-center rounded-full bg-ink/70 text-paper backdrop-blur-md transition-colors duration-200 hover:bg-red"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d={botao.seta} />
                  </svg>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
