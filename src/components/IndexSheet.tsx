"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JellyWordmark } from "./JellyLogo";

export type SheetTile = {
  label: string;
  kind: string;
  href: string;
  image?: string;
  tone?: string;
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
  /** Nome da outra língua. Ausente na proposta, presente no site. */
  language?: string;
};

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
    if (!term) return tiles;
    return tiles.filter((tile) =>
      normalize(`${tile.label} ${tile.kind}`).includes(term),
    );
  }, [query, tiles]);

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
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        <Link
          href={homeHref}
          aria-label="Jelly"
          className="pointer-events-auto grid h-10 place-items-center rounded-full bg-ink/80 px-4 backdrop-blur-md"
        >
          <JellyWordmark className="w-[68px] text-paper" />
        </Link>
        <Link
          href={contactHref}
          className="pointer-events-auto mr-[136px] hidden rounded-full bg-ink/80 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.08em] text-paper backdrop-blur-md transition-colors duration-200 hover:bg-red sm:block"
        >
          {copy.contact}
        </Link>
      </div>

      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="folha"
        onClick={openSheet}
        className="group fixed right-5 top-5 z-40 flex items-center gap-3 rounded-full bg-paper/10 px-4 py-2.5 text-paper backdrop-blur-md transition-colors duration-200 hover:bg-paper hover:text-ink sm:right-8 sm:top-8"
      >
        <span className="eyebrow text-current">{copy.index}</span>
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
            <button
              type="button"
              onClick={close}
              aria-label={copy.close}
              className="text-sm text-paper/60 hover:text-paper"
            >
              esc
            </button>
          </div>

          <div className="grid flex-1 grid-cols-2 content-start gap-px overflow-y-auto bg-paper/10 lg:grid-cols-4">
            {results.map((tile, index) => (
              <Link
                key={tile.href + tile.label}
                href={tile.href}
                onClick={() => setOpenedOn(null)}
                onMouseEnter={() => setCursor(index)}
                className="group relative block bg-ink"
              >
                <span className="block aspect-[4/3] overflow-hidden">
                  {tile.image ? (
                    <Image
                      src={tile.image}
                      alt=""
                      width={640}
                      height={480}
                      sizes="(max-width: 1024px) 50vw, 25vw"
                      className="h-full w-full object-cover opacity-75 transition-[opacity,transform] duration-360 ease-out group-hover:scale-[1.03] group-hover:opacity-100"
                    />
                  ) : (
                    <span
                      className={`block h-full w-full ${tile.tone ?? "bg-slate"}`}
                    />
                  )}
                </span>
                <span
                  className={`flex items-baseline justify-between gap-3 border-t-2 px-4 py-3 transition-colors duration-120 ${
                    index === active
                      ? "border-red bg-red/10"
                      : "border-transparent"
                  }`}
                >
                  <span className="font-display text-lg leading-tight">
                    {tile.label}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-[0.08em] text-paper/40">
                    {tile.kind}
                  </span>
                </span>
              </Link>
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
