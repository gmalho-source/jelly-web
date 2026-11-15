import { cache } from "react";
import { getPayload, type Payload } from "payload";
import config from "@payload-config";
import { payloadConfigured } from "./configured";

/** Sem base de dados, o site serve o conteúdo local do repositório. */
export { payloadConfigured };

/**
 * Instância local do Payload. Não passa pela rede: corre no mesmo processo do
 * site e fala diretamente com a Postgres — é a vantagem de ter o CMS dentro da
 * aplicação em vez de atrás de uma API.
 */
export const getCms = cache(async (): Promise<Payload | null> => (payloadConfigured ? getPayload({ config }) : null));

/** Quanto se espera antes da segunda tentativa: o tempo de uma base acordar. */
const ESPERA_MS = 1500;

/**
 * Lê do CMS. Uma coleção vazia é quase sempre uma migração a meio, e cai no
 * conteúdo local do repositório.
 *
 * Uma leitura que falha tem uma segunda tentativa. Se falhar outra vez, o que
 * acontece depende de onde corre:
 *
 * - **Na Vercel, dá erro.** Antes caía no conteúdo local, e esse conteúdo ficava
 *   guardado no cache como se fosse o do painel, até alguém publicar alguma
 *   coisa. A 15/11 foi isso: uma falha de segundos pôs a página de projetos a
 *   servir as capas do WordPress antigo, que já não existem, e ficou assim. Um
 *   erro não fica no cache; uma página que falha ao ser refeita continua a
 *   servir a última versão boa; e uma compilação que falha deixa no ar o
 *   deploy anterior em vez de publicar um site com conteúdo velho.
 * - **Fora dela** (a desenvolver, sem base ou com ela em baixo), continua a cair
 *   no conteúdo local, para o site se poder ver na mesma.
 */
export async function fromCms<T>(load: (payload: Payload) => Promise<T[]>, fallback: T[]): Promise<T[]> {
  try {
    // A ligação está dentro do `try` e não antes dele: uma base de dados que
    // não atende tem de passar pela mesma regra que uma leitura que falha.
    const payload = await getCms();
    if (!payload) return fallback;
    let rows: T[];
    try {
      rows = await load(payload);
    } catch (primeira) {
      console.warn("[payload] leitura falhou, a tentar outra vez:", primeira instanceof Error ? primeira.message : primeira);
      await new Promise((resolve) => setTimeout(resolve, ESPERA_MS));
      rows = await load(payload);
    }
    return rows.length ? rows : fallback;
  } catch (error) {
    if (process.env.VERCEL) {
      console.error("[payload] leitura falhou duas vezes; sem conteúdo local na Vercel:", error);
      throw error;
    }
    console.error("[payload] leitura falhou, a usar conteúdo local:", error);
    return fallback;
  }
}
