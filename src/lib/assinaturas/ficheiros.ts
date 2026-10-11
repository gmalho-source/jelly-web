import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Payload } from "payload";

/**
 * Os bytes dos PDFs das assinaturas, guardados e lidos.
 *
 * A coleção é privada: o endereço que o Payload dá (`/api/…/file/…`) pede
 * sessão no painel, e quem assina não a tem. O servidor vai buscar os bytes ao
 * armazenamento — ao Blob em produção, ao disco em desenvolvimento — e é ele
 * que os entrega a quem traz uma ligação válida.
 */
const COLECAO = "assinaturas-ficheiros";

export async function lerPdf(payload: Payload, id: string | number): Promise<Uint8Array> {
  const doc = (await payload.findByID({ collection: COLECAO, id, depth: 0, overrideAccess: true })) as { filename?: string | null };
  if (!doc?.filename) throw new Error("O ficheiro não existe.");

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) {
    const { head } = await import("@vercel/blob");
    const info = await head(doc.filename, { token });
    const resposta = await fetch(info.url, { cache: "no-store" });
    if (!resposta.ok) throw new Error(`o armazenamento respondeu ${resposta.status}`);
    return new Uint8Array(await resposta.arrayBuffer());
  }

  const config = payload.collections[COLECAO]?.config.upload;
  const pasta = typeof config === "object" && config.staticDir ? config.staticDir : COLECAO;
  return new Uint8Array(await readFile(path.resolve(process.cwd(), pasta, doc.filename)));
}

export async function guardarPdf(payload: Payload, bytes: Uint8Array, nome: string): Promise<string | number> {
  const limpo = nome
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
  const criado = await payload.create({
    collection: COLECAO,
    data: {},
    overrideAccess: true,
    file: { data: Buffer.from(bytes), mimetype: "application/pdf", name: limpo.endsWith(".pdf") ? limpo : `${limpo}.pdf`, size: bytes.length },
  });
  return criado.id;
}
