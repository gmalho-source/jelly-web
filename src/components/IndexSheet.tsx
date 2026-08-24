"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChangePill } from "./ChangePill";
import { JellyWordmark } from "./JellyLogo";

export type SheetTile = {
  label: string;
  kind: string;
  href: string;
  image?: string;
  tone?: string;
  /** Banda onde o mosaico vive: «Serviços», «Trabalho», «A casa». */
  group?: string;
  /**
   * Fora da folha, mas dentro da procura.
   *
   * O índice mostra o site em três bandas curtas — mas continua a encontrar
   * qualquer projeto ou artigo pelo nome. Um mosaico escondido não aparece com
   * a folha em repouso e aparece à primeira letra escrita.
   */
  hidden?: boolean;
};

export type SheetCopy = {
  /** Rótulo do gatilho e título do diálogo. */
  index: string;
  placeholder: string;
  filterLabel: string;
  empty: string;
  of: string;
  close: string;
  contact: string;
  /** O que a pílula diz quando já se está na página de contactos. */
  arrived?: string;
  /** Nome da outra língua. Ausente na proposta, presente no site. */
  language?: string;
};

/**
 * As disciplinas da casa, a passar no gatilho do índice em vez da palavra
 * «índice». São as mesmas nas duas línguas, por isso não vão para tradução. O
 * nome do botão para quem usa leitor de ecrã continua a ser «índice»: o que
 * passa é decoração.
 */
const DISCIPLINAS = ["BRANDING", "DIGITAL", "MARKETING", "AI SYSTEMS", "TECHNOLOGY"];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

/**
 * Índice em folha de contacto.
 *
 * Não há menu: há um gesto. O gatilho abre o site todo em imagem — projetos,
 * serviços, artigos, páginas — e a partir daí escrever é navegar: cada tecla
 * filtra a folha, as setas andam nela, o Enter entra. É a antítese de uma lista
 * de links, e usa o material que a casa tem: 460 imagens reais.
 *
 * O rodapé da página continua a ter o mapa do site em texto, para quem não tem
 * JavaScript e para o Google.
 */
export function IndexSheet({
  tiles,
  copy,
  homeHref,
  contactHref,
  languageHref,
}: {
  tiles: SheetTile[];
  copy: SheetCopy;
  homeHref: string;
  contactHref: string;
  languageHref?: string;
}) {
  // A folha está aberta para o caminho onde foi aberta. Navegar muda o caminho
  // e fecha-a sozinha — sem isto ficava aberta em cima da página escolhida, e a
  // navegação aqui é toda do lado do cliente.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const open = openedOn === pathname;

  const openSheet = useCallback(() => {
    setOpenedOn(pathname);
    requestAnimationFrame(() => input.current?.focus());
  }, [pathname]);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    // Em repouso, a folha mostra as bandas; a escrever, procura tudo o que há.
    if (!term) return tiles.filter((tile) => !tile.hidden);
    return tiles.filter((tile) =>
      normalize(`${tile.label} ${tile.kind}`).includes(term),
    );
  }, [query, tiles]);

  /*
   * As bandas, com o índice de cada mosaico na lista de resultados: é esse
   * índice que as setas do teclado percorrem, e por isso ele não pode ser o da
   * banda. A escrever não há bandas — os resultados são uma folha só, porque
   * agrupar dois resultados debaixo de um título é dar-lhes uma arrumação que
   * eles não têm.
   */
  const bands = useMemo(() => {
    const itens = results.map((tile, index) => ({ tile, index }));
    if (query.trim()) return [{ name: null as string | null, itens }];
    const saida: { name: string | null; itens: typeof itens }[] = [];
    for (const item of itens) {
      const name = item.tile.group ?? null;
      const ultima = saida[saida.length - 1];
      if (!ultima || ultima.name !== name) saida.push({ name, itens: [item] });
      else ultima.itens.push(item);
    }
    return saida;
  }, [results, query]);

  const active = results.length
    ? ((cursor % results.length) + results.length) % results.length
    : 0;

  function close() {
    setOpenedOn(null);
    setQuery("");
    setCursor(0);
    trigger.current?.focus({ preventScroll: true });
  }

  // Com a folha aberta, o fundo não deve rolar por trás dela.
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [open]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const typing = document.activeElement === input.current;

      if (event.key === "Escape" && open) return close();

      if (!open) {
        // Uma letra em qualquer sítio da página abre a folha e começa a filtrar.
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          openSheet();
        }
        return;
      }

      if (!typing) return;
      const columns = window.innerWidth >= 1024 ? 4 : 2;
      const moves: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: columns,
        ArrowUp: -columns,
      };
      if (event.key in moves) {
        event.preventDefault();
        setCursor((value) => value + moves[event.key]);
      }
      if (event.key === "Enter" && results.length) {
        event.preventDefault();
        router.push(results[active].href);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, active, router, openSheet]);

  return (
    <>
      {/* Pastilhas em vez de texto solto: a barra atravessa secções escuras,
          claras e vermelhas, e tem de se ler em todas. */}
      {/* O logo é uma etiqueta: quadrado, encostado ao topo, sem margem por
          cima — como a etiqueta cosida na gola de uma peça de roupa. */}
      <Link
        href={homeHref}
        aria-label="Jelly"
        className="fixed left-5 top-0 z-40 grid h-[88px] w-[88px] place-items-center bg-red transition-colors duration-200 hover:bg-red-deep sm:left-8"
      >
        <JellyWordmark className="w-[68px] text-paper" />
      </Link>

      {/* A altura da barra é a da etiqueta: é o que põe o botão do meio à
          mesma altura do logo e do índice. */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 h-[88px] px-5 sm:px-8">
        {/* Na página de contactos já se chegou: a pílula deixa de ser um convite
            e passa a assinalar presença. As duas estão no documento e é o CSS
            que escolhe, a partir de uma marca que a página de contactos deixa —
            decidir isto no cliente com o `usePathname` dava um desencontro na
            hidratação, porque nas páginas geradas de véspera o caminho ainda não
            se conhece. */}
        <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 sm:block">
          <Link
            href={contactHref}
            className="pilula-convite pointer-events-auto inline-flex rounded-full bg-ink/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper backdrop-blur-md transition-colors duration-200 hover:bg-red"
          >
            {copy.contact}
          </Link>
          <div className="pilula-chegada hidden">
            <ChangePill label={copy.arrived ?? copy.contact} />
          </div>
        </div>
      </div>

      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="folha"
        onClick={openSheet}
        aria-label={copy.index}
        className="group fixed right-5 top-5 z-40 flex items-center gap-3 rounded-full bg-paper/10 px-4 py-2.5 text-paper backdrop-blur-md transition-colors duration-200 hover:bg-paper hover:text-ink sm:right-8 sm:top-8"
      >
        <span
          aria-hidden="true"
          className="word-cycle eyebrow text-current"
          style={{ "--word-count": DISCIPLINAS.length } as React.CSSProperties}
        >
          {DISCIPLINAS.map((palavra, index) => (
            <span key={palavra} style={{ "--word-index": index } as React.CSSProperties}>
              {palavra}
            </span>
          ))}
        </span>
        <span aria-hidden="true" className="grid grid-cols-3 gap-[3px]">
          {Array.from({ length: 9 }).map((_, index) => (
            <span
              key={index}
              className="block h-[3px] w-[3px] rounded-full bg-current"
            />
          ))}
        </span>
      </button>

      {open ? (
        <div
          id="folha"
          role="dialog"
          aria-modal="true"
          aria-label={copy.index}
          className="fixed inset-0 z-50 flex flex-col bg-ink/98 backdrop-blur-xl"
        >
          <div className="flex items-center gap-4 border-b border-paper/15 px-5 py-4 sm:px-8">
            <span aria-hidden="true" className="text-red">
              /
            </span>
            <input
              ref={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.placeholder}
              aria-label={copy.filterLabel}
              className="min-w-0 flex-1 bg-transparent py-1 font-display text-xl text-paper outline-none placeholder:font-sans placeholder:text-base placeholder:font-light placeholder:text-paper/35 sm:text-2xl"
            />
            <span className="hidden text-xs text-paper/40 sm:block">
              {results.length} {copy.of} {tiles.length}
            </span>
            {languageHref && copy.language ? (
              <Link
                href={languageHref}
                onClick={() => setOpenedOn(null)}
                className="text-xs text-paper/50 hover:text-paper"
              >
                {copy.language}
              </Link>
            ) : null}
            {/*
              Uma cruz, e não a palavra «esc»: quem está com o rato na mão não
              tem de saber que a tecla existe (continua a fechar, e o `aria-label`
              diz o que o botão faz). A área de toque é maior do que o desenho —
              44px, que é o mínimo para um dedo — e a cruz é traço, não ícone
              carregado de fora. */}
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-paper/60 transition-colors duration-200 hover:bg-paper/10 hover:text-paper focus-visible:bg-paper/10 focus-visible:text-paper"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M5 5 19 19M19 5 5 19" />
              </svg>
            </button>
          </div>

          {/*
            `overflow-x-hidden` não é decoração: uma caixa com `overflow-y: auto`
            fica com `overflow-x: auto` também, e sete pixels a mais numa
            etiqueta comprida davam à folha uma gaveta lateral. No telefone,
            isso sentia-se como o menu a dançar para os lados a cada gesto.
          */}
          {/*
            `grid-auto-rows: min-content` é o que faz a linha ter a altura do
            mosaico. Com linhas `auto`, e o índice a ter altura definida (ocupa o
            ecrã), o browser reparte a altura disponível pelas linhas: medi 162px
            onde tinham de estar 360, e o mosaico transbordava. `min-content`
            nunca estica — e os títulos das bandas continuam a medir-se pelo
            texto, 54px, porque a altura deles é o texto deles.

            `overflow-x-hidden` também não é decoração: uma caixa com
            `overflow-y: auto` fica com `overflow-x: auto` de tabela, e sete
            pixels a mais numa etiqueta comprida davam à folha uma gaveta
            lateral. No telefone sentia-se como o menu a dançar para os lados.
          */}
          <div className="grid flex-1 grid-cols-2 content-start gap-px overflow-y-auto overflow-x-hidden bg-paper/10 [grid-auto-rows:min-content] lg:grid-cols-4">
            {bands.map((band) => (
              <Fragment key={band.name ?? "tudo"}>
                {band.name ? (
                  <p className="col-span-full bg-ink px-5 pb-2 pt-7 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper/35 sm:px-8">
                    {band.name}
                  </p>
                ) : null}
                {band.itens.map(({ tile, index }) => (
                  <Link
                    key={tile.href + tile.label}
                    href={tile.href}
                    onClick={() => setOpenedOn(null)}
                    onMouseEnter={() => setCursor(index)}
                    className="group relative block overflow-hidden bg-ink"
                  >
                    {/*
                      A altura de um mosaico é a largura de uma coluna — duas
                      colunas no telefone, quatro no desktop — e está escrita
                      assim, em `vw`, e não com `aspect-square`.
                      Experimentei-o das duas maneiras: a proporção não resolve
                      aqui. Uma coluna `fr` só tem largura depois de a linha
                      estar medida, e para medir a linha o browser usa a largura
                      intrínseca do conteúdo, que é zero quando tudo dentro do
                      mosaico está em posição absoluta. Resultado: o quadrado
                      ficava com 162px de altura em vez de 359, e os mosaicos
                      passavam por cima dos de baixo a esconder-lhes o nome.
                      Uma medida definida não tem esse problema — e não afecta os
                      títulos das bandas, que continuam a medir-se pelo texto.
                    */}
                    <span aria-hidden="true" className="block h-[50vw] lg:h-[25vw]" />

                    {tile.image ? (
                      <Image
                        src={tile.image}
                        alt=""
                        width={640}
                        height={640}
                        sizes="(max-width: 1024px) 50vw, 25vw"
                        className="mosaico-zoom absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <span className={`absolute inset-0 ${tile.tone ?? "bg-slate"}`} />
                    )}

                    {/* O nome vive sobre o quadrado, e por isso precisa de chão:
                        um véu de tinta em baixo, que numa cor plana se lê como
                        faixa e numa fotografia como sombra. O `z` é explícito
                        porque a imagem, promovida ao seu próprio plano pelo
                        `will-change`, passava à frente de quem vem depois. */}
                    <span
                      aria-hidden="true"
                      className={`absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t to-transparent ${
                        tile.image
                          ? "h-1/2 from-ink via-ink/65"
                          : // Sobre uma cor da marca o véu é mais curto e mais
                            // leve: o suficiente para o nome se ler, sem
                            // apagar o vermelho ou o verde que ali estão a
                            // fazer o seu trabalho.
                            "h-2/5 from-ink/85 via-ink/45"
                      }`}
                    />

                    <span className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-1 px-4 pb-4">
                      <span className="text-[10px] uppercase tracking-[0.12em] text-paper/50">
                        {tile.kind}
                      </span>
                      <span className="font-display text-lg leading-tight text-paper">
                        {tile.label}
                      </span>
                    </span>

                    {/* Onde está o cursor do teclado: um contorno, e não um
                        fundo — o fundo do mosaico é a imagem. */}
                    {index === active ? (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 z-30 ring-2 ring-inset ring-red"
                      />
                    ) : null}
                  </Link>
                ))}
              </Fragment>
            ))}
            {!results.length ? (
              <p className="col-span-full bg-ink px-5 py-16 text-center text-paper/50">
                {copy.empty}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
