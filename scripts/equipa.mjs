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
async function retrato(fonte, alt, titulo) {
  if (!fonte?.src) return null;
  if (subidos.has(fonte.src)) return subidos.get(fonte.src);

  const nome = path.basename(fonte.src);
  const { docs } = await payload.find({ collection: "media", where: { filename: { equals: nome } }, limit: 1 });
  if (docs[0]) {
    subidos.set(fonte.src, docs[0].id);
    return docs[0].id;
  }
  if (seco) {
    subidos.set(fonte.src, `(nova) ${nome}`);
    return `(nova) ${nome}`;
  }

  const dados = await readFile(path.join(RAIZ, "public", fonte.src.replace(/^\//, "")));
  const criada = await payload.create({
    collection: "media",
    data: { title: titulo, alt: alt || titulo },
    file: { name: nome, data: dados, mimetype: "image/webp", size: dados.byteLength },
  });
  subidos.set(fonte.src, criada.id);
  return criada.id;
}

let criadas = 0;
let enchidas = 0;
let intactas = 0;

for (const pessoa of team) {
  const ficha = noPainel.get(pessoa.name.trim().toLowerCase());

  // O que falta nesta ficha. Um campo com valor no painel nunca é tocado: quem
  // o escreveu lá sabia mais do que este ficheiro.
  const novo = {};
  const vazio = (valor) => !String(valor ?? "").trim();

  if (ficha ? vazio(ficha.role?.pt) && vazio(ficha.role?.en) : true) {
    if (pessoa.role) novo.role = pessoa.role;
  }
  if (ficha ? vazio(ficha.bio?.pt) && vazio(ficha.bio?.en) : true) {
    // Só o português: a apresentação inglesa faz-se no painel, com o botão de
    // traduzir, e por quem a lê antes de gravar.
    if (pessoa.bio?.pt) novo.bio = { pt: pessoa.bio.pt };
  }
  if (ficha ? vazio(ficha.linkedin) : true) {
    if (pessoa.linkedin) novo.linkedin = pessoa.linkedin;
  }

  if (!semRetratos) {
    if (!ficha?.photo) {
      const id = await retrato(pessoa.photo, pessoa.photo?.alt, `${pessoa.name} (preto e branco)`);
      if (id) novo.photo = id;
    }
    if (!ficha?.photoColor) {
      const id = await retrato(pessoa.photoColor, pessoa.photoColor?.alt, `${pessoa.name} (cor)`);
      if (id) novo.photoColor = id;
    }
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
