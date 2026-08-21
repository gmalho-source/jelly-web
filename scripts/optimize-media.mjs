#!/usr/bin/env node
/**
 * Recodifica as imagens pesadas que já estão no CMS. A migração trouxe do
 * WordPress fotografias guardadas em PNG — 2,8 MB para um 1920x1080 que em
 * WebP fica em 200 KB. O site serve tudo pelo otimizador do Next, por isso
 * quem visita já não descarrega o original; o que isto corta é o peso no
 * armazenamento e o tempo do primeiro recorte de cada imagem.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/optimize-media.mjs --dry-run
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/optimize-media.mjs --min-kb=500
 *
 * Corre com tsx (npm run media:optimize). Idempotente: uma imagem já leve, ou
 * já em WebP, fica como está.
 */
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const minBytes = Number(value("min-kb") ?? 500) * 1024;
const limit = Number(value("limit") ?? 0) || Infinity;
const quality = Number(value("quality") ?? 82);
const maxSide = Number(value("max-side") ?? 2400);

const payload = await getPayload({ config });

const { docs } = await payload.find({
  collection: "media",
  where: { filesize: { greater_than: minBytes } },
  sort: "-filesize",
  limit: 0,
  depth: 0,
});

const heavy = docs.filter((doc) => doc.mimeType !== "image/webp").slice(0, limit);
console.log(`${heavy.length} imagens acima de ${Math.round(minBytes / 1024)} KB e ainda não em WebP`);

let saved = 0;
let done = 0;

for (const doc of heavy) {
  const before = doc.filesize ?? 0;
  try {
    const response = await fetch(doc.url.startsWith("http") ? doc.url : `${payload.config.serverURL ?? ""}${doc.url}`);
    if (!response.ok) throw new Error(`origem respondeu ${response.status}`);
    const original = Buffer.from(await response.arrayBuffer());

    const data = await sharp(original)
      .resize({ width: maxSide, height: maxSide, fit: "inside", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();

    // Recodificar não pode engordar: se acontecer, deixa-se como está.
    if (data.byteLength >= before) {
      console.log(`= ${doc.filename} (${Math.round(before / 1024)} KB, WebP não compensa)`);
      continue;
    }

    const name = `${doc.filename.replace(/\.\w+$/, "")}.webp`;
    if (!dryRun) {
      await payload.update({
        collection: "media",
        id: doc.id,
        data: {},
        file: { name, data, mimetype: "image/webp", size: data.byteLength },
      });
    }

    saved += before - data.byteLength;
    done += 1;
    console.log(`↓ ${doc.filename}: ${Math.round(before / 1024)} → ${Math.round(data.byteLength / 1024)} KB`);
  } catch (error) {
    console.log(`! ${doc.filename}: ${error.message}`);
  }
}

console.log(`${done} imagens recodificadas, ${(saved / 1048576).toFixed(1)} MB poupados${dryRun ? " (ensaio)" : ""}`);

// Recodificar muda o nome do ficheiro: sem purgar, as páginas já geradas
// continuam a apontar para o endereço que deixou de existir.
if (done && !dryRun) await purgeSite();
process.exit(0);
