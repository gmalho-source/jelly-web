"use client";

import type { DefaultCellComponentProps } from "payload";
import { useEffect, useState } from "react";

type Contagem = { total: number; rascunhos: number };
type Resposta = { contagens?: Record<string, Contagem> };

/**
 * Quantos artigos usa esta categoria, com link para eles.
 *
 * Uma coluna que responde à pergunta que se faz ao olhar para uma lista de
 * categorias: quais é que estão a ser usadas, e quais é que ficaram para trás.
 * O número é o link — carregar leva à lista dos artigos já filtrada por esta
 * categoria, que é o passo seguinte natural.
 *
 * O pedido é um só para a página inteira, e não um por linha. As dez células
 * partilham a mesma promessa: a primeira a ser desenhada faz o pedido, as
 * outras nove esperam por ele. Sem isto eram dez pedidos iguais e uma tabela a
 * encher-se aos saltos.
 *
 * A promessa vive fora do componente de propósito, para sobreviver a uma linha
 * que se volta a desenhar. Não vive para sempre: gravar um artigo muda as
 * contagens, e por isso ela é esquecida ao fim de meio minuto.
 */
const pedidos = new Map<string, { quando: number; promessa: Promise<Record<string, Contagem>> }>();
const VALIDADE = 30_000;

function contagens(colecao: string) {
  const guardado = pedidos.get(colecao);
  if (guardado && Date.now() - guardado.quando < VALIDADE) return guardado.promessa;
  const promessa = fetch(`/api/${colecao}/contagens`, { credentials: "include" })
    .then((r): Promise<Resposta> => (r.ok ? (r.json() as Promise<Resposta>) : Promise.resolve({})))
    .then((corpo) => corpo.contagens ?? {})
    .catch(() => ({}) as Record<string, Contagem>);
  pedidos.set(colecao, { quando: Date.now(), promessa });
  return promessa;
}

/** A célula, com a coleção a contar e a coleção a filtrar por parâmetro. */
function Contagem({ id, colecao, campo }: { id: unknown; colecao: string; campo: string }) {
  const [conta, setConta] = useState<Contagem | null | undefined>(undefined);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const todas = await contagens(colecao);
      if (vivo) setConta(todas[String(id)] ?? null);
    })();
    return () => {
      vivo = false;
    };
  }, [id, colecao]);

  // Enquanto não se sabe, não se diz nada: um zero que depois muda para doze é
  // pior do que uma célula vazia por um instante.
  if (conta === undefined) return <span style={{ color: "var(--theme-elevation-400)" }}>·</span>;

  if (!conta || !conta.total) {
    return <span style={{ color: "var(--theme-elevation-400)" }}>nenhum</span>;
  }

  const rascunhos = conta.rascunhos
    ? `${conta.total} artigos, ${conta.rascunhos} por publicar`
    : `${conta.total} ${conta.total === 1 ? "artigo publicado" : "artigos publicados"}`;

  return (
    <a
      href={`/admin/collections/posts?where[or][0][and][0][${campo}][equals]=${encodeURIComponent(String(id))}`}
      title={rascunhos}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      {conta.total}
      {conta.rascunhos ? <span style={{ color: "var(--theme-elevation-500)" }}> · {conta.rascunhos} por publicar</span> : null}
    </a>
  );
}

/** Na lista das categorias. */
export function ContagemArtigos({ rowData }: DefaultCellComponentProps) {
  return <Contagem id={rowData?.id} colecao="categories" campo="category" />;
}

/** Na lista das etiquetas. */
export function ContagemEtiqueta({ rowData }: DefaultCellComponentProps) {
  return <Contagem id={rowData?.id} colecao="tags" campo="tags" />;
}

export default ContagemArtigos;
