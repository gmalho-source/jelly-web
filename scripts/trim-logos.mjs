#!/usr/bin/env node
/**
 * Corta a moldura transparente dos logos de clientes.
 *
 * O export do Smart Logo do site antigo traz cada marca dentro de uma tela
 * quadrada de 375x375 com a marca a ocupar 5% dos pixels. Desenhada a 56 px de
 * altura, a marca fica com uns quantos pixels e a parede parece vazia — foi o
 * que se via na página de clientes. Cortada a moldura, a mesma marca passa a
 * ocupar a caixa toda.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run logos:trim -- --dry-run
 *
 * Idempotente: uma imagem que já não tenha moldura a cortar fica como está.
 */
import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import sharp from "sharp";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const limit = Number(value("limit") ?? 0) || Infinity;
const margem = Number(value("margem") ?? 6);

const payload = await getPayload({ config });

// Os logos referenciam media; é a media que tem de ser cortada.
const { docs } = await payload.find({ collection: "logos", limit: 0, depth: 1 });
const imagens = new Map();
for (const doc of docs) {
  const image = doc.image;
  if (image && typeof image === "object" && image.id && image.url) imagens.set(image.id, image);
}

console.log(`${imagens.size} logos${dryRun ? " (ensaio)" : ""}`);

let cortados = 0;
let iguais = 0;
let falhados = 0;

for (const image of [...imagens.values()].slice(0, limit)) {
  try {
    // Em produção o endereço é do Blob; em desenvolvimento é relativo e o
    // ficheiro está no disco, onde não há servidor a que pedir.
    let original;
    if (image.url.startsWith("http")) {
      const response = await fetch(image.url);
      if (!response.ok) throw new Error(`a imagem respondeu ${response.status}`);
      original = Buffer.from(await response.arrayBuffer());
    } else {
      original = fs.readFileSync(path.join(process.cwd(), "media", image.filename));
    }

    const cortada = await sharp(original)
      .trim({ background: "#00000000", threshold: 5 })
      .toBuffer({ resolveWithObject: true });

    // Nada a cortar: a marca já preenchia a tela.
    const sobra = Math.max(image.width - cortada.info.width, image.height - cortada.info.height);
    if (sobra < 8) {
      iguais += 1;
      continue;
    }

    // Uma folga igual em volta, para as marcas não encostarem à borda da célula.
    const data = await sharp(cortada.data)
      .extend({
        top: margem,
        bottom: margem,
        left: margem,
        right: margem,
        background: "#00000000",
      })
      .png()
      .toBuffer();

    console.log(`${dryRun ? "·" : "✓"} ${image.filename}: ${image.width}x${image.height} → ${cortada.info.width + margem * 2}x${cortada.info.height + margem * 2}`);
    cortados += 1;
    if (dryRun) continue;

    await payload.update({
      collection: "media",
      id: image.id,
      data: {},
      file: {
        // Nome novo de propósito: o otimizador do Next guarda o resultado por
        // endereço durante um mês, e substituir o ficheiro no mesmo endereço
        // deixava o site a servir a versão antiga.
        name: image.filename.replace(/(-corte)?\.\w+$/, "-corte.png"),
        data,
        mimetype: "image/png",
        size: data.byteLength,
      },
    });
  } catch (error) {
    falhados += 1;
    console.log(`! ${image.filename}: ${error.message}`);
  }
}

console.log(`${cortados} cortados, ${iguais} já estavam, ${falhados} falhados`);
if (cortados && !dryRun) await purgeSite();
process.exit(falhados ? 1 : 0);
