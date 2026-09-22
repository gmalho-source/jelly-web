import type { PayloadHandler } from "payload";
import { markdownParaLexical } from "@/lib/markdown-lexical";

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
    // A configuração vem do pedido e não de `@payload-config`. Importá-la aqui
    // fechava um círculo — a configuração carrega as coleções, as coleções
    // carregam este endpoint, e o endpoint voltava à configuração —, e um
    // círculo à volta da configuração deixa o leitor do CMS a meio de arrancar
    // em qualquer rota que entre por ele em execução. O `req.payload.config` é
    // a mesma configuração, já resolvida, sem passar por cima de ninguém.
    { nome, config: req.payload.config },
  );

  return Response.json(importado);
};
