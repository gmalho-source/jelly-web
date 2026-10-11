import { readFile } from "node:fs/promises";
import path from "node:path";
import { nomeDaImagemJelly } from "./segredo";

/**
 * A imagem da assinatura da Jelly: o carimbo da casa com a rubrica do
 * sócio-gerente, aposta no documento quando — e só quando — ele assina.
 *
 * Em produção vem do Blob, com o nome que só o servidor sabe calcular. Em
 * desenvolvimento, de `privado/assinatura-jelly.png`, que o .gitignore deixa
 * de fora. Sem imagem, o documento fecha na mesma: a prova da assinatura é o
 * registo (código, hora, IP, impressão digital), não o desenho.
 */
export async function imagemDaJelly(): Promise<Uint8Array | null> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (token) {
      const { head } = await import("@vercel/blob");
      const info = await head(nomeDaImagemJelly(), { token });
      const resposta = await fetch(info.url, { cache: "no-store" });
      if (!resposta.ok) throw new Error(`o armazenamento respondeu ${resposta.status}`);
      return new Uint8Array(await resposta.arrayBuffer());
    }
    return new Uint8Array(await readFile(path.resolve(process.cwd(), "privado", "assinatura-jelly.png")));
  } catch (erro) {
    console.warn(`assinaturas: sem imagem da assinatura da Jelly (${erro instanceof Error ? erro.message : "erro"})`);
    return null;
  }
}

/** Se a imagem está onde o site a procura — para o painel avisar antes de enviar. */
export async function haImagemDaJelly(): Promise<boolean> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
    if (token) {
      const { head } = await import("@vercel/blob");
      await head(nomeDaImagemJelly(), { token });
      return true;
    }
    await readFile(path.resolve(process.cwd(), "privado", "assinatura-jelly.png"));
    return true;
  } catch {
    return false;
  }
}
