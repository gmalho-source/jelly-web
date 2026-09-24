#!/usr/bin/env node
/**
 * Um vídeo de caso, do disco para o Blob, com o nome que a página pede.
 *
 * Os ficheiros chegam com o nome que o disco lhes deu — e o disco, o WordPress
 * e o mecanismo dos anexos mexeram-lhe todos: espaços trocados por sublinhados,
 * «.WebM» onde a história pede «.webM», acentos guardados de duas maneiras. O
 * endereço que a página pede é que manda, e é com esse que se grava.
 *
 *   node scripts/enviar-video.mjs <ficheiro> [<ficheiro>…]
 *
 * Precisa de BLOB_READ_WRITE_TOKEN. Confirma cada envio pelo endereço público
 * antes de o dar como feito: o Blob aceitar não é a página servir.
 */
import { createReadStream } from "node:fs";
import { basename } from "node:path";
import { put } from "@vercel/blob";
import projetos from "../src/content/generated/projects.json" with { type: "json" };

/** Sem maiúsculas, sem espaços, sem sublinhados, acentos normalizados. */
const chave = (nome) => nome.normalize("NFC").toLowerCase().replace(/[\s_]+/g, "");
/** Os anexos chegam com um prefixo de oito dígitos hexadecimais. */
const semPrefixo = (nome) => nome.replace(/^[0-9a-f]{8}-/, "");

const pedidos = new Map();
const anda = (no) => {
  if (Array.isArray(no)) return no.forEach(anda);
  if (!no || typeof no !== "object") return;
  for (const [campo, valor] of Object.entries(no)) {
    if ((campo === "mp4" || campo === "webm") && typeof valor === "string" && valor) {
      let nome = valor.split("/").pop();
      for (let volta = 0; volta < 3; volta += 1) {
        const decifrado = decodeURIComponent(nome);
        if (decifrado === nome) break;
        nome = decifrado;
      }
      pedidos.set(chave(nome), nome);
    } else anda(valor);
  }
};
for (const projeto of projetos) { anda(projeto.story); anda(projeto.storyEn); }
// O «Video 3» da NUK está no disco sem o sufixo do conversor que a história pede.
pedidos.set("video3-nukestratégia.mp4", pedidos.get("video3-nukestratégia(video-converter.com).mp4"));

const ficheiros = process.argv.slice(2);
if (!ficheiros.length) {
  console.error("uso: node scripts/enviar-video.mjs <ficheiro>…");
  process.exit(2);
}

let falhas = 0;
for (const caminho of ficheiros) {
  const local = semPrefixo(basename(caminho));
  const nome = pedidos.get(chave(local));
  if (!nome) {
    console.error(`  ?  ${local} — nenhuma história pede este ficheiro`);
    falhas += 1;
    continue;
  }
  const { url } = await put(`video/portefolio/${nome}`, createReadStream(caminho), {
    access: "public",
    addRandomSuffix: false,
    contentType: nome.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
  });
  // A prova é o endereço que a página usa, com o salto pelo meio.
  const publico = `https://www.jelly.pt/video/portefolio/${encodeURIComponent(nome)}`;
  let estado = "sem resposta";
  for (let tentativa = 0; tentativa < 4; tentativa += 1) {
    try {
      const resposta = await fetch(publico, { redirect: "follow" });
      estado = `${resposta.status} ${resposta.headers.get("content-type")} ${resposta.headers.get("content-length")}b`;
      if (resposta.ok) break;
    } catch { await new Promise((r) => setTimeout(r, 3000)); }
  }
  console.log(`  ✓  ${nome}\n       ${estado}`);
  if (!estado.startsWith("200")) falhas += 1;
  void url;
}
process.exit(falhas ? 1 : 0);
