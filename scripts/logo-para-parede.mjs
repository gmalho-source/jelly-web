#!/usr/bin/env node
/**
 * Põe uma marca numa parede de logos.
 *
 * Serve para o caso que se repete: chega um logo ou um selo de parceiro, e tem
 * de ficar na parede certa, com o nome certo e com o endereço onde se confirma.
 * À mão são três passos no painel; aqui é um comando, e o mesmo comando corrido
 * outra vez não duplica nada — se já houver uma marca com aquele nome naquela
 * parede, é essa que recebe a imagem.
 *
 *   npm run logos:parede -- --parede=parceiros-marketing \
 *     --nome="Google Partner" --ficheiro=/caminho/selo.svg \
 *     --link=https://www.google.com/partners/agency?id=…
 *
 * O ficheiro pode ser um caminho ou um endereço. Um SVG é desenhado aqui antes
 * de subir, a 640 px de largura: o Payload converte tudo para WebP, e um SVG
 * convertido com a densidade por omissão sobe com os 150 px do desenho e fica
 * esborratado no ecrã.
 *
 * Uma marca que já esteja noutra parede não precisa de subir outra vez: com
 * `--imagem=<id>` aponta-se ao ficheiro que já lá está, e as duas paredes
 * mostram o mesmo logo sem duas cópias no armazenamento.
 *
 * Com `--ensaio` diz o que faria e não grava.
 */
import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const ensaio = args.includes("--ensaio");
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.slice(nome.length + 3);

const paredeSlug = valor("parede");
const nome = valor("nome");
const ficheiro = valor("ficheiro");
const link = valor("link");
const imagemExistente = valor("imagem");
const alt = valor("alt");
const ordem = valor("ordem");

if (!paredeSlug || !nome || (!ficheiro && !imagemExistente)) {
  console.error("Falta --parede, --nome e um de --ficheiro ou --imagem.");
  process.exit(1);
}

/** Os bytes da imagem, venham de disco ou da rede. */
async function bytes(origem) {
  if (/^https?:\/\//.test(origem)) {
    const resposta = await fetch(origem, { headers: { accept: "image/*,*/*" } });
    if (!resposta.ok) throw new Error(`${origem}: ${resposta.status}`);
    return { corpo: Buffer.from(await resposta.arrayBuffer()), nome: path.basename(new URL(origem).pathname) };
  }
  return { corpo: fs.readFileSync(origem), nome: path.basename(origem) };
}

const tipos = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

const payload = await getPayload({ config });

const paredes = await payload.find({ collection: "logo-walls", where: { slug: { equals: paredeSlug } }, limit: 1 });
const parede = paredes.docs[0];
if (!parede) {
  console.error(`Não há parede com o slug "${paredeSlug}".`);
  process.exit(1);
}

/** A imagem: ou já existe na biblioteca, ou sobe agora. */
async function imagemDoLogo() {
  if (imagemExistente) {
    const doc = await payload.findByID({ collection: "media", id: imagemExistente, depth: 0 }).catch(() => null);
    if (!doc) {
      console.error(`Não há imagem com o id ${imagemExistente}.`);
      process.exit(1);
    }
    console.log(`${nome} → ${parede.name} (imagem #${doc.id}, já na biblioteca)`);
    return doc.id;
  }
  return subir();
}

async function subir() {
  let { corpo, nome: ficheiroNome } = await bytes(ficheiro);
// Um SVG é desenho, não pixels: desenha-se aqui, em grande, antes de subir.
if (/\.svg$/i.test(ficheiroNome) || corpo.subarray(0, 300).toString("utf8").includes("<svg")) {
  corpo = await sharp(corpo, { density: 600 }).resize({ width: 640 }).png().toBuffer();
  ficheiroNome = ficheiroNome.replace(/\.svg$/i, "") + ".png";
}

  const extensao = path.extname(ficheiroNome).slice(1).toLowerCase();
  const { width, height } = await sharp(corpo).metadata();
  console.log(`${nome} → ${parede.name} (${width}×${height}, ${Math.round(corpo.byteLength / 1024)} kB)`);
  if (ensaio) return "ensaio";
  const criada = await payload.create({
    collection: "media",
    data: { alt: alt || nome, title: nome },
    file: { name: ficheiroNome, data: corpo, mimetype: tipos[extensao] ?? "image/png", size: corpo.byteLength },
  });
  return criada.id;
}

const imagem = await imagemDoLogo();

if (ensaio) {
  console.log("ensaio: nada gravado");
  process.exit(0);
}

const existentes = await payload.find({
  collection: "logos",
  where: { and: [{ wall: { equals: parede.id } }, { name: { equals: nome } }] },
  limit: 1,
  depth: 0,
});

const dados = {
  name: nome,
  wall: parede.id,
  image: imagem,
  ...(link ? { link } : {}),
  ...(ordem ? { order: Number(ordem) } : {}),
};

const logo = existentes.docs.length
  ? await payload.update({ collection: "logos", id: existentes.docs[0].id, data: dados })
  : await payload.create({ collection: "logos", data: dados });

console.log(`logo ${existentes.docs.length ? "atualizado" : "criado"}: #${logo.id}`);
await purgeSite();
process.exit(0);
