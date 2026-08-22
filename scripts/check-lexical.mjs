#!/usr/bin/env node
/**
 * Lê todos os corpos dos artigos com o mesmo motor do editor e diz quais dão
 * erro ou perdem conteúdo pelo caminho.
 *
 * Serve de rede: um nó mal formado não dá erro ao gravar — só quando o editor o
 * lê, e aí o painel mostra o artigo e logo o deixa em branco. Correr depois de
 * qualquer guião que escreva no corpo dos artigos.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run posts:check
 */
import { createHeadlessEditor } from "@lexical/headless";
import { editorConfigFactory, getEnabledNodes } from "@payloadcms/richtext-lexical";
import { getPayload } from "payload";
import config from "../payload.config.ts";

const payload = await getPayload({ config });
const { docs } = await payload.find({ collection: "posts", limit: 0, depth: 0 });
const editorConfig = await editorConfigFactory.default({ config: payload.config });

let maus = 0;
for (const doc of docs) {
  for (const campo of ["body", "bodyEn"]) {
    if (!doc[campo]?.root) continue;
    const erros = [];
    const editor = createHeadlessEditor({
      nodes: getEnabledNodes({ editorConfig }),
      onError: (error) => erros.push(error.message),
    });
    const estado = editor.parseEditorState(JSON.parse(JSON.stringify(doc[campo])));
    editor.setEditorState(estado);

    const lidos = estado.toJSON().root.children.length;
    const gravados = doc[campo].root.children.length;
    if (erros.length || lidos !== gravados) {
      maus += 1;
      console.log(`✗ ${doc.slug} ${campo}: ${gravados}→${lidos} ${[...new Set(erros)].join("; ")}`);
    }
  }
}

console.log(maus ? `${maus} corpos com problema` : `${docs.length} artigos lidos sem erro, nada perdido`);
process.exit(maus ? 1 : 0);
