"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const lista = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const open = openedOn === pathname;

  /**
   * Onde a janela abre em repouso.
   *
   * No primeiro item da lista está um serviço, que é uma cor plana; no primeiro
   * com imagem está o projeto mais recente. A folha abre com uma fotografia e
   * não com um rectângulo de cor. Calcula-se dos mosaicos e não dos resultados:
   * assim não depende da procura, e pode ser usado onde a procura muda — que é
   * o sítio certo para mexer no cursor. Corrigi-lo num efeito depois do render
   * provoca renders em cascata.
   */
  const primeiraImagem = useMemo(() => {
    const visiveis = tiles.filter((tile) => !tile.hidden);
    const encontrado = visiveis.findIndex((tile) => tile.image);
    return encontrado === -1 ? 0 : encontrado;
  }, [tiles]);

  const openSheet = useCallback(() => {
    setOpenedOn(pathname);
    setCursor(primeiraImagem);
    requestAnimationFrame(() => input.current?.focus());
  }, [pathname, primeiraImagem]);

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

  /**
   * A instrução da procura, sem os exemplos.
   *
   * Sai da própria frase — o que vem antes do travessão — em vez de ser uma
   * tradução nova a manter em dois ficheiros. Se um dia a frase deixar de ter
   * travessão, fica a frase inteira, que é o comportamento certo.
   */
  const convite = copy.placeholder.split("—")[0]!.trim() || copy.placeholder;

  /** O que a janela mostra: o item onde o cursor está. */
  const destaque = results.length ? results[active] : undefined;

  function close() {
    setOpenedOn(null);
    setQuery("");
    // Zero, e não a primeira imagem: quem decide onde a folha abre é o
    // `openSheet`. Pôr aqui um valor reativo só tornava esta função reativa.
    setCursor(0);
    trigger.current?.focus({ preventScroll: true });
  }

  /*
   * As setas podem levar o cursor para fora da parte visível da lista — no
   * desktop os dezasseis destinos cabem no ecrã e não acontece, mas num
   * telemóvel a lista rola, e navegar às cegas não é navegar.
   *
   * `block: "nearest"` é o que faz isto não ser incomodativo: uma linha que já
   * está inteira à vista não provoca deslocação nenhuma. Por isso passar o rato
   * — que também move o cursor — nunca puxa a lista debaixo do ponteiro.
   */
  useEffect(() => {
    if (!open) return;
    lista.current
      ?.querySelector<HTMLElement>(`[data-indice="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

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
      // Uma lista, e não uma grelha: as quatro setas andam de um em um. Antes
      // as verticais saltavam o número de colunas, que era o certo quando isto
      // eram quadrados lado a lado e passou a ser um salto sem razão.
      const moves: Record<string, number> = {
        ArrowRight: 1,
        ArrowLeft: -1,
        ArrowDown: 1,
        ArrowUp: -1,
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
            {/*
              O convite da procura é um rótulo por cima do campo, e não o
              `placeholder` do campo.

              A frase é «escreva para encontrar — cliente, serviço, artigo»:
              num telemóvel de 390px não cabe ao lado do «English» e o browser
              cortava-a a meio de uma palavra, encostada a ele, com ar de coisa
              partida. Um `placeholder` não se deixa truncar com reticências
              nem encurtar por media query — mas um elemento deixa-se. No
              telemóvel fica a instrução; no desktop entram também os exemplos,
              que são o que diz que isto procura projetos e artigos e não só
              páginas.
            */}
            <span className="relative min-w-0 flex-1">
              <input
                ref={input}
                value={query}
                onChange={(event) => {
                  const valor = event.target.value;
                  setQuery(valor);
                  setCursor(valor.trim() ? 0 : primeiraImagem);
                }}
                aria-label={copy.filterLabel}
                className="w-full bg-transparent py-1 font-display text-xl text-paper outline-none sm:text-2xl"
              />
              {!query ? (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-0 flex items-center truncate text-base font-light text-paper/35"
                >
                  <span className="truncate sm:hidden">{convite}</span>
                  <span className="hidden truncate sm:inline">{copy.placeholder}</span>
                </span>
              ) : null}
            </span>
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
            Duas partes: a lista do que há, e uma janela que mostra o que se
            está a apontar.

            A folha era uma grelha de dezasseis quadrados de 360×360. Media
            1,97 ecrãs de altura num portátil e 2,26 no telemóvel — nunca se via
            o índice inteiro — e gastava 130 mil píxeis para dizer «Blog».
            Metade dos quadrados eram `slate` sobre um fundo quase igual e liam-
            se como buracos; a outra metade era chartreuse, coral e vermelho e
            gritava. O resultado era um tabuleiro irregular de manchas, e é isso
            que se lia como confusão.

            A lista resolve a leitura: dezasseis destinos cabem num ecrã, sem
            rolar, e a cor deixa de rodar por índice. A janela guarda a imagem,
            que numa agência visual é o argumento — mas **uma** de cada vez, a do
            que se aponta, em vez de dezasseis a competir.

            No telemóvel não há rato, e uma janela que segue o ponteiro não faz
            sentido: sobe para cima da lista, fica com altura fixa e mostra o
            projeto mais recente até alguém escrever. A escrever passa a mostrar
            o primeiro resultado, que é quando ela é mais útil num ecrã pequeno.

            `min-h-0` nas duas colunas: sem isso um filho com `overflow-y-auto`
            dentro de um flex herda `min-height:auto`, recusa-se a encolher, e a
            lista empurra a folha para fora do ecrã em vez de rolar dentro dela.
          */}
          <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
            {/* A janela. `aria-hidden` e fora da ordem de tabulação: é a mesma
                ligação que já está na lista, e um leitor de ecrã não tem de a
                ouvir duas vezes. Quem tem dedo pode tocá-la. */}
            {destaque ? (
            <Link
              href={destaque.href}
              onClick={() => setOpenedOn(null)}
              aria-hidden="true"
              tabIndex={-1}
              className="relative order-first h-[26svh] shrink-0 overflow-hidden bg-slate ecra-curto:hidden lg:order-last lg:h-auto lg:w-[46%]"
            >
              {destaque.image ? (
                <Image
                  key={destaque.image}
                  src={destaque.image}
                  alt=""
                  fill
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />
              ) : (
                <span className={`absolute inset-0 ${destaque.tone ?? "bg-slate"}`} />
              )}

              {/* O nome precisa de chão: um véu em baixo, que numa fotografia se
                  lê como sombra e numa cor plana como faixa. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/60 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 px-5 pb-5 sm:px-8 sm:pb-8">
                <span className="text-[10px] uppercase tracking-[0.12em] text-paper/55">
                  {destaque.kind}
                </span>
                <span className="font-display text-2xl leading-[1.06] text-paper lg:text-[clamp(28px,3vw,44px)]">
                  {destaque.label}
                </span>
              </span>
            </Link>
            ) : null}

            {/* Duas colunas no desktop, e não porque duas colunas sejam
                bonitas: dezasseis destinos em coluna única dão 904px, e num
                portátil de 800px isso volta a ser uma lista que rola. Em duas,
                a mais alta fica por 452px e o índice cabe mesmo no ecrã.

                `column-count` e não uma grelha: uma grelha põe o segundo item
                à direita do primeiro, e a leitura passa a ser aos ziguezagues.
                Com colunas de texto, cada banda cai inteira numa coluna
                (`break-inside-avoid`) e lê-se de cima para baixo, como uma
                lista. */}
            <div
              ref={lista}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden lg:[column-count:2] lg:[column-gap:2rem]"
            >
              {bands.map((band) => (
                <div key={band.name ?? "tudo"} className="break-inside-avoid">
                  {band.name ? (
                    <p className="px-5 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-paper/35 sm:px-8">
                      {band.name}
                    </p>
                  ) : null}
                  {band.itens.map(({ tile, index }) => (
                    <Link
                      key={tile.href + tile.label}
                      href={tile.href}
                      onClick={() => setOpenedOn(null)}
                      data-indice={index}
                      onMouseEnter={() => setCursor(index)}
                      onFocus={() => setCursor(index)}
                      className={`flex items-baseline justify-between gap-4 border-b border-paper/10 px-5 py-2.5 transition-colors duration-150 sm:px-8 ${
                        index === active ? "bg-paper/[0.07] text-paper" : "text-paper/70 hover:text-paper"
                      }`}
                    >
                      <span className="font-display text-[19px] leading-[1.4]">{tile.label}</span>
                      <span
                        className={`shrink-0 text-[10px] uppercase tracking-[0.12em] ${
                          index === active ? "text-red" : "text-paper/30"
                        }`}
                      >
                        {tile.kind}
                      </span>
                    </Link>
                  ))}
                </div>
              ))}
              {/* `column-span:all` para a frase não se partir ao meio entre as
                  duas colunas do desktop — «Nada com esse nome. Apague» de um
                  lado e «uma letra.» do outro, que foi o que aconteceu. */}
              {!results.length ? (
                <p className="px-5 py-16 text-center text-paper/50 [column-span:all] sm:px-8">
                  {copy.empty}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
