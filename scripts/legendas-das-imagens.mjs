#!/usr/bin/env node
/**
 * Passa a legenda das imagens para o campo certo.
 *
 * No site antigo a legenda era um parágrafo normal a seguir à imagem — «Fonte:
 * Freepik», «Maria Costa – COO Jelly», a lista de nomes com o cargo entre
 * parênteses — e foi assim que veio na migração. O painel tem um campo
 * «Legenda» na própria imagem, e é esse que o site desenha com o cartão de
 * vidro (`.legenda-imagem`). Isto encontra os parágrafos que são legendas e
 * passa-os para o campo, nas duas línguas, apagando o parágrafo.
 *
 * As regras são apertadas de propósito — mais vale deixar uma legenda por
 * converter do que fazer de um título de secção uma legenda:
 *   A. começa por Fonte/Foto/Imagem/Créditos/Legenda/Figura/Fig./©, ou o inglês;
 *   B. começa por um nome próprio (ou «Na mesa redonda…: nome») seguido de um
 *      cargo entre parênteses, com uma frase no máximo;
 *   C. «Nome Apelido – Cargo»;
 *   D. um parágrafo todo em itálico, até 160 caracteres.
 * E nunca um texto que acabe em dois pontos ou travessão, nem com mais de
 * 220 caracteres.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/legendas-das-imagens.mjs --dry
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/legendas-das-imagens.mjs
 */
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry");
const payload = await getPayload({ config });
const { docs } = await payload.find({ collection: "posts", limit: 0, depth: 0 });

const texto = (n) => (n.children || []).map((c) => (c.type === "text" ? c.text : texto(c))).join("");
const todosItalicos = (n) => {
  const ts = [];
  (function w(x) { if (x.type === "text") ts.push(x); (x.children || []).forEach(w); })(n);
  return ts.length > 0 && ts.every((t) => t.text.trim() === "" || t.format & 2);
};
const NOME = "[A-ZÁÂÃÉÍÓÔÚÇ][\\wÀ-ÿ'’.-]+";
const regra = (t, p) => {
  const s = t.trim();
  if (s.length < 8 || s.length > 220) return null;
  if (/[:–-]\s*$/.test(s)) return null;
  const frases = (s.match(/[.!?](\s|$)/g) || []).length;
  if (/^(fonte|foto|fotografia|na foto|na imagem|imagem:|créditos|crédito|legenda|da esquerda|à esquerda|figura|fig\.|©|source|photo|image:|credits?|caption|from left|figure)/i.test(s)) return "A";
  if (new RegExp(`^((Na mesa redonda|At the round table)[^:]*:\\s*)?${NOME}(\\s+${NOME})+\\s*\\([^)]{2,60}\\)`).test(s) && frases <= 1 && s.length <= 200) return "B";
  if (new RegExp(`^${NOME}(\\s+${NOME}){1,3}\\s+[–-]\\s+[^–]{3,60}$`).test(s)) return "C";
  if (todosItalicos(p) && s.length <= 160) return "D";
  return null;
};

let legendas = 0;
let artigos = 0;
for (const doc of docs) {
  const dados = {};
  let n = 0;
  for (const campo of ["body", "bodyEn"]) {
    const raiz = doc[campo]?.root;
    if (!raiz) continue;
    const arvore = structuredClone(doc[campo]);
    const kids = arvore.root.children;
    for (let i = 0; i < kids.length - 1; i++) {
      const a = kids[i];
      const b = kids[i + 1];
      const media = a.type === "upload" || (a.type === "block" && a.fields?.blockType === "video");
      if (!media || b.type !== "paragraph" || a.fields?.caption) continue;
      const t = texto(b).trim();
      const r = regra(t, b);
      if (!r) continue;
      a.fields = { ...(a.fields ?? {}), ...(a.type === "upload" && !a.fields?.align ? { align: "full" } : {}), caption: t };
      kids.splice(i + 1, 1);
      n += 1;
      if (seco) console.log(`  ${r} ${doc.slug} [${campo}] ${t.slice(0, 90)}`);
    }
    if (n) dados[campo] = arvore;
  }
  if (!n) continue;
  legendas += n;
  artigos += 1;
  if (!seco) {
    await payload.update({ collection: "posts", id: doc.id, data: dados });
    console.log(`✓ ${doc.slug}: ${n} legendas`);
  }
}
console.log(`\n${legendas} legendas em ${artigos} de ${docs.length} artigos${seco ? " (ensaio, nada gravado)" : ""}`);
if (!seco && legendas) await purgeSite();
process.exit(0);
