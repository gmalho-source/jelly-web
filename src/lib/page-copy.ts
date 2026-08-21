import { cache } from "react";
import { getPages } from "@/lib/cms";

import type { Locale } from "@/i18n/routing";

/**
 * Só estas páginas são editáveis no painel: a navegação, o footer e a área de
 * faturação ficam em código, porque são interface e não conteúdo.
 */
export const EDITABLE_PAGES = ["home", "about", "services", "work", "clients", "blog", "newsroom", "contact"] as const;
const editable = new Set<string>(EDITABLE_PAGES);

type Messages = Record<string, unknown>;

function get(target: Messages, path: string[]): unknown {
  return path.reduce<unknown>((node, key) => (node && typeof node === "object" ? (node as Messages)[key] : undefined), target);
}

function set(target: Messages, path: string[], value: string) {
  let node = target;
  for (const key of path.slice(0, -1)) {
    const next = node[key];
    if (!next || typeof next !== "object") return;
    node = next as Messages;
  }
  node[path[path.length - 1]] = value;
}

/**
 * Sobrepõe a copy do CMS às mensagens do repositório, para as páginas
 * continuarem a chamar `t("...")` sem saberem de onde veio o texto.
 *
 * Duas regras que mantêm isto seguro: só substitui chaves que já existem no
 * ficheiro de mensagens (uma chave inventada no Studio não passa a texto no
 * site, e o código continua a ser quem define o que existe), e ignora valores
 * vazios (um campo em branco cai no texto do repositório em vez de apagar a
 * secção).
 */
export const withPageCopy = cache(async (locale: Locale, messages: Messages): Promise<Messages> => {
  const pages = await getPages();
  if (!pages.length) return messages;

  const merged = structuredClone(messages);
  for (const page of pages) {
    if (!editable.has(page.slug)) continue;
    for (const entry of page.entries) {
      const value = entry[locale]?.trim();
      if (!value) continue;
      const path = [page.slug, ...entry.key.split(".")];
      if (typeof get(merged, path) !== "string") continue;
      set(merged, path, value);
    }
  }
  return merged;
});
