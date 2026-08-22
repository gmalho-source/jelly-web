#!/usr/bin/env node
/**
 * Passa a comunicação do site de «tu» para «você».
 *
 * A casa trata o cliente por «você»; o «tu» fica para quem se candidata a
 * trabalhar aqui. Isto acerta o que está gravado no CMS — os ficheiros de
 * texto do site foram acertados no código, mas as entradas do painel ganham a
 * esses, e por isso têm de mudar as duas.
 *
 * As trocas são pares escritos à mão e revistos um a um. Não é uma expressão
 * regular sobre pronomes: «tua» dentro de uma narrativa de projeto e «tua» numa
 * frase dirigida ao cliente não se corrigem da mesma maneira, e uma troca
 * automática estragava texto que está bem.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/copy-voce.mjs --dry-run
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry-run");

const TROCAS = [
  ["na tua operação", "na sua operação"],
  ["Formação da tua equipa.", "Formação da sua equipa."],
  ["A IA vai encontrar o teu negócio.", "A IA vai encontrar o seu negócio."],
  [
    "Queres perceber onde a IA pode gerar impacto real no teu negócio?",
    "Quer perceber onde a IA pode gerar impacto real no seu negócio?",
  ],
  ["Diz-nos o que precisa de mudar.", "Diga-nos o que precisa de mudar."],
  ["o que já tentaste.", "o que já tentou."],
  ["O que precisas", "O que precisa"],
  ["Tenta outra vez ou escreve para", "Tente outra vez ou escreva para"],
  ["Preenche o nome, um email válido e o que precisas.", "Preencha o nome, um email válido e o que precisa."],
  ["que irás provar em toda a tua vida", "que irá provar em toda a sua vida"],
  ["Escreve o email com que estás registado", "Escreva o email com que está registado"],
  ["Apaga uma letra.", "Apague uma letra."],
  ["escreve para encontrar", "escreva para encontrar"],
];

const trocar = (valor) => TROCAS.reduce((texto, [de, para]) => texto.split(de).join(para), valor);

/** Percorre a árvore do documento e troca só onde há o que trocar. */
function anda(valor) {
  if (typeof valor === "string") return trocar(valor);
  if (Array.isArray(valor)) return valor.map(anda);
  if (valor && typeof valor === "object" && !(valor instanceof Date)) {
    return Object.fromEntries(Object.entries(valor).map(([chave, dentro]) => [chave, anda(dentro)]));
  }
  return valor;
}

const payload = await getPayload({ config });
let tocados = 0;

for (const colecao of ["services", "pages", "projects", "news", "posts"]) {
  const { docs } = await payload.find({ collection: colecao, limit: 0, depth: 0 });
  for (const doc of docs) {
    const { id, createdAt, updatedAt, ...resto } = doc;
    const antes = JSON.stringify(resto);
    const depois = anda(resto);
    if (JSON.stringify(depois) === antes) continue;

    tocados += 1;
    console.log(`${seco ? "·" : "✓"} ${colecao}/${doc.slug ?? doc.key ?? id}`);
    if (!seco) await payload.update({ collection: colecao, id, data: depois });
  }
}

console.log(`${tocados} documentos${seco ? " por acertar (ensaio)" : " acertados"}`);
if (!seco && tocados) await purgeSite();
process.exit(0);
