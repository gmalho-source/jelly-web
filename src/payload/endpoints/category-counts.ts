import type { PayloadHandler } from "payload";

/**
 * Quantos artigos usa cada categoria.
 *
 * Uma resposta para a lista toda e não uma por linha: são dez categorias por
 * página, e dez pedidos para contar dez números é trabalho a mais para o
 * servidor e uma tabela a encher-se aos saltos para quem está a olhar.
 *
 * Conta-se em memória em vez de se pedir uma contagem por categoria à base de
 * dados: são cento e tal artigos, cabem numa leitura, e assim isto continua a
 * funcionar se um dia a coleção mudar de sítio. Se um dia forem milhares,
 * troca-se por um `group by` — e nessa altura já se sabe porquê.
 *
 * GET /api/categories/contagens
 */
export const categoryCounts: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });

  const { docs } = await req.payload.find({
    collection: "posts",
    limit: 0,
    depth: 0,
    pagination: false,
    // Só as duas colunas que interessam. Sem isto vinha o corpo de cada artigo
    // — uma árvore do Lexical por cada um, cento e tal delas — para contar dois
    // números. É a diferença entre uma leitura barata e uma leitura absurda.
    select: { category: true, _status: true },
  });

  /*
   * Sem `draft: true`. Com ele, o Payload devolve a última versão de cada
   * artigo, que pode ter uma categoria diferente da que está publicada — e a
   * coluna passava a contar o que alguém ainda está a pensar em vez do que
   * está. Sem ele vêm os documentos como estão, rascunhos incluídos: um artigo
   * criado e nunca publicado tem linha na coleção, com `_status` a dizê-lo.
   */
  const contagens: Record<string, { total: number; rascunhos: number }> = {};
  for (const doc of docs as unknown as Record<string, unknown>[]) {
    const categoria = doc.category;
    const id = typeof categoria === "object" && categoria ? (categoria as { id?: unknown }).id : categoria;
    if (id === null || id === undefined || id === "") continue;
    const chave = String(id);
    contagens[chave] ??= { total: 0, rascunhos: 0 };
    contagens[chave].total += 1;
    if (doc._status === "draft") contagens[chave].rascunhos += 1;
  }

  return Response.json({ contagens });
};
