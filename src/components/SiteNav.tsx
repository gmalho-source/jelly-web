"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JellyWordmark } from "./JellyLogo";

export type NavEntry = {
  label: string;
  href: string;
  /** Linha de contexto que aparece no painel ao passar o rato. */
  context: string;
  /** Atalhos que entram no painel (pilares, casos, artigos). */
  children?: { label: string; href: string }[];
  tone: "red" | "lavender" | "chartreuse" | "coral" | "slate";
};

export type PaletteItem = { label: string; hint: string; href: string; group: string };

type Copy = {
  index: string;
  close: string;
  contact: string;
  searchHint: string;
  searchLabel: string;
  searchPlaceholder: string;
  empty: string;
  language: string;
};

const tones: Record<NavEntry["tone"], string> = {
  red: "bg-red text-white",
  lavender: "bg-lavender text-ink",
  chartreuse: "bg-chartreuse text-ink",
  coral: "bg-coral text-ink",
  slate: "bg-slate text-paper",
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function SiteNav({
  entries,
  palette,
  copy,
  languageHref,
  contactHref,
}: {
  entries: NavEntry[];
  palette: PaletteItem[];
  copy: Copy;
  languageHref: string;
  contactHref: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState(0);
  const opener = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const results = query.trim()
    ? palette.filter((item) => normalize(`${item.label} ${item.hint} ${item.group}`).includes(normalize(query.trim()))).slice(0, 8)
    : [];

  // Atalho global: ⌘K / Ctrl+K abre a procura; Esc fecha tudo.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        setSearch(true);
      }
      if (event.key === "Escape") {
        setSearch(false);
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (search) input.current?.focus();
    if (!open) opener.current?.focus({ preventScroll: true });
  }, [search, open]);

  const active = entries[Math.min(hovered, entries.length - 1)];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-paper-3 bg-paper/85 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex min-h-[60px] max-w-[1200px] items-center justify-between gap-4 px-5 py-3 sm:min-h-[72px] sm:px-8">
          <Link href={entries[0]?.href ?? "/"} aria-label="Jelly">
            <JellyWordmark className="w-[72px] text-red sm:w-[84px]" />
          </Link>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setSearch(true);
                setOpen(true);
              }}
              className="hidden items-center gap-2 rounded-[8px] px-3 py-2 text-sm text-slate transition-colors duration-200 hover:text-red sm:flex"
            >
              {copy.searchHint}
              <kbd className="rounded-[4px] border border-paper-3 px-1.5 py-0.5 font-sans text-xs text-mute">⌘K</kbd>
            </button>

            <Link href={contactHref} className="btn hidden sm:inline-flex">
              {copy.contact} <span aria-hidden="true">→</span>
            </Link>

            <button
              ref={opener}
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpen((value) => !value);
                setSearch(false);
              }}
              className="flex items-center gap-3 rounded-[8px] bg-ink px-4 py-2.5 text-sm font-semibold text-paper transition-colors duration-200 hover:bg-red"
            >
              {open ? copy.close : copy.index}
              <span aria-hidden="true" className="relative block h-3 w-4">
                <span
                  className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-200 ease-out ${open ? "top-1.5 rotate-45" : "top-0.5"}`}
                />
                <span
                  className={`absolute left-0 block h-px w-4 bg-current transition-transform duration-200 ease-out ${open ? "top-1.5 -rotate-45" : "top-2.5"}`}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {open ? (
        <div role="dialog" aria-modal="true" aria-label={copy.index} className="fixed inset-0 z-50 bg-ink text-paper">
          <div className="mx-auto flex h-full max-w-[1200px] flex-col px-5 pb-8 pt-4 sm:px-8">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-4">
              <JellyWordmark className="w-[72px] text-red" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  setSearch(false);
                }}
                className="flex items-center gap-3 rounded-[8px] bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-red hover:text-white"
              >
                {copy.close}
                <span aria-hidden="true">×</span>
              </button>
            </div>

            {search ? (
              <div className="flex min-h-0 flex-1 flex-col pt-8">
                <label htmlFor="nav-search" className="eyebrow text-chartreuse">
                  {copy.searchLabel}
                </label>
                <input
                  ref={input}
                  id="nav-search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCursor(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowDown") {
                      event.preventDefault();
                      setCursor((value) => Math.min(value + 1, Math.max(results.length - 1, 0)));
                    }
                    if (event.key === "ArrowUp") {
                      event.preventDefault();
                      setCursor((value) => Math.max(value - 1, 0));
                    }
                    if (event.key === "Enter" && results[cursor]) {
                      window.location.assign(results[cursor].href);
                    }
                  }}
                  placeholder={copy.searchPlaceholder}
                  className="mt-3 w-full border-b border-white/20 bg-transparent pb-4 font-display text-3xl font-semibold tracking-[-0.03em] text-paper outline-none placeholder:text-white/30 lg:text-5xl"
                  autoComplete="off"
                />
                <ul className="mt-6 min-h-0 flex-1 overflow-y-auto">
                  {results.map((item, index) => (
                    <li key={item.href + item.label}>
                      <Link
                        href={item.href}
                        onMouseEnter={() => setCursor(index)}
                        className={`flex items-baseline justify-between gap-6 border-b border-white/10 px-2 py-4 transition-colors duration-200 ${index === cursor ? "bg-white/5 text-paper" : "text-paper/70"}`}
                      >
                        <span className="text-lg font-medium">{item.label}</span>
                        <span className="text-sm text-mute">
                          {item.group} · {item.hint}
                        </span>
                      </Link>
                    </li>
                  ))}
                  {query.trim() && !results.length ? <li className="px-2 py-4 text-paper/60">{copy.empty}</li> : null}
                </ul>
              </div>
            ) : (
              <div className="grid min-h-0 flex-1 gap-8 pt-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between">
                {/* Índice em escala grande: o resto esmorece para o item ativo respirar. */}
                <nav className="flex min-h-0 flex-col justify-center gap-1 overflow-y-auto">
                  {entries.map((entry, index) => (
                    <Link
                      key={entry.href}
                      href={entry.href}
                      onMouseEnter={() => setHovered(index)}
                      onFocus={() => setHovered(index)}
                      onClick={() => setOpen(false)}
                      className={`group flex items-baseline gap-4 font-display text-4xl font-semibold leading-[0.95] tracking-[-0.045em] transition-[opacity,transform] duration-200 ease-out sm:text-5xl lg:text-[72px] ${
                        hovered === index ? "text-paper" : "text-paper/35"
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`text-red transition-opacity duration-200 ${hovered === index ? "opacity-100" : "opacity-0"}`}
                      >
                        →
                      </span>
                      {entry.label}
                    </Link>
                  ))}
                </nav>

                {/* Painel de contexto: cor plana, uma linha de verdade, atalhos reais. */}
                <aside className="flex flex-col justify-end gap-4 pb-2">
                  <div className={`flex min-h-[180px] flex-col justify-between rounded-[20px] p-6 ${tones[active.tone]}`}>
                    <p className="editorial max-w-[28ch] text-lg leading-snug">{active.context}</p>
                    {active.children?.length ? (
                      <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold">
                        {active.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} onClick={() => setOpen(false)} className="hover:underline">
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper/70">
                    <Link href={languageHref} className="hover:text-red">
                      {copy.language}
                    </Link>
                    <a href="mailto:geral@jelly.pt" className="hover:text-red">
                      geral@jelly.pt
                    </a>
                    <button type="button" onClick={() => setSearch(true)} className="hover:text-red">
                      {copy.searchHint} ⌘K
                    </button>
                  </div>
                </aside>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
