#!/usr/bin/env node
/**
 * Acerta a cópia das páginas no CMS: o endereço de email da casa passa a
 * hello@jelly.pt, e sai a referência à agenda do CEO — o link dela é partilhado
 * por ele com quem escolhe, e não é para estar no site.
 *
 * Os textos das páginas estão em dois sítios: os ficheiros de mensagens (que
 * são o que o site mostra quando não há nada no painel) e as entradas de cópia
 * no painel, que ganham. Mudar só um lado não muda nada ao visitante.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/copy-fix-contacts.mjs --dry-run
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry-run");
const payload = await getPayload({ config });

/** Entradas que saem por inteiro, por página. */
const FORA = { contact: ["book", "bookBody"] };

/** Texto novo para as entradas que ficam mas mudam. */
const TROCA = {
  contact: {
    lead: {
      pt: "Quatro campos: onde está o problema e o que já tentaste.",
      en: "Four fields: where the problem is and what you have already tried.",
    },
  },
};

const { docs } = await payload.find({ collection: "pages", limit: 0, depth: 0 });
let tocadas = 0;

for (const doc of docs) {
  const antes = JSON.stringify(doc.entries ?? []);
  const fora = FORA[doc.key] ?? [];

  const entries = (doc.entries ?? [])
    .filter((entrada) => !fora.includes(entrada.key))
    .map((entrada) => {
      const troca = TROCA[doc.key]?.[entrada.key];
      const base = troca ? { ...entrada, ...troca } : entrada;
      return {
        ...base,
        pt: (base.pt ?? "").replace(/geral@jelly\.pt/g, "hello@jelly.pt"),
        en: (base.en ?? "").replace(/geral@jelly\.pt/g, "hello@jelly.pt"),
      };
    });

  if (JSON.stringify(entries) === antes) continue;
  tocadas += 1;
  console.log(`${seco ? "·" : "✓"} ${doc.key}: ${(doc.entries ?? []).length} → ${entries.length} entradas`);
  if (!seco) await payload.update({ collection: "pages", id: doc.id, data: { entries } });
}

console.log(`${tocadas} páginas${seco ? " (ensaio, nada gravado)" : " acertadas"}`);
if (!seco && tocadas) await purgeSite();
process.exit(0);
