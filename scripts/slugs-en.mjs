#!/usr/bin/env node
/**
 * Dá endereço inglês aos artigos e aos serviços.
 *
 * O título inglês já existe — foi traduzido — e é dele que sai o slug: quem
 * procura em inglês não escreve «trafego-pago». O slug português fica como
 * está: é a identidade da peça, está nos links de fora e nos redirecionamentos
 * do site antigo. O inglês é uma segunda porta, e a página serve as duas.
 *
 * Só escreve onde o campo está vazio: um slug que alguém corrigiu à mão fica.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run slugs:en -- --dry-run
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run slugs:en
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry-run");

/** Título → slug: sem acentos, sem pontuação, e sem palavras de ligação à cabeça. */
function slugify(titulo = "") {
  return titulo
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .split("-")
    .slice(0, 12)
    .join("-")
    // Cortar a doze palavras deixa às vezes uma preposição no fim; sai.
    .replace(/-(a|an|the|of|and|at|in|on|for|to|with|from|by|that|is|as|its|our|your)$/, "");
}

const payload = await getPayload({ config });

const tarefas = [
  { colecao: "posts", titulo: (doc) => doc.titleEn, nome: "artigos" },
  { colecao: "services", titulo: (doc) => doc.nameEn, nome: "serviços" },
];

for (const tarefa of tarefas) {
  const { docs } = await payload.find({ collection: tarefa.colecao, limit: 0, depth: 0 });
  const tomados = new Set(docs.map((doc) => doc.slugEn).filter(Boolean));
  let escritos = 0;
  let iguais = 0;
  let sem = 0;

  for (const doc of docs) {
    if (doc.slugEn?.trim()) continue;

    const base = slugify(tarefa.titulo(doc) ?? "");
    if (!base) {
      sem += 1;
      continue;
    }
    // O mesmo slug nas duas línguas não precisa de campo: sem ele, o inglês usa
    // o português, e fica um endereço só para o Google emparelhar.
    if (base === doc.slug) {
      iguais += 1;
      continue;
    }

    // Dois artigos podem traduzir para o mesmo título. O segundo leva sufixo.
    let slugEn = base;
    for (let n = 2; tomados.has(slugEn) || docs.some((outro) => outro.slug === slugEn); n += 1) {
      slugEn = `${base}-${n}`;
    }
    tomados.add(slugEn);

    console.log(`  ${doc.slug} → ${slugEn}`);
    if (!seco) await payload.update({ collection: tarefa.colecao, id: doc.id, data: { slugEn } });
    escritos += 1;
  }

  console.log(
    `${tarefa.nome}: ${escritos} endereços ingleses${iguais ? `, ${iguais} iguais ao português` : ""}` +
      `${sem ? `, ${sem} sem título inglês` : ""}${seco ? " (ensaio, nada gravado)" : ""}`,
  );
}

if (!seco) await purgeSite();
process.exit(0);
