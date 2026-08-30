import type { PayloadHandler } from "payload";

/**
 * Quantos artigos usam cada categoria, e cada etiqueta.
 *
 * Uma resposta para a lista toda e não uma por linha: são dez por página, e dez
 * pedidos para contar dez números é trabalho a mais para o servidor e uma tabela
 * a encher-se aos saltos para quem está a olhar.
 *
 * Conta-se em memória em vez de se pedir uma contagem à base de dados: são cento
 * e tal artigos, cabem numa leitura, e assim isto continua a funcionar se um dia
 * a coleção mudar de sítio. Se um dia forem milhares, troca-se por um `group
 * by` — e nessa altura já se sabe porquê.
 */

type Contagem = { total: number; rascunhos: number };

/**
 * Lê os artigos uma vez e conta por aquilo que a função disser.
 *
 * Sem `draft: true` de propósito: com ele o Payload devolve a última versão de
 * cada artigo, que pode ter outra categoria ou outras etiquetas do que as
 * publicadas — e a coluna passava a contar o que alguém ainda está a pensar em
 * vez do que está.
 *
 * O `select` traz três colunas e não o artigo inteiro. Sem ele vinha o corpo de
 * cada um — uma árvore do Lexical por cada um, cento e tal delas — para contar
 * números.
 */
async function conta(
  req: Parameters<PayloadHandler>[0],
  chaves: (doc: Record<string, unknown>) => unknown[],
) {
  const { docs } = await req.payload.find({
    collection: "posts",
    limit: 0,
    depth: 0,
    pagination: false,
    select: { category: true, tags: true, _status: true },
  });

  const contagens: Record<string, Contagem> = {};
  for (const doc of docs as unknown as Record<string, unknown>[]) {
    for (const bruta of chaves(doc)) {
      const id = typeof bruta === "object" && bruta ? (bruta as { id?: unknown }).id : bruta;
      if (id === null || id === undefined || id === "") continue;
      const chave = String(id);
      contagens[chave] ??= { total: 0, rascunhos: 0 };
      contagens[chave].total += 1;
      if (doc._status === "draft") contagens[chave].rascunhos += 1;
    }
  }
  return contagens;
}

/** GET /api/categories/contagens */
export const categoryCounts: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  return Response.json({ contagens: await conta(req, (doc) => [doc.category]) });
};

/** GET /api/tags/contagens */
export const tagCounts: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  return Response.json({
    contagens: await conta(req, (doc) => (Array.isArray(doc.tags) ? doc.tags : [])),
  });
};
