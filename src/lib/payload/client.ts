import { cache } from "react";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { env } from "@/lib/env";

/** Sem base de dados, o site serve o conteúdo local do repositório. */
export const payloadConfigured = Boolean(env(process.env.DATABASE_URL));

/**
 * Instância local do Payload. Não passa pela rede: corre no mesmo processo do
 * site e fala diretamente com a Postgres — é a vantagem de ter o CMS dentro da
 * aplicação em vez de atrás de uma API.
 */
export const getCms = cache(async (): Promise<Payload | null> => (payloadConfigured ? getPayload({ config }) : null));

/**
 * Uma falha do CMS não pode deixar o site em branco, e uma coleção vazia é
 * quase sempre uma migração a meio: nos dois casos cai no conteúdo local.
 */
export async function fromCms<T>(load: (payload: Payload) => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    // A ligação está dentro do `try` e não antes dele. Estava antes, e por isso
    // a promessa deste comentário não se cumpria no caso que mais importa: uma
    // base de dados que não atende não dava conteúdo local, dava exceção — e
    // durante a compilação isso é uma compilação falhada, não uma página com o
    // conteúdo do repositório. Aconteceu aqui, com a Postgres local em baixo.
    const payload = await getCms();
    if (!payload) return fallback;
    const rows = await load(payload);
    return rows.length ? rows : fallback;
  } catch (error) {
    console.error("[payload] leitura falhou, a usar conteúdo local:", error);
    return fallback;
  }
}
