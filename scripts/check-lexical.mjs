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
/*
 * O motor tem de ser o do campo, não o de origem. O corpo dos artigos tem
 * funcionalidades a mais — a imagem com posição e legenda, o bloco de vídeo —
 * e o editor de origem não as conhece: lia um nó `block` como desconhecido,
 * deitava fora tudo o que vinha depois, e este guião dava por partido um
 * artigo que o painel abria sem problema. Aconteceu com o da 8.ª edição dos
 * Heróis PME, que tem a reportagem da CNN em vídeo.
 */
const campos = payload.collections.posts.config.fields;
const procura = (lista, nome) => {
  for (const campo of lista) {
    if (campo.name === nome) return campo;
    const dentro = campo.fields ?? campo.tabs?.flatMap((tab) => tab.fields) ?? [];
    const achado = dentro.length ? procura(dentro, nome) : null;
    if (achado) return achado;
  }
  return null;
};
const motorDe = (nome) => editorConfigFactory.fromField({ field: procura(campos, nome) });
const motores = { body: motorDe("body"), bodyEn: motorDe("bodyEn") };

let maus = 0;
for (const doc of docs) {
  for (const campo of ["body", "bodyEn"]) {
    if (!doc[campo]?.root) continue;
    const erros = [];
    const editor = createHeadlessEditor({
      nodes: getEnabledNodes({ editorConfig: motores[campo] }),
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
