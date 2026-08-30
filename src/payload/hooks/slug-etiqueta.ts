import type { FieldHook } from "payload";

/** O nome sem acentos, sem espaços e em minúsculas. */
export function aSlug(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * O slug de uma etiqueta sai do nome, e não de quem a escreve.
 *
 * Duas etiquetas com nomes diferentes podem dar o mesmo slug — «Análise» e
 * «Analise», por exemplo — e o slug é único na base. Em vez de rebentar com um
 * erro que ninguém percebe a meio de escrever um artigo, procura-se o primeiro
 * número livre: `analise`, `analise-2`, `analise-3`.
 *
 * Um slug que já esteja gravado não muda: mudá-lo partiria o endereço no dia em
 * que a pesquisa do blog o usar, e uma etiqueta renomeada continua a ser a
 * mesma etiqueta.
 */
export const slugDaEtiqueta: FieldHook = async ({ data, originalDoc, req, value }) => {
  const gravado = String(originalDoc?.slug ?? "").trim();
  if (gravado) return gravado;

  const base = aSlug(String(value ?? "").trim() || String(data?.titlePt ?? ""));
  if (!base) return value;

  for (let numero = 1; numero < 50; numero += 1) {
    const tentativa = numero === 1 ? base : `${base}-${numero}`;
    const { totalDocs } = await req.payload.count({
      collection: "tags",
      where: { slug: { equals: tentativa } },
    });
    if (!totalDocs) return tentativa;
  }
  // Cinquenta homónimos é um problema de outra natureza; o carimbo desempata.
  return `${base}-${Date.now()}`;
};
