/**
 * Nós do Lexical escritos à mão, com todos os campos que o editor espera.
 *
 * O que corria mal: os nós que estes guiões geravam traziam só o essencial
 * (`type`, `version`, `children`). O Lexical, ao ler um nó de elemento, chama
 * `setIndent(serializedNode.indent)` — e o item de lista recusa o que não seja
 * número. Com `indent` a faltar dava `Invalid indent value` (o «erro #117» na
 * versão minificada), o editor engolia o ramo e o artigo aparecia truncado:
 * primeiro via-se o corpo, logo depois desaparecia.
 *
 * Por isso os elementos levam sempre `format`, `indent` e `direction`, a lista
 * leva `start` e a imagem leva `id` e `fields`.
 */
import { randomBytes } from "node:crypto";

/** Id à maneira do bson: 24 caracteres hexadecimais, um por nó. */
export const nodeId = () => randomBytes(12).toString("hex");

const elemento = (extra) => ({ format: "", indent: 0, direction: "ltr", version: 1, ...extra });

export const textNode = (text, extra = {}) => ({
  type: "text",
  text,
  version: 1,
  format: 0,
  detail: 0,
  mode: "normal",
  style: "",
  ...extra,
});

export const paragraphNode = (children) =>
  elemento({ type: "paragraph", textFormat: 0, textStyle: "", children });

export const headingNode = (tag, children) => elemento({ type: "heading", tag, children });

export const quoteNode = (children) => elemento({ type: "quote", children });

export const listItemNode = (value, children) =>
  elemento({ type: "listitem", value, checked: undefined, children });

export const listNode = (ordered, itens) =>
  elemento({
    type: "list",
    listType: ordered ? "number" : "bullet",
    tag: ordered ? "ol" : "ul",
    start: 1,
    children: itens,
  });

/**
 * Imagem no meio do texto. O `id` é do nó, não da imagem: o Lexical precisa de
 * um por nó porque o nó tem campos próprios. O `fields` é onde esses campos
 * ficam, e tem de ser um objecto.
 */
export const uploadNode = (mediaId) => ({
  type: "upload",
  version: 3,
  id: nodeId(),
  relationTo: "media",
  value: mediaId,
  fields: {},
  format: "",
});

export const rootNode = (children) => ({
  root: { type: "root", version: 1, format: "", indent: 0, direction: "ltr", children },
});

const ELEMENTOS = new Set(["paragraph", "heading", "quote", "list", "listitem", "root"]);

/**
 * Acerta uma árvore já gravada: acrescenta o que falta sem tocar no que existe.
 * Devolve quantos nós mexeu — zero quer dizer que já estava bem.
 */
export function normalizeTree(value) {
  let mexidos = 0;

  const anda = (node) => {
    if (!node || typeof node !== "object") return;

    if (ELEMENTOS.has(node.type)) {
      let mexeu = false;
      if (typeof node.indent !== "number") (node.indent = 0), (mexeu = true);
      if (typeof node.format !== "string" && typeof node.format !== "number") (node.format = ""), (mexeu = true);
      if (node.direction === undefined) (node.direction = "ltr"), (mexeu = true);
      if (typeof node.version !== "number") (node.version = 1), (mexeu = true);
      if (node.type === "list" && typeof node.start !== "number") (node.start = 1), (mexeu = true);
      if (node.type === "listitem" && typeof node.value !== "number") (node.value = 1), (mexeu = true);
      if (mexeu) mexidos += 1;
    }

    if (node.type === "upload") {
      let mexeu = false;
      if (typeof node.id !== "string" || !node.id) (node.id = nodeId()), (mexeu = true);
      if (!node.fields || typeof node.fields !== "object") (node.fields = {}), (mexeu = true);
      if (typeof node.format !== "string") (node.format = ""), (mexeu = true);
      if (node.version !== 3) (node.version = 3), (mexeu = true);
      if (mexeu) mexidos += 1;
    }

    for (const filho of node.children ?? []) anda(filho);
  };

  anda(value?.root ?? value);
  return mexidos;
}
