#!/usr/bin/env node
/**
 * Põe nos artigos o resumo que o site já lhes mostra.
 *
 * Cento e vinte dos cento e oitenta e três artigos importados têm no campo do
 * resumo o código do construtor de páginas do WordPress em vez de texto:
 * `[vc_column column_padding=…]`. Já se sabia, e a leitura defende-se disso —
 * o `resumoPublicavel` deita o código fora e usa a primeira frase do artigo.
 * Só que essa defesa precisa do corpo, e há dois sítios que o não têm: o
 * cartão grande do índice do blog e o RSS. Neles o código saía à vista. O RSS
 * é o que alimenta a newsletter, o que torna isto pior do que feio.
 *
 * Isto não escreve resumos: grava os que já estão publicados. Para cada artigo
 * corre-se o mesmo `resumoPublicavel` que a página do artigo corre, sobre o
 * mesmo corpo, e guarda-se o resultado. O que aparece no site não muda em
 * nenhuma página — muda o que vai no RSS, no cartão do índice e na pesquisa,
 * que passam a ler a mesma coisa que as outras páginas já liam.
 *
 * Um resumo escrito à mão, ou escrito pelo botão do painel, fica como está:
 * só se mexe no que é código do construtor e mais nada.
 *
 * O inglês segue a mesma regra sobre o corpo inglês. Um artigo por traduzir
 * fica com o resumo inglês vazio — e vazio é o que a página já sabe tratar,
 * porque cai no corpo português, que é o que lá se lê.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:resumos -- --dry-run
 *
 * Idempotente: à segunda vez não há nada para mudar.
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { fromLexical } from "../src/lib/payload/content.ts";
import { resumoPublicavel, semShortcodes } from "../src/lib/resumo.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const ensaio = args.includes("--dry-run");
const apenas = args.find((a) => a.startsWith("--slug="))?.slice("--slug=".length);

const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "posts",
  limit: 0,
  depth: 0,
  sort: "-date",
  ...(apenas ? { where: { slug: { equals: apenas } } } : {}),
  select: { slug: true, titlePt: true, excerpt: true, body: true, bodyEn: true },
});

console.log(`${docs.length} artigos a ver${ensaio ? " (ensaio)" : ""}`);

let mexidos = 0;
let quietos = 0;

for (const doc of docs) {
  const excerpt = (doc.excerpt ?? {});
  /* Um resumo que sobrevive à limpeza é um resumo a sério — escrito por
     alguém, ou pelo botão do painel. Não se toca. */
  const ptLimpo = semShortcodes(excerpt.pt ?? "");
  const enLimpo = semShortcodes(excerpt.en ?? "");
  if (ptLimpo && enLimpo) {
    quietos += 1;
    continue;
  }

  const blocks = fromLexical(doc.body);
  const blocksEn = fromLexical(doc.bodyEn);

  const pt = ptLimpo || resumoPublicavel(excerpt.pt, blocks);
  /* O inglês só sai do corpo inglês: escrever o resumo inglês a partir do
     texto português seria publicar português num sítio que diz inglês. */
  const en = enLimpo || (blocksEn.length ? resumoPublicavel(excerpt.en, blocksEn) : "");

  if (pt === (excerpt.pt ?? "") && en === (excerpt.en ?? "")) {
    quietos += 1;
    continue;
  }

  console.log(`· ${doc.slug}`);
  console.log(`  pt: ${pt || "(vazio)"}`);
  if (en !== (excerpt.en ?? "")) console.log(`  en: ${en || "(vazio)"}`);

  if (!ensaio) {
    await payload.update({ collection: "posts", id: doc.id, data: { excerpt: { pt, en } } });
  }
  mexidos += 1;
}

console.log(`\n${mexidos} artigos com resumo novo, ${quietos} deixados como estavam.`);

if (!ensaio && mexidos) await purgeSite();

process.exit(0);
