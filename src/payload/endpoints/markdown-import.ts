import type { PayloadHandler } from "payload";
import { markdownParaLexical } from "@/lib/markdown-lexical";
import config from "@/../payload.config";

/**
 * Um ficheiro Markdown a povoar um artigo: texto, formatação e imagens.
 *
 * O trabalho está em `src/lib/markdown-lexical.ts`, que corre sem base de dados
 * e por isso se pode conferir num guião. Aqui fica o que é do servidor: a porta
 * e a criação dos ficheiros na biblioteca.
 *
 * POST /api/posts/markdown  { markdown, nome }
 */
export const importMarkdown: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ error: "Sem sessão." }, { status: 401 });

  let markdown = "";
  let nome = "";
  try {
    const corpo = (await req.json?.()) as { markdown?: string; nome?: string } | undefined;
    markdown = String(corpo?.markdown ?? "");
    nome = String(corpo?.nome ?? "");
  } catch {
    return Response.json({ error: "Corpo do pedido ilegível." }, { status: 400 });
  }

  if (!markdown.trim()) return Response.json({ error: "O ficheiro está vazio." }, { status: 400 });

  const importado = await markdownParaLexical(
    markdown,
    async (ficheiro) => {
      const guardada = await req.payload.create({
        collection: "media",
        data: { alt: ficheiro.alt },
        file: { name: ficheiro.nome, data: ficheiro.bytes, mimetype: ficheiro.tipo, size: ficheiro.bytes.length },
      });
      return guardada.id;
    },
    { nome, config: await config },
  );

  return Response.json(importado);
};
