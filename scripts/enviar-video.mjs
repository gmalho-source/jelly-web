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

/*
 * A chave com que se reconhece um ficheiro, e é preciso ser grosseira.
 *
 * Entre o disco, o WordPress e o mecanismo dos anexos, o mesmo vídeo chega
 * escrito de todas as maneiras: espaços virados sublinhados, parênteses
 * perdidos pelo caminho, e o «é» de «Estratégia» desmontado em «e» mais acento
 * e depois substituído por um sublinhado. Ficam só as letras e os algarismos,
 * sem acentos — verificado contra os quarenta e oito nomes que as histórias
 * pedem, e não há dois que dêem a mesma chave.
 */
const chave = (nome) =>
  nome
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9.]/g, "");
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
pedidos.set(chave("Video 3 - NUK Estratégia.mp4"), pedidos.get(chave("Video 3 - NUK Estratégia (video-converter.com).mp4")));

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
  try {
    await put(`video/portefolio/${nome}`, createReadStream(caminho), {
      access: "public",
      addRandomSuffix: false,
      contentType: nome.toLowerCase().endsWith(".webm") ? "video/webm" : "video/mp4",
    });
  } catch (erro) {
    // O Blob recusa gravar por cima, e ainda bem: mandar o mesmo ficheiro duas
    // vezes é coisa que acontece. Não é falha — é trabalho já feito. Substituir
    // um vídeo de propósito faz-se apagando-o primeiro, com a mão.
    if (!/already exists/i.test(String(erro?.message))) throw erro;
    console.log(`  =  ${nome} — já lá estava, não repeti`);
    continue;
  }
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
}
process.exit(falhas ? 1 : 0);
