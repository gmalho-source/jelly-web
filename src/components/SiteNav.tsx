"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { JellyWordmark } from "./JellyLogo";

export type NavChild = { label: string; href: string };

export type NavEntry = {
  key: string;
  label: string;
  href: string;
  /** Miniatura real quando o conteúdo tem imagem; cor plana quando não tem. */
  thumb?: { src: string; alt?: string };
  tone?: "red" | "lavender" | "chartreuse" | "coral" | "slate";
  /** Segundo nível, dentro da linha do pai. Não abre nada. */
  children?: NavChild[];
};

export type PaletteItem = { label: string; hint: string; href: string; group: string };

type Copy = {
  menu: string;
  open: string;
  close: string;
  contact: string;
  signature: string;
  searchLabel: string;
  searchPlaceholder: string;
  empty: string;
  language: string;
  here: string;
};

const tones: Record<NonNullable<NavEntry["tone"]>, string> = {
  red: "bg-red",
  lavender: "bg-lavender",
  chartreuse: "bg-chartreuse",
  coral: "bg-coral",
  slate: "bg-slate",
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Ilha-índice: a barra no fundo diz onde estás e, ao abrir, cresce no mesmo
 * lugar até um cartão com o site todo — linha a linha, com miniatura. Não tapa
 * a página: o conteúdo continua visível em volta, que é o que separa isto de um
 * menu em ecrã inteiro.
 */
export function SiteNav({
  entries,
  palette,
  copy,
  languageHref,
  contactHref,
  homeHref,
  social,
}: {
  entries: NavEntry[];
  palette: PaletteItem[];
  copy: Copy;
  languageHref: string;
  contactHref: string;
  homeHref: string;
  social: { label: string; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const pathname = usePathname();

  /** A entrada onde estamos: a mais específica que casa com o caminho. */
  const current = useMemo(() => {
    const matches = entries.filter((entry) => pathname === entry.href || pathname.startsWith(`${entry.href}/`));
    return matches.sort((a, b) => b.href.length - a.href.length)[0];
  }, [entries, pathname]);

  const results = query.trim()
    ? palette.filter((item) => normalize(`${item.label} ${item.hint} ${item.group}`).includes(normalize(query.trim()))).slice(0, 7)
    : [];
  // O cursor é derivado: muda a procura, muda o número de resultados, e o
  // índice acompanha sem precisar de ser reposto por um efeito.
  const active = results.length ? ((cursor % results.length) + results.length) % results.length : 0;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        // O cartão abre com a procura pronta a escrever.
        requestAnimationFrame(() => input.current?.focus());
      }
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Fechar é sempre um gesto: clique no +, Esc, ou seguir um link. */
  function close(returnFocus = true) {
    setOpen(false);
    setQuery("");
    setCursor(0);
    if (returnFocus) trigger.current?.focus({ preventScroll: true });
  }

  function onSearchKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!results.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setCursor((value) => (value + 1) % results.length);
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setCursor((value) => (value - 1 + results.length) % results.length);
    }
    if (event.key === "Enter") {
      event.preventDefault();
      window.location.assign(results[active].href);
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 print:hidden">
      <div className="pointer-events-auto w-full max-w-[620px]">
        {/* ── Cartão: cresce a partir da barra, ancorado no mesmo sítio ── */}
        <div
          id="nav-card"
          role="dialog"
          aria-modal="false"
          aria-label={copy.menu}
          hidden={!open}
          className="mb-2 max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-[20px] bg-ink text-paper shadow-lg [scrollbar-width:thin]"
        >
          <div className="flex items-start justify-between gap-4 p-5">
            <Link href={homeHref} aria-label="Jelly" onClick={() => close(false)} className="block">
              <JellyWordmark className="w-[64px] text-paper" />
              <span className="subtitle mt-3 block max-w-[18ch] text-[15px] text-paper/60">{copy.signature}</span>
            </Link>
            <Link
              href={contactHref}
              onClick={() => close(false)}
              className="shrink-0 rounded-full bg-red px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-deep"
            >
              {copy.contact}
            </Link>
          </div>

          <div className="border-t border-paper/10 px-5 py-3">
            <input
              ref={input}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onSearchKey}
              aria-label={copy.searchLabel}
              placeholder={copy.searchPlaceholder}
              className="w-full bg-transparent py-1 text-[15px] text-paper outline-none placeholder:text-paper/35"
            />
          </div>

          {query.trim() ? (
            <ul className="border-t border-paper/10">
              {results.length ? (
                results.map((item, index) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      onMouseEnter={() => setCursor(index)}
                      onClick={() => close(false)}
                      className={`flex items-baseline justify-between gap-4 px-5 py-3 transition-colors duration-120 ${
                        index === active ? "bg-white/10" : "hover:bg-white/5"
                      }`}
                    >
                      <span className="font-display text-lg">{item.label}</span>
                      <span className="text-xs text-paper/45">{item.hint}</span>
                    </Link>
                  </li>
                ))
              ) : (
                <li className="px-5 py-4 text-sm text-paper/50">{copy.empty}</li>
              )}
            </ul>
          ) : (
            <ul className="border-t border-paper/10">
              {entries.map((entry, index) => {
                const here = current?.key === entry.key;
                return (
                  <li
                    key={entry.key}
                    className="nav-rise border-b border-paper/10 last:border-b-0"
                    style={{ animationDelay: `${index * 34}ms` }}
                  >
                    <div className={`flex items-center gap-4 pr-4 ${here ? "" : "transition-colors duration-200 hover:bg-white/5"}`}>
                      {/* A linha onde já estamos não é um link: não se navega para onde se está. */}
                      {here ? (
                        <span aria-current="page" className="flex flex-1 items-center gap-4 py-3 pl-5 text-paper/40">
                          <Thumb entry={entry} dim />
                          <span className="font-display text-2xl">{entry.label}</span>
                          <span className="eyebrow ml-1 text-paper/30">{copy.here}</span>
                        </span>
                      ) : (
                        <Link href={entry.href} onClick={() => close(false)} className="flex flex-1 items-center gap-4 py-3 pl-5">
                          <Thumb entry={entry} />
                          <span className="font-display text-2xl">{entry.label}</span>
                        </Link>
                      )}

                      {entry.children?.length ? (
                        <span className="hidden shrink-0 items-center gap-1.5 sm:flex">
                          {entry.children.map((child) => (
                            <Link
                              key={child.href}
                              href={child.href}
                              onClick={() => close(false)}
                              className="rounded-full border border-paper/20 px-3 py-1 text-xs text-paper/70 transition-colors duration-200 hover:border-paper/50 hover:text-paper"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-paper/10 px-5 py-4 text-xs text-paper/50">
            <span className="flex gap-3">
              {social.map((item) => (
                <a key={item.href} href={item.href} target="_blank" rel="noreferrer noopener" className="hover:text-paper">
                  {item.label}
                </a>
              ))}
            </span>
            <span className="flex items-center gap-3">
              <Link href={languageHref} onClick={() => close(false)} className="hover:text-paper">
                {copy.language}
              </Link>
              <kbd className="rounded border border-paper/20 px-1.5 py-0.5 font-sans text-[11px]">⌘K</kbd>
            </span>
          </div>
        </div>

        {/* ── Barra: monograma, onde estás, e o botão que abre ── */}
        <nav
          aria-label={copy.menu}
          className="flex items-center gap-2 rounded-[20px] bg-ink px-3 py-2 text-paper shadow-md"
        >
          <Link href={homeHref} aria-label="Jelly" className="grid h-8 place-items-center pl-1 pr-2">
            <JellyWordmark className="w-[46px] text-paper" />
          </Link>
          <span className="min-w-0 flex-1">
            <span className="inline-block max-w-full truncate rounded-full bg-red px-3 py-1 text-sm font-semibold text-white">
              {current?.label ?? copy.menu}
            </span>
          </span>
          <button
            ref={trigger}
            type="button"
            aria-expanded={open}
            aria-controls="nav-card"
            aria-label={open ? copy.close : copy.open}
            onClick={() => (open ? close() : setOpen(true))}
            className="grid h-8 w-8 place-items-center rounded-full text-paper transition-colors duration-200 hover:bg-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="text-current">
              <path d="M2 8h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path
                d="M8 2v12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                className={`origin-center transition-transform duration-200 ease-out ${open ? "scale-y-0" : ""}`}
              />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  );
}

/** Miniatura da linha: imagem real quando existe, cor plana da marca quando não. */
function Thumb({ entry, dim }: { entry: NavEntry; dim?: boolean }) {
  const [broken, setBroken] = useState(false);

  if (entry.thumb?.src && !broken) {
    return (
      <Image
        src={entry.thumb.src}
        alt=""
        width={192}
        height={128}
        sizes="96px"
        // Uma imagem que não carrega deixa a linha com um buraco branco: cai
        // para a cor da secção, que é o que a linha teria sem imagem.
        onError={() => setBroken(true)}
        className={`h-[52px] w-[78px] shrink-0 rounded-[10px] object-cover ${dim ? "opacity-40" : ""}`}
      />
    );
  }
  // Sem imagem, a linha leva um retângulo de cor plana. Nada dentro: um
  // monograma a 11 px não se lê, e a cor já identifica a secção.
  return (
    <span
      aria-hidden="true"
      className={`h-[52px] w-[78px] shrink-0 rounded-[10px] ${tones[entry.tone ?? "slate"]} ${dim ? "opacity-40" : ""}`}
    />
  );
}
