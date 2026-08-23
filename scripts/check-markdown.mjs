/**
 * Prova a importação de Markdown sem browser e sem base de dados.
 *
 * Converte um exemplo com de tudo — títulos, listas, negritos, citação, código,
 * tabela, imagens — e depois abre a árvore com o próprio motor do editor. É a
 * única forma de saber que um nó escrito à mão é válido: o editor só se queixa
 * quando alguém abre o artigo, e aí já está gravado.
 *
 *   npm run md:check
 */
import { editorConfigFactory, getEnabledNodes } from "@payloadcms/richtext-lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { markdownParaLexical } from "../src/lib/markdown-lexical.ts";
import config from "../payload.config.ts";

const EXEMPLO = `---
title: Como a IA muda o trabalho de uma agência
description: O que mudou de facto, e o que ficou igual.
date: 2026-08-23
---

# Como a IA muda o trabalho de uma agência

O primeiro parágrafo, com **negrito**, _itálico_ e um [link](https://www.jelly.pt).

![Uma imagem que existe](https://jelly-web-pi.vercel.app/brand/jelly-wordmark-red-email.png)

## O que mudou

- Primeiro ponto
- Segundo ponto, com \`código\`
- Terceiro

1. Um
2. Dois

> Uma citação de alguém que sabia do que falava.

![Uma que não existe](./imagens/local.png)

\`\`\`js
const x = 1;
\`\`\`

O fim.
`;

// Um duplo de quem guarda: devolve ids falsos sem tocar na base.
let contador = 0;
const guarda = async (ficheiro) => {
  contador += 1;
  console.log(`  guardaria ${ficheiro.nome} (${ficheiro.tipo}, ${ficheiro.bytes.length} bytes) alt="${ficheiro.alt}"`);
  return contador;
};

const importado = await markdownParaLexical(EXEMPLO, guarda, { nome: "artigo.md", config });

console.log("\nCabeçalho lido:", importado.meta);
console.log("Imagens:", importado.imagens);

// E agora o teste que conta: a árvore abre no motor do editor?
const editorConfig = await editorConfigFactory.default({ config });
const editor = createHeadlessEditor({ nodes: getEnabledNodes({ editorConfig }) });

let erro = null;
editor.update(
  () => {
    editor.setEditorState(editor.parseEditorState(importado.body));
  },
  { discrete: true },
);
try {
  editor.getEditorState().read(() => {});
} catch (e) {
  erro = e;
}

const tipos = [];
const anda = (no) => {
  if (!no || typeof no !== "object") return;
  if (no.type) tipos.push(no.type);
  for (const filho of no.children ?? []) anda(filho);
};
anda(importado.body.root);

console.log("\nNós:", [...new Set(tipos)].join(", "));
console.log("Total de nós:", tipos.length);
console.log(erro ? `\nFALHOU: ${erro.message}` : "\nA árvore abre no editor sem erro.");
process.exit(erro ? 1 : 0);
