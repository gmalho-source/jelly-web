/**
 * Prova a importação de Word sem browser e sem base de dados.
 *
 * Faz o que o painel faz — o `mammoth` abre o .docx, as imagens trocam-se por
 * `media:N`, o HTML passa a Markdown e o Markdown passa à árvore do editor — e
 * abre a árvore com o próprio motor do editor, como o `md:check`. O DOM é o do
 * `happy-dom`, e as imagens não sobem: ganham um número falso.
 *
 *   npm run docx:check -- caminho/para/artigo.docx
 */
import { readFile } from "node:fs/promises";
import { Window } from "happy-dom";
import mammoth from "mammoth";
import { editorConfigFactory, getEnabledNodes } from "@payloadcms/richtext-lexical";
import { createHeadlessEditor } from "@lexical/headless";
import { htmlParaMarkdown, MAPA_DE_ESTILOS } from "../src/lib/docx-markdown.ts";
import { markdownParaLexical } from "../src/lib/markdown-lexical.ts";
import config from "../payload.config.ts";

const caminho = process.argv[2];
if (!caminho) {
  console.error("Uso: npm run docx:check -- artigo.docx");
  process.exit(2);
}

let n = 0;
const { value: html, messages } = await mammoth.convertToHtml(
  { buffer: await readFile(caminho) },
  {
    styleMap: MAPA_DE_ESTILOS,
    convertImage: mammoth.images.imgElement(async (imagem) => {
      n += 1;
      const bytes = (await imagem.readAsBuffer()).length;
      console.log(`  imagem ${n}: ${imagem.contentType}, ${bytes} bytes, alt="${imagem.altText ?? ""}"`);
      return { src: `media:${n}` };
    }),
  },
);
for (const m of messages) console.log(`  mammoth ${m.type}: ${m.message}`);

const janela = new Window();
janela.document.body.innerHTML = html;
const markdown = htmlParaMarkdown(janela.document.body);
console.log("\n--- Markdown ---\n" + markdown + "--- fim ---");

const importado = await markdownParaLexical(
  markdown,
  async () => {
    throw new Error("não devia carregar nada: as imagens do Word já vêm com número");
  },
  { nome: caminho, config },
);
console.log("Cabeçalho lido:", importado.meta);
console.log("Imagens:", importado.imagens);

const editorConfig = await editorConfigFactory.default({ config });
const editor = createHeadlessEditor({ nodes: getEnabledNodes({ editorConfig }) });
let erro = null;
try {
  editor.update(() => editor.setEditorState(editor.parseEditorState(importado.body)), { discrete: true });
  editor.getEditorState().read(() => {});
} catch (e) {
  erro = e;
}

const tipos = [];
const anda = (no) => {
  if (!no || typeof no !== "object") return;
  if (no.type) tipos.push(no.tag ? `${no.type}:${no.tag}` : no.type);
  for (const filho of no.children ?? []) anda(filho);
};
anda(importado.body.root);
console.log("\nNós:", [...new Set(tipos)].join(", "));

// O texto como o editor o vai mostrar, para ver se sobrou alguma barra de
// escape ou marca de formatação por converter.
const textos = [];
const junta = (no) => {
  if (!no || typeof no !== "object") return;
  if (["paragraph", "heading", "listitem"].includes(no.type)) {
    textos.push(`  ${no.tag ?? no.type}: ${(no.children ?? []).map((f) => f.text ?? "").join("")}`);
  }
  for (const filho of no.children ?? []) if (filho.type !== "text") junta(filho);
};
junta(importado.body.root);
console.log("\nNo editor:\n" + textos.join("\n"));
const falhou = erro || importado.imagens.falharam.length || importado.imagens.entraram !== n;
console.log(erro ? `\nFALHOU: ${erro.message}` : falhou ? "\nFALHOU: imagens perdidas" : "\nA árvore abre no editor sem erro.");
await janela.happyDOM.close();
// Sair só depois de a saída ter sido escrita: por um pipe, o `process.exit`
// directo cortava o relatório a meio.
process.stdout.write("", () => process.exit(falhou ? 1 : 0));
