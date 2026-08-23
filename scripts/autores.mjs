/**
 * Cria as fichas de autor e liga os artigos importados a elas.
 *
 * O site antigo guardava o autor num campo de texto, e o que lá está são três
 * valores: «Jelly» (162 artigos), «Gonçalo Malho Rodrigues» (9) e «marketing»
 * (8). O terceiro é o nome de um utilizador do WordPress, não de uma pessoa que
 * assine textos — vai para a casa, que é quem de facto os assinava.
 *
 *   npm run autores            (escreve)
 *   npm run autores -- --seco  (só diz o que faria)
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";

const seco = process.argv.includes("--seco");

/** O texto antigo → a ficha que passa a assinar. */
const FICHAS = {
  Jelly: { name: "Jelly", role: "Equipa Jelly" },
  marketing: { name: "Jelly", role: "Equipa Jelly" },
  "Equipa Jelly": { name: "Jelly", role: "Equipa Jelly" },
  "Gonçalo Malho Rodrigues": { name: "Gonçalo Malho Rodrigues", role: "CEO" },
};

const payload = await getPayload({ config });

// Uma ficha por nome, e reaproveitada se já existir: correr isto duas vezes não
// pode duplicar autores.
const porNome = new Map();
for (const ficha of Object.values(FICHAS)) {
  if (porNome.has(ficha.name)) continue;
  const { docs } = await payload.find({ collection: "authors", where: { name: { equals: ficha.name } }, limit: 1 });
  if (docs[0]) {
    porNome.set(ficha.name, docs[0].id);
    console.log(`= ${ficha.name} já existia (#${docs[0].id})`);
    continue;
  }
  if (seco) {
    porNome.set(ficha.name, `(nova) ${ficha.name}`);
    console.log(`+ criaria ${ficha.name} — ${ficha.role}`);
    continue;
  }
  const criada = await payload.create({ collection: "authors", data: ficha });
  porNome.set(ficha.name, criada.id);
  console.log(`+ ${ficha.name} — ${ficha.role} (#${criada.id})`);
}

// E agora os artigos. Só os que ainda não têm ficha: quem já foi tratado à mão
// no painel não se mexe.
const { docs } = await payload.find({ collection: "posts", limit: 0, depth: 0 });
let ligados = 0;
let semRegra = 0;

for (const post of docs) {
  if (post.authorRef) continue;
  const ficha = FICHAS[(post.author ?? "").trim()];
  if (!ficha) {
    semRegra += 1;
    console.log(`? ${post.slug}: autor «${post.author}» sem regra — fica por ligar`);
    continue;
  }
  const id = porNome.get(ficha.name);
  if (!seco) {
    await payload.update({ collection: "posts", id: post.id, data: { authorRef: id }, overrideAccess: true });
  }
  ligados += 1;
}

console.log(`\n${seco ? "(seco) " : ""}${ligados} artigos ligados, ${semRegra} sem regra, de ${docs.length}.`);
process.exit(0);
