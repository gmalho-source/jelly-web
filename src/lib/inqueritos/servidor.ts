import { timingSafeEqual } from "node:crypto";
import type { Payload, Where } from "payload";
import { formularioDe, perguntasDe, type DocDaResposta, type DocDoInquerito } from "./forma";
import type { Origem } from "./tipos";

export { formularioDe, perguntasDe, type DocDaResposta, type DocDoInquerito };

/**
 * O que o servidor precisa de saber sobre inquéritos: como se lê um da base,
 * a que inquérito pertence uma chave, e que respostas entram numa tabela.
 */

const iguais = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export type DocDoLink = {
  id: number | string;
  inquerito?: number | string | DocDoInquerito | null;
  chave?: string | null;
  empresa?: string | null;
  nome?: string | null;
  pipedriveId?: number | null;
  pipedriveTitulo?: string | null;
  respondidoEm?: string | null;
  resposta?: number | string | { id: number | string } | null;
};

/**
 * O inquérito e, se for o caso, o link pessoal a que uma chave dá entrada.
 *
 * As chaves são aleatórias e longas; procura-se primeiro nos links pessoais e
 * depois nos inquéritos, e compara-se outra vez em tempo constante — a
 * procura na base não promete nada sobre isso.
 */
export async function porChave(payload: Payload, chave: string): Promise<{ inquerito: DocDoInquerito; link: DocDoLink | null } | null> {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(chave)) return null;

  const links = await payload.find({
    collection: "inqueritos-links",
    where: { chave: { equals: chave } },
    limit: 1,
    depth: 2,
    overrideAccess: true,
  });
  const link = links.docs[0] as unknown as DocDoLink | undefined;
  if (link?.chave && iguais(link.chave, chave) && link.inquerito && typeof link.inquerito === "object") {
    return { inquerito: link.inquerito as DocDoInquerito, link: { ...link, inquerito: (link.inquerito as DocDoInquerito).id } };
  }

  const inqueritos = await payload.find({
    collection: "inqueritos",
    where: { chave: { equals: chave } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
  });
  const inquerito = inqueritos.docs[0] as unknown as DocDoInquerito | undefined;
  if (inquerito?.chave && iguais(inquerito.chave, chave)) return { inquerito, link: null };
  return null;
}

/** Os filtros da tabela e dos resultados, lidos do endereço. */
export type Filtros = { de?: string; ate?: string; origem?: Origem | ""; estado?: "completa" | "incompleta" | "todas" };

export function filtrosDe(parametros: Record<string, string | string[] | undefined> | URLSearchParams | undefined): Filtros {
  const le = (nome: string) => {
    if (!parametros) return "";
    const valor = parametros instanceof URLSearchParams ? parametros.get(nome) : parametros[nome];
    return String(Array.isArray(valor) ? valor[0] : (valor ?? "")).trim();
  };
  const data = (valor: string) => (/^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : "");
  const origem = le("origem");
  const estado = le("estado");
  return {
    de: data(le("de")),
    ate: data(le("ate")),
    origem: ["geral", "pessoal", "equipa", "typeform"].includes(origem) ? (origem as Origem) : "",
    estado: estado === "incompleta" || estado === "todas" ? estado : "completa",
  };
}

/** As respostas de um inquérito, com os filtros, das mais recentes para as mais antigas. */
export async function respostasDe(payload: Payload, inqueritoId: number | string, filtros: Filtros): Promise<DocDaResposta[]> {
  const condicoes: Where[] = [{ inquerito: { equals: inqueritoId } }];
  if (filtros.estado !== "todas") condicoes.push({ estado: { equals: filtros.estado ?? "completa" } });
  if (filtros.origem) condicoes.push({ origem: { equals: filtros.origem } });
  // A data que conta é a de conclusão; numa incompleta, a do começo.
  const campo = filtros.estado === "completa" || !filtros.estado ? "concluidaEm" : "createdAt";
  if (filtros.de) condicoes.push({ [campo]: { greater_than_equal: `${filtros.de}T00:00:00.000Z` } });
  if (filtros.ate) condicoes.push({ [campo]: { less_than_equal: `${filtros.ate}T23:59:59.999Z` } });

  const todas: DocDaResposta[] = [];
  // Às páginas de quinhentas: um inquérito com anos de Typeform não pode vir
  // numa só consulta sem limite, nem ficar cortado num limite qualquer.
  for (let pagina = 1; pagina < 100; pagina += 1) {
    const lote = await payload.find({
      collection: "inqueritos-respostas",
      where: { and: condicoes },
      sort: "-concluidaEm",
      limit: 500,
      page: pagina,
      depth: 1,
      overrideAccess: true,
    });
    todas.push(...(lote.docs as unknown as DocDaResposta[]));
    if (!lote.hasNextPage) break;
  }
  return todas;
}

/** A data de uma resposta, para mostrar: a de conclusão, ou a do começo. */
export const dataDe = (resposta: DocDaResposta) => resposta.concluidaEm ?? resposta.iniciadaEm ?? resposta.createdAt ?? null;
