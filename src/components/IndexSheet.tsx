"use client";

import type React from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChangePill } from "./ChangePill";
import { JellyWordmark } from "./JellyLogo";

/**
 * A largura com que a janela do índice pede a imagem. Está aqui fora, e não
 * escrita no `<Image>`, porque o aquecimento tem de pedir exactamente o mesmo
 * ficheiro: com um `sizes` diferente, o browser escolhia outra largura da lista
 * e aquecia uma imagem que a janela nunca vai usar.
 */
const TAMANHOS_DA_JANELA = "(max-width: 1024px) 100vw, 46vw";

export type SheetTile = {
  label: string;
  kind: string;
  href: string;
  image?: string;
  tone?: string;
  /** Banda onde o mosaico vive: «Serviços», «Trabalho», «A casa». */
  group?: string;
  /**
   * A linha viva da janela: o último artigo, a última notícia.
   *
   * O «Blog» e a «Newsroom» são portas, e uma porta não tem imagem. Ficavam
   * com um rectângulo de cor onde todos os outros destinos têm fotografia — e,
   * pior, não diziam nada de novo a quem já sabe o que é um blog. Com a capa
   * do artigo mais recente por baixo e o título dele por cima, a janela passa
   * a responder à pergunta que se faz mesmo antes de entrar: «o que há de
   * novo?». O nome da página continua lá em grande: quem aponta continua a
   * saber para onde vai.
   */
  ultimo?: { rotulo: string; titulo: string };
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

/**
 * As cores que a pílula pode vestir sobre fundo claro.
 *
 * Vão com a cor do texto colada: sobre o vermelho a letra é papel, sobre as três
 * claras é tinta, e é isso que as torna legíveis — a tinta dá 8,9 no coral, 9,1
 * no lavender e 13,0 no chartreuse, onde o branco daria menos de dois.
 *
 * Escritas por inteiro porque o Tailwind lê o código à procura das classes: uma
 * construída por interpolação não chega à folha de estilos.
 */
const CORES_EM_CLARO = [
  "bg-red text-paper",
  "bg-coral text-ink",
  "bg-chartreuse text-ink",
  "bg-lavender text-ink",
];

/** Uma cor ao acaso, nunca a que estava: repetir lê-se como não ter mudado. */
function outraCor(anterior: string | null) {
  const possiveis = CORES_EM_CLARO.filter((cor) => cor !== anterior);
  return possiveis[Math.floor(Math.random() * possiveis.length)];
}

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
  /*
   * A pílula sabe o que tem por baixo.
   *
   * Ela é papel translúcido sobre um topo em tinta, e era invisível assim que a
   * página rolava para uma secção em papel — papel claro sobre papel claro.
   * Aqui não há regra de CSS que sirva: um elemento `fixed` não herda nada de
   * quem lhe passa por baixo, e o browser não deixa ler a cor do ecrã. Mede-se,
   * então, o que está mesmo debaixo dela, e sobre fundo claro toma o vermelho
   * da casa.
   *
   * Não se ouve o scroll: um observador com a janela recortada à faixa da
   * pílula acorda só quando uma secção lhe entra ou sai de baixo, que é
   * exatamente quando a resposta pode mudar.
   */
  const [fundoClaro, setFundoClaro] = useState(false);
  /*
   * A cor não roda com o relógio: sorteia-se no instante em que a pílula entra
   * num fundo claro e fica essa enquanto lá estiver — uma secção ou a página
   * toda. Duas secções claras seguidas são uma entrada só; para haver sorteio
   * novo tem de passar por escuro pelo meio. Quem não faz scroll nunca a vê
   * mudar, e é isso que se quer: a cor é um sinal de que se atravessou uma
   * fronteira, não um efeito a acontecer sozinho ao lado do texto.
   */
  const [corEmClaro, setCorEmClaro] = useState<string | null>(null);
  const estavaClaro = useRef(false);
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

  /*
   * Preparar a abertura sem abrir.
   *
   * O índice cobre o ecrã e abre com uma fotografia grande. Sem isto, essa
   * fotografia só começava a descer depois do clique, e o índice aparecia com
   * um rectângulo escuro que se pintava à vista. Abrir o menu ao passar o rato
   * resolvia a espera mas trazia pior — aberturas sem querer, o teclado roubado
   * pelo campo de procura, e nada disso existe num telemóvel. Por isso o rato
   * não abre: avisa. Quando se aproxima do botão, a primeira fotografia começa
   * a descer, e o clique encontra-a já no browser.
   *
   * Pede-se o ficheiro que a janela vai pedir, com o `getImageProps` e a mesma
   * largura, para o browser escolher da lista a mesma versão. Cada imagem é
   * aquecida uma vez.
   */
  const aquecidas = useRef(new Set<string>());
  const aquecer = useCallback((src?: string) => {
    if (!src || aquecidas.current.has(src)) return;
    aquecidas.current.add(src);
    const { props } = getImageProps({ src, alt: "", fill: true, sizes: TAMANHOS_DA_JANELA });
    const imagem = new window.Image();
    imagem.decoding = "async";
    if (props.sizes) imagem.sizes = props.sizes;
    if (props.srcSet) imagem.srcset = props.srcSet;
    imagem.src = props.src;
  }, []);

  const prepararAbertura = useCallback(() => {
    aquecer(tiles.filter((tile) => !tile.hidden)[primeiraImagem]?.image);
  }, [aquecer, tiles, primeiraImagem]);

  const openSheet = useCallback(() => {
    setOpenedOn(pathname);
    setCursor(primeiraImagem);
    requestAnimationFrame(() => input.current?.focus());
  }, [pathname, primeiraImagem]);

  useEffect(() => {
    if (!open) return;
    // Aberto, a intenção é clara, e as outras janelas descem quando o browser
    // estiver parado. Antes disso não: aquecer tudo ao passar o rato gastava
    // dados a quem só ia a caminho da barra do browser.
    const pedir = () => tiles.filter((tile) => !tile.hidden).forEach((tile) => aquecer(tile.image));
    const ocioso = "requestIdleCallback" in window;
    const id = ocioso ? window.requestIdleCallback(pedir, { timeout: 1500 }) : window.setTimeout(pedir, 300);
    return () => (ocioso ? window.cancelIdleCallback(id) : window.clearTimeout(id));
  }, [open, tiles, aquecer]);

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

  /*
   * Um clique em qualquer sítio da folha que não seja uma coisa em que se
   * carrega fecha-a: o fundo, os títulos das bandas, o espaço à volta da lista,
   * a janela quando não tem nada. É o gesto de quem quer sair — e a cruz no
   * canto fica, para quem a procura.
   *
   * O que conta como «coisa em que se carrega» é o que o browser já trata como
   * tal (ligações, botões, o campo), mais a faixa da procura inteira: tocar ao
   * lado do texto do campo é querer escrever, não fechar. Aí o clique vai para
   * o campo.
   *
   * E o clique tem de começar e acabar fora delas. Quem selecciona o que
   * escreveu e larga o rato no fundo não pediu para fechar — o browser entrega
   * esse clique ao antepassado comum, que é a folha, e sem esta guarda ela
   * fechava-se com a procura a meio.
   */
  const comecouNoVazio = useRef(false);
  const eVazio = (alvo: EventTarget | null) =>
    alvo instanceof Element && !alvo.closest("a, button, input, [data-procura]");

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

  /*
   * O que está debaixo da pílula, medido onde ela está.
   *
   * `elementsFromPoint` devolve a pilha toda naquele ponto, de cima para baixo.
   * Salta-se a própria pílula e desce-se até encontrar alguém com fundo opaco:
   * os véus e gradientes por cima de um vídeo são transparentes e não contam,
   * e quem manda é a secção por baixo deles. Sem ninguém opaco, o fundo é o
   * papel do documento.
   */
  useEffect(() => {
    const botao = trigger.current;
    if (!botao) return;

    const mede = () => {
      const caixa = botao.getBoundingClientRect();
      const pilha = document.elementsFromPoint(caixa.left + caixa.width / 2, caixa.top + caixa.height / 2);
      for (const no of pilha) {
        if (botao.contains(no)) continue;
        const partes = getComputedStyle(no).backgroundColor.match(/[\d.]+/g);
        if (!partes) continue;
        const [r, g, b, alfa = 1] = partes.map(Number);
        if (alfa < 0.5) continue;
        // Luminância relativa, a mesma conta do contraste.
        const canal = (v: number) => (v / 255 <= 0.03928 ? v / 255 / 12.92 : ((v / 255 + 0.055) / 1.055) ** 2.4);
        aplica(0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b) > 0.4);
        return;
      }
      aplica(true);
    };

    // Só a passagem de escuro para claro sorteia; o resto é manter o que está.
    const aplica = (claro: boolean) => {
      if (claro && !estavaClaro.current) setCorEmClaro((anterior) => outraCor(anterior));
      estavaClaro.current = claro;
      setFundoClaro(claro);
    };

    mede();
    // A janela recortada à faixa onde a pílula está: o observador só acorda
    // quando uma secção lhe entra ou sai de baixo.
    const faixa = () => {
      const caixa = botao.getBoundingClientRect();
      return `${-caixa.top}px 0px ${-(window.innerHeight - caixa.bottom)}px 0px`;
    };
    let observador: IntersectionObserver | undefined;
    const arma = () => {
      observador?.disconnect();
      observador = new IntersectionObserver(mede, { rootMargin: faixa(), threshold: 0 });
      for (const secao of document.querySelectorAll("header, section, footer, main > div")) observador.observe(secao);
    };
    arma();
    window.addEventListener("resize", arma);
    return () => {
      observador?.disconnect();
      window.removeEventListener("resize", arma);
    };
  }, [pathname]);

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
        onPointerEnter={prepararAbertura}
        onFocus={prepararAbertura}
        aria-label={copy.index}
        /* Sobre tinta fica como sempre esteve: papel translúcido com desfoque.
           Sobre claro veste a cor sorteada à entrada, que traz consigo a cor do
           texto.

           A cor do texto não pode estar na base: `text-paper` e `text-ink` têm a
           mesma especificidade, e quem decide é a ordem na folha de estilos e
           não a ordem na string — com um `text-paper` aqui, a tinta do coral
           nunca chegava a pintar. Cada estado traz a sua. O hover é que ganha a
           ambas, porque o Tailwind escreve as variantes no fim. */
        className={`group fixed right-5 top-5 z-40 flex items-center gap-3 rounded-full px-4 py-2.5 backdrop-blur-md transition-colors duration-200 hover:bg-paper hover:text-ink sm:right-8 sm:top-8 ${
          fundoClaro ? (corEmClaro ?? CORES_EM_CLARO[0]) : "bg-paper/10 text-paper"
        }`}
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
          onPointerDown={(event) => (comecouNoVazio.current = eVazio(event.target))}
          onClick={(event) => {
            if (comecouNoVazio.current && eVazio(event.target)) close();
          }}
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
            <span
              data-procura
              onClick={() => input.current?.focus()}
              className="relative min-w-0 flex-1"
            >
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
                  sizes={TAMANHOS_DA_JANELA}
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
                {/* Duas linhas no máximo: um título de artigo pode ter doze
                    palavras, e a janela tem 26svh no telemóvel. */}
                {destaque.ultimo ? (
                  <span className="mt-1 flex flex-col gap-1 border-l-2 border-red pl-3 lg:mt-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-red">
                      {destaque.ultimo.rotulo}
                    </span>
                    <span className="line-clamp-2 text-[13px] font-light leading-[1.35] text-paper/75 lg:text-[15px]">
                      {destaque.ultimo.titulo}
                    </span>
                  </span>
                ) : null}
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
