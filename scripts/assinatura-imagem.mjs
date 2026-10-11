// Carrega (ou troca) a imagem da assinatura da Jelly no Blob.
//
//   node scripts/assinatura-imagem.mjs caminho/para/assinatura.png
//
// Precisa de PAYLOAD_SECRET e BLOB_READ_WRITE_TOKEN — os de produção, para a
// imagem ficar onde o site a procura. O nome do ficheiro sai do PAYLOAD_SECRET
// (ver src/lib/assinaturas/segredo.ts) e não se escreve no ecrã: o
// armazenamento é público, e o nome é a única fechadura.
//
// A imagem não vai para o repositório. Um PNG com fundo transparente, com uns
// 1000 px de largura, chega.
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import { put } from "@vercel/blob";

const ficheiro = process.argv[2];
const segredo = process.env.PAYLOAD_SECRET?.trim();
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
if (!ficheiro || !segredo || !token) {
  console.error("Uso: node scripts/assinatura-imagem.mjs imagem.png (com PAYLOAD_SECRET e BLOB_READ_WRITE_TOKEN no ambiente)");
  process.exit(1);
}

const bytes = await readFile(ficheiro);
if (bytes.subarray(1, 4).toString("latin1") !== "PNG") {
  console.error("Tem de ser um PNG.");
  process.exit(1);
}

const chave = createHmac("sha256", segredo).update("assinaturas:imagem-jelly").digest("hex");
const nome = `assinaturas-privado/jelly-${chave.slice(0, 40)}.png`;
await put(nome, bytes, { access: "public", token, contentType: "image/png", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60 });
console.log(`Imagem carregada (${Math.round(bytes.length / 1024)} KB).`);
