#!/usr/bin/env node
/**
 * O mapa do site está completo?
 *
 * O mapa é uma lista escrita à mão em `src/app/sitemap.ts`, e a verdade sobre
 * o que o site serve está noutro sítio — em `routing.pathnames`. Nada ligava
 * os dois. Foi assim que o arquivo de casos, a página-mãe dos serviços, a
 * equipa inteira, o recrutamento e as páginas legais ficaram de fora sem que
 * nada falhasse: a página existia, era indexável, estava ligada, e
 * simplesmente nunca entrava no mapa.
 *
 * Isto não valida o conteúdo do mapa — valida que nenhuma forma de rota foi
 * esquecida. Uma rota nova obriga a uma de duas coisas: entrar no mapa, ou
 * entrar aqui em baixo com a razão à vista.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const ler = (p) => readFileSync(path.join(aqui, "..", p), "utf8");

/** Fora do mapa de propósito, e porquê. */
const FORA = new Map([
  ["/confirmar-candidatura/[token]", "endereço de uso único, que vai por email"],
  ["/subscrever/[token]", "endereço de uso único, que vai por email"],
  ["/calendar-gmalho", "página de marcação, `noindex` por decisão"],
]);

const rotas = [...ler("src/i18n/routing.ts").matchAll(/^\s{4}"(\/[^"]*)":/gm)].map((m) => m[1]);
if (rotas.length < 10) {
  console.error("não consegui ler as rotas de routing.ts — a verificação não vale nada assim");
  process.exit(2);
}

/*
 * O mapa não escreve todas as rotas com a mão: as páginas pilar, por exemplo,
 * entram por uma lista em `content/pilares.ts`, e a rota está escrita lá. Por
 * isso procura-se no mapa e em tudo o que ele importa de `content`.
 */
const mapa = ler("src/app/sitemap.ts");
const importados = [...mapa.matchAll(/from "@\/(content\/[\w-]+)"/g)].map((m) => ler(`src/${m[1]}.ts`));
const onde = [mapa, ...importados].join("\n");

const esquecidas = rotas.filter((rota) => !FORA.has(rota) && !onde.includes(`"${rota}"`));

if (esquecidas.length) {
  console.error(`O mapa do site esqueceu ${esquecidas.length} forma(s) de rota:\n`);
  for (const rota of esquecidas) console.error(`  ${rota}`);
  console.error(`\nOu entram em src/app/sitemap.ts, ou entram na lista FORA deste guião,`);
  console.error(`com a razão escrita. Uma página que existe e não está no mapa é uma`);
  console.error(`página que o Google encontra por acaso.`);
  process.exit(1);
}

console.log(`mapa do site: ${rotas.length - FORA.size} formas de rota cobertas, ${FORA.size} fora por decisão.`);
for (const [rota, razao] of FORA) console.log(`  fora: ${rota} — ${razao}`);
