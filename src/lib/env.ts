/**
 * Uma variável de ambiente definida com valor vazio é o que mais se parece com
 * uma variável em falta — e foi o que partiu o primeiro build na Vercel, porque
 * `??` só apanha null e undefined, não a string vazia.
 *
 * Recebem o **valor** (`process.env.X`) e não o nome de propósito: o Next
 * substitui `process.env.NEXT_PUBLIC_*` no código durante o build e uma leitura
 * dinâmica (`process.env[name]`) escapava a essa substituição, deixando a
 * variável indefinida no browser.
 */
export function env(raw: string | undefined): string | undefined {
  const clean = raw?.trim();
  return clean ? clean : undefined;
}

export function envOr(raw: string | undefined, fallback: string): string {
  return env(raw) ?? fallback;
}
