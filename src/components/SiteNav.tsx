"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JellyMonogram, JellyWordmark } from "./JellyLogo";

export type NavChild = { label: string; href: string; hint?: string };

export type NavEntry = {
  key: string;
  label: string;
  href: string;
  /** Linha de contexto do painel em ecrã inteiro. */
  context?: string;
  children?: NavChild[];
  tone?: "red" | "lavender" | "chartreuse" | "coral" | "slate";
};

export type PaletteItem = { label: string; hint: string; href: string; group: string };

type Copy = {
  more: string;
  close: string;
  contact: string;
  menu: string;
  searchHint: string;
  searchLabel: string;
  searchPlaceholder: string;
  empty: string;
  language: string;
  everything: string;
};

const tones: Record<NonNullable<NavEntry["tone"]>, string> = {
  red: "bg-red text-white",
  lavender: "bg-lavender text-ink",
  chartreuse: "bg-chartreuse text-ink",
  coral: "bg-coral text-ink",
  slate: "bg-slate text-paper",
};

function normalize(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export function SiteNav({
  entries,
  palette,
  copy,
  languageHref,
  contactHref,
  homeHref,
}: {
  entries: NavEntry[];
  palette: PaletteItem[];
  copy: Copy;
  languageHref: string;
  contactHref: string;
  homeHref: string;
}) {
  /** Chave do painel aberto: uma entrada com filhos, "tudo" ou "procura". */
  const [panel, setPanel] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [compact, setCompact] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const quick = entries.filter((entry) => entry.children?.length);
  const rest = entries.filter((entry) => !entry.children?.length);
  const open = panel !== null;
  const searching = panel === "procura";
  const current = entries.find((entry) => entry.key === panel);
  const items: NavChild[] =
    panel === "tudo" ? entries.map((entry) => ({ label: entry.label, href: entry.href })) : (current?.children ?? []);

  const results = query.trim()
    ? palette.filter((item) => normalize(`${item.label} ${item.hint} ${item.group}`).includes(normalize(query.trim()))).slice(0, 8)
    : [];

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPanel("procura");
      }
      if (event.key === "Escape") setPanel(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A ilha encolhe depois do primeiro scroll: fica só o monograma.
  useEffect(() => {
    function onScroll() {
      setCompact(window.scrollY > 48);
    }
    // Diferido para o próximo frame: cobre quem chega a meio da página.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (searching) input.current?.focus();
    if (!open) trigger.current?.focus({ preventScroll: true });
  }, [panel, open, searching]);

  function toggle(key: string, event?: React.MouseEvent<HTMLButtonElement>) {
    if (event) trigger.current = event.currentTarget;
    setPanel((value) => (value === key ? null : key));
    setQuery("");
    setHovered(0);
  }

  const pill =
    "rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-200 ease-out hover:bg-ink/5";

  return (
    <>
      {/* ── Ilha: flutua no topo em desktop, ancora em baixo no mobile ── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 sm:bottom-auto sm:top-4">
        <nav
          aria-label={copy.menu}
          className={`pointer-events-auto flex max-w-full items-center gap-1 rounded-[20px] border border-paper-3/70 bg-paper/80 shadow-md backdrop-blur-xl backdrop-saturate-150 transition-[padding] duration-200 ease-out ${
            compact ? "p-1.5" : "p-2"
          }`}
        >
          <Link
            href={homeHref}
            aria-label="Jelly"
            className="grid h-9 place-items-center rounded-full px-3 transition-colors duration-200 hover:bg-ink/5"
          >
            {compact ? (
              <JellyMonogram className="w-[13px] text-red" />
            ) : (
              <JellyWordmark className="w-[58px] text-red" />
            )}
          </Link>

          <span aria-hidden="true" className="mx-1 hidden h-6 w-px bg-paper-3 sm:block" />

          {quick.map((entry) => (
            <button
              key={entry.key}
              type="button"
              aria-expanded={panel === entry.key}
              onClick={(event) => toggle(entry.key, event)}
              className={`${pill} hidden items-center gap-1.5 sm:flex ${panel === entry.key ? "bg-ink text-paper hover:bg-ink" : "text-ink"}`}
            >
              {entry.label}
              <span aria-hidden="true" className="text-[10px] text-red">
                ●
              </span>
            </button>
          ))}

          {rest.slice(0, 2).map((entry) => (
            <Link key={entry.key} href={entry.href} className={`${pill} hidden text-ink lg:block`}>
              {entry.label}
            </Link>
          ))}

          <button
            type="button"
            aria-expanded={panel === "tudo"}
            onClick={(event) => toggle("tudo", event)}
            className={`${pill} ${panel === "tudo" ? "bg-ink text-paper hover:bg-ink" : "text-ink"}`}
          >
            {copy.more}
          </button>

          <button
            type="button"
            aria-label={copy.searchLabel}
            aria-expanded={searching}
            onClick={(event) => toggle("procura", event)}
            className={`${pill} flex items-center gap-2 ${searching ? "bg-ink text-paper hover:bg-ink" : "text-slate"}`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <kbd className="hidden font-sans text-xs text-mute sm:inline">⌘K</kbd>
          </button>

          <Link href={contactHref} className="ml-1 hidden rounded-full bg-red px-4 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-deep sm:block">
            {copy.contact}
          </Link>
        </nav>
      </div>

      {/* ── Painel em ecrã inteiro: impacto no tipo, calma no resto ── */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current?.label ?? copy.everything}
          className="fixed inset-0 z-40 bg-ink text-paper"
        >
          <div className="mx-auto flex h-full max-w-[1200px] flex-col px-5 pb-8 pt-24 sm:px-8 sm:pt-28">
            {searching ? (
              <div className="flex min-h-0 flex-1 flex-col">
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
                    if (event.key === "Enter" && results[cursor]) window.location.assign(results[cursor].href);
                  }}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                  className="mt-3 w-full border-b border-white/20 bg-transparent pb-4 text-3xl font-semibold tracking-[-0.035em] text-paper outline-none placeholder:text-white/25 lg:text-5xl"
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
              <div className="grid min-h-0 flex-1 gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,34%)] lg:justify-between">
                <div className="flex min-h-0 flex-col justify-center gap-1 overflow-y-auto">
                  {current?.context ? <p className="eyebrow mb-6 text-chartreuse">{current.label}</p> : null}
                  {items.map((item, index) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onMouseEnter={() => setHovered(index)}
                      onFocus={() => setHovered(index)}
                      onClick={() => setPanel(null)}
                      style={{ animationDelay: `${index * 34}ms` }}
                      className={`nav-rise group flex items-baseline gap-4 text-4xl font-semibold leading-[0.95] tracking-[-0.045em] transition-opacity duration-200 ease-out sm:text-5xl lg:text-[68px] ${
                        hovered === index ? "text-paper" : "text-paper/35"
                      }`}
                    >
                      <span aria-hidden="true" className={`text-red transition-opacity duration-200 ${hovered === index ? "opacity-100" : "opacity-0"}`}>
                        →
                      </span>
                      {item.label}
                    </Link>
                  ))}
                  {current ? (
                    <Link href={current.href} onClick={() => setPanel(null)} className="mt-8 w-fit text-sm font-semibold text-chartreuse hover:underline">
                      {current.label} →
                    </Link>
                  ) : null}
                </div>

                <aside className="flex flex-col justify-end gap-4 pb-2">
                  <div className={`flex min-h-[170px] flex-col justify-between rounded-[20px] p-6 ${tones[current?.tone ?? "slate"]}`}>
                    <p className="editorial max-w-[26ch] text-lg leading-snug">{current?.context ?? copy.everything}</p>
                    {items[hovered]?.hint ? <p className="mt-4 text-sm font-semibold">{items[hovered].hint}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-paper/70">
                    <Link href={languageHref} className="hover:text-red">
                      {copy.language}
                    </Link>
                    <a href="mailto:geral@jelly.pt" className="hover:text-red">
                      geral@jelly.pt
                    </a>
                    <button type="button" onClick={() => setPanel("procura")} className="hover:text-red">
                      {copy.searchHint} ⌘K
                    </button>
                  </div>
                </aside>
              </div>
            )}

            <button
              type="button"
              onClick={() => setPanel(null)}
              className="mt-6 w-fit rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-red hover:text-white"
            >
              {copy.close} ×
            </button>
          </div>

          <style>{`
            .nav-rise { animation: nav-rise 260ms cubic-bezier(.22,.61,.36,1) both; }
            @keyframes nav-rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
            @media (prefers-reduced-motion: reduce) { .nav-rise { animation: none; } }
          `}</style>
        </div>
      ) : null}
    </>
  );
}
