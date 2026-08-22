#!/usr/bin/env node
/**
 * Acerta os corpos dos artigos já gravados.
 *
 * Os guiões de importação escreviam nós de elemento sem `indent`, e o editor
 * recusa-os (`Invalid indent value`, «erro #117» na versão minificada): mostrava
 * o artigo e logo a seguir deixava-o em branco. Isto passa por todos os artigos
 * e acrescenta o que falta, sem tocar no texto.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/fix-lexical.mjs --dry
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/fix-lexical.mjs
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { normalizeTree } from "./lexical-nodes.mjs";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry");
const payload = await getPayload({ config });
const { docs } = await payload.find({ collection: "posts", limit: 0, depth: 0 });

let tocados = 0;
let nos = 0;

for (const doc of docs) {
  const dados = {};
  let mexidos = 0;

  for (const campo of ["body", "bodyEn"]) {
    if (!doc[campo]?.root) continue;
    const arvore = structuredClone(doc[campo]);
    const conta = normalizeTree(arvore);
    if (!conta) continue;
    dados[campo] = arvore;
    mexidos += conta;
  }

  if (!mexidos) continue;
  nos += mexidos;
  tocados += 1;
  if (seco) {
    console.log(`  ${doc.slug}: ${mexidos} nós`);
    continue;
  }
  await payload.update({ collection: "posts", id: doc.id, data: dados });
  console.log(`✓ ${doc.slug}: ${mexidos} nós`);
}

console.log(`\n${nos} nós acertados em ${tocados} de ${docs.length} artigos${seco ? " (ensaio, nada gravado)" : ""}`);
if (!seco && tocados) await purgeSite();
process.exit(0);
