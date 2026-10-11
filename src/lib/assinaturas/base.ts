import { randomBytes } from "node:crypto";
import { sql } from "@payloadcms/db-postgres";
import type { Payload } from "payload";

/**
 * Gravações que não podem passar pela API do Payload.
 *
 * O Payload grava uma lista (os signatários, o histórico) inteira de cada vez.
 * Dois representantes a assinar no mesmo segundo leram a mesma lista, cada um
 * mudou a sua linha e gravou a lista toda — e a segunda gravação apagou a
 * primeira. Aconteceu no teste: os dois viram «assinado», e só um ficou.
 *
 * Por isso a linha de cada signatário muda sozinha, numa instrução só, e o
 * histórico acrescenta-se sem reescrever o que lá está. As tabelas e colunas
 * são as que o Payload cria para a coleção `assinaturas`.
 */
type Drizzle = { execute: (consulta: unknown) => Promise<{ rows: Record<string, unknown>[] }> };
const db = (payload: Payload) => (payload.db as unknown as { drizzle: Drizzle }).drizzle;

const COLUNAS = {
  estado: "estado",
  assinadoEm: "assinado_em",
  enviadoEm: "enviado_em",
  vistoEm: "visto_em",
  codigoVerificadoEm: "codigo_verificado_em",
  nomeEscrito: "nome_escrito",
  ip: "ip",
  navegador: "navegador",
  codigoHash: "codigo_hash",
  codigoExpira: "codigo_expira",
  codigoTentativas: "codigo_tentativas",
  codigoEnviadoEm: "codigo_enviado_em",
} as const;

export type CamposDaLinha = Partial<Record<keyof typeof COLUNAS, string | number | null>>;

/**
 * Muda a linha de um signatário. Com `soSePendente`, só muda se ainda não
 * assinou — é o que impede a mesma assinatura de entrar duas vezes. Devolve se
 * mudou alguma coisa.
 */
export async function gravaLinha(payload: Payload, linhaId: string, campos: CamposDaLinha, { soSePendente = false } = {}): Promise<boolean> {
  const partes = Object.entries(campos).map(([chave, valor]) => sql`${sql.identifier(COLUNAS[chave as keyof typeof COLUNAS])} = ${valor}`);
  if (!partes.length) return false;
  const condicao = soSePendente ? sql` and estado is distinct from 'assinado'` : sql``;
  const resultado = await db(payload).execute(
    sql`update assinaturas_signatarios set ${sql.join(partes, sql`, `)} where id = ${linhaId}${condicao} returning id`,
  );
  return resultado.rows.length > 0;
}

/** Uma tentativa errada a mais, sem ler antes: duas ao mesmo tempo contam duas. */
export async function contaTentativa(payload: Payload, linhaId: string) {
  await db(payload).execute(
    sql`update assinaturas_signatarios set codigo_tentativas = coalesce(codigo_tentativas, 0) + 1 where id = ${linhaId}`,
  );
}

/** A primeira vez que o documento foi aberto. As seguintes não mexem. */
export async function marcaVisto(payload: Payload, linhaId: string): Promise<boolean> {
  const resultado = await db(payload).execute(
    sql`update assinaturas_signatarios set visto_em = ${new Date().toISOString()} where id = ${linhaId} and visto_em is null returning id`,
  );
  return resultado.rows.length > 0;
}

/** Acrescenta uma linha ao histórico do pedido. */
export async function regista(payload: Payload, pedido: string | number, evento: string, detalhe?: string | null) {
  await db(payload).execute(sql`
    insert into assinaturas_registo (_order, _parent_id, id, quando, evento, detalhe)
    select coalesce(max(_order), 0) + 1, ${Number(pedido)}, ${randomBytes(12).toString("hex")}, ${new Date().toISOString()}, ${evento}, ${detalhe ?? null}
    from assinaturas_registo where _parent_id = ${Number(pedido)}`);
}

/** Quantos signatários ainda não assinaram. */
export async function porAssinar(payload: Payload, pedido: string | number): Promise<number> {
  const resultado = await db(payload).execute(
    sql`select count(*)::int as n from assinaturas_signatarios where _parent_id = ${Number(pedido)} and estado is distinct from 'assinado'`,
  );
  return Number(resultado.rows[0]?.n ?? 0);
}

/**
 * Fica com o fecho do pedido: passa de «enviado» a «concluído» numa instrução
 * só. Se dois signatários acabarem ao mesmo tempo, só um fecha — o outro
 * recebe `false` e não gera um segundo PDF nem manda emails repetidos.
 */
export async function ficaComOFecho(payload: Payload, pedido: string | number, momento: string): Promise<boolean> {
  const resultado = await db(payload).execute(
    sql`update assinaturas set estado = 'concluido', concluido_em = ${momento} where id = ${Number(pedido)} and estado = 'enviado' returning id`,
  );
  return resultado.rows.length > 0;
}

/** Se o fecho falhar a meio, o pedido volta a «enviado» para se poder repetir. */
export async function largaOFecho(payload: Payload, pedido: string | number) {
  await db(payload).execute(sql`update assinaturas set estado = 'enviado', concluido_em = null where id = ${Number(pedido)} and hash_final is null`);
}
