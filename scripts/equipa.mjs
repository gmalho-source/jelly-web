/**
 * Enche as fichas da equipa no painel a partir do ficheiro do repositório.
 *
 * As vinte e uma pessoas entraram no CMS só com o nome, e o site ia buscar o
 * resto — função, apresentação, LinkedIn e os dois retratos — a
 * `src/content/team.ts`. Funciona para quem lê o site, mas quem abre a ficha no
 * painel encontra um formulário vazio e não tem por onde corrigir nada. Isto
 * passa o conteúdo para lá, que é onde ele deve poder ser editado.
 *
 * Não escreve por cima de nada: um campo que já tenha valor no painel fica como
 * está. Correr duas vezes não faz diferença — a segunda não tem trabalho.
 *
 * Os retratos vão para a coleção das imagens e ficam ligados à pessoa. Onde o
 * armazenamento é o Vercel Blob, é para lá que sobem; em desenvolvimento com
 * disco local, para `public/media`. As cópias em `public/media/equipa` ficam
 * onde estão: são o chão de que o site vive se o CMS estiver vazio.
 *
 *   npm run equipa                    (escreve tudo)
 *   npm run equipa -- --seco          (só diz o que faria)
 *   npm run equipa -- --sem-retratos  (só o texto: função, apresentação, LinkedIn)
 *
 * Precisa do ambiente de produção para mexer na produção — DATABASE_URL e, para
 * os retratos, BLOB_READ_WRITE_TOKEN.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { team } from "../src/content/team.ts";
import { camposEmFalta } from "../src/lib/equipa-fichas.ts";

const seco = process.argv.includes("--seco");
const semRetratos = process.argv.includes("--sem-retratos");

const RAIZ = path.resolve(import.meta.dirname, "..");

/*
 * Uma base de dados que não é a da máquina não leva alterações de esquema.
 *
 * O adaptador do Payload sincroniza o esquema por omissão fora de produção, e
 * este script corre na máquina de alguém com a `DATABASE_URL` da produção — ou
 * seja, exactamente na situação em que a sincronização apontaria à produção e
 * poderia largar uma coluna que já lá não está na configuração. Este sinal é o
 * mesmo que o Payload usa nas suas migrações, e diz só isso: liga-te, não mexas
 * no esquema.
 */
const local = /(^|@|\/\/)(localhost|127\.0\.0\.1)([:/]|$)/.test(process.env.DATABASE_URL ?? "");
if (!local) {
  process.env.PAYLOAD_MIGRATING = "true";
  console.log("· base de dados remota: liga-se sem tocar no esquema\n");
}

const payload = await getPayload({ config });

/** O que já está no painel, por nome em minúsculas. */
const { docs: existentes } = await payload.find({ collection: "team", limit: 0, depth: 0 });
const noPainel = new Map(existentes.map((doc) => [String(doc.name ?? "").trim().toLowerCase(), doc]));

/**
 * Sobe um retrato de `public/` para a coleção das imagens, e reaproveita o que
 * já lá esteja com o mesmo nome de ficheiro: correr isto duas vezes não pode
 * deixar quarenta e duas imagens repetidas na biblioteca.
 */
const subidos = new Map();
async function retrato({ src, alt, titulo }) {
  if (subidos.has(src)) return subidos.get(src);

  const nome = path.basename(src);
  // Pelo nome sem extensão: o Payload acrescenta `-1` a um ficheiro que já
  // exista no armazenamento, e a procura exacta não o encontrava.
  const raiz = nome.replace(/\.\w+$/, "");
  const { docs } = await payload.find({ collection: "media", where: { filename: { like: raiz } }, limit: 1 });
  if (docs[0]) {
    subidos.set(src, docs[0].id);
    return docs[0].id;
  }
  if (seco) {
    subidos.set(src, `(nova) ${nome}`);
    return `(nova) ${nome}`;
  }

  const dados = await readFile(path.join(RAIZ, "public", src.replace(/^\//, "")));
  const criada = await payload.create({
    collection: "media",
    data: { title: titulo, alt: alt || titulo },
    file: { name: nome, data: dados, mimetype: "image/webp", size: dados.byteLength },
  });
  subidos.set(src, criada.id);
  return criada.id;
}

let criadas = 0;
let enchidas = 0;
let intactas = 0;

for (const pessoa of team) {
  const ficha = noPainel.get(pessoa.name.trim().toLowerCase());

  // As regras de o que preencher são as mesmas do botão do painel, e vivem em
  // src/lib/equipa-fichas.ts: um campo com valor no painel nunca é tocado.
  const { dados: novo, retratos } = camposEmFalta(pessoa, ficha);

  if (!semRetratos) {
    for (const fonte of retratos) novo[fonte.campo] = await retrato(fonte);
  }

  const campos = Object.keys(novo);

  if (!ficha) {
    if (!seco) await payload.create({ collection: "team", data: { name: pessoa.name, ...novo }, overrideAccess: true });
    criadas += 1;
    console.log(`+ ${pessoa.name} — ficha criada com ${campos.join(", ") || "só o nome"}`);
    continue;
  }

  if (!campos.length) {
    intactas += 1;
    console.log(`= ${pessoa.name} — já está completa`);
    continue;
  }

  if (!seco) await payload.update({ collection: "team", id: ficha.id, data: novo, overrideAccess: true });
  enchidas += 1;
  console.log(`· ${pessoa.name} — ${campos.join(", ")}`);
}

// Quem está no painel e não está no ficheiro fica como está, e é dito: pode ser
// alguém que entrou na casa depois deste ficheiro ter sido escrito.
const doFicheiro = new Set(team.map((pessoa) => pessoa.name.trim().toLowerCase()));
const sos = existentes.filter((doc) => !doFicheiro.has(String(doc.name ?? "").trim().toLowerCase()));
for (const doc of sos) console.log(`? ${doc.name} — está no painel e não no ficheiro, não se mexeu`);

console.log(
  `\n${seco ? "(seco) " : ""}${criadas} fichas criadas, ${enchidas} enchidas, ${intactas} já completas` +
    `${semRetratos ? ", sem retratos" : `, ${subidos.size} retratos na biblioteca`}.`,
);
process.exit(0);
