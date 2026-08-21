import { createClient, type SanityClient } from "@sanity/client";
import { env } from "@/lib/env";
import { apiVersion, configured, dataset, projectId } from "../../../sanity/env";

/**
 * Cliente de leitura. Só existe quando o projeto está configurado — o site
 * continua a funcionar com o conteúdo local enquanto não estiver.
 */
/** Token só para ler rascunhos; vazio vale como ausente. */
const readToken = env(process.env.SANITY_API_READ_TOKEN);

export const sanity: SanityClient | null = configured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      // CDN para leituras publicadas; o token só entra em pré-visualização.
      useCdn: !readToken,
      token: readToken,
      perspective: "published",
    })
  : null;

/** Segundos de vida de uma resposta em cache. O webhook do Sanity revalida antes. */
const REVALIDATE = 300;
/** Etiqueta única do conteúdo: o webhook invalida-a e o site relê tudo. */
export const CMS_TAG = "cms";

export async function query<T>(groq: string, params: Record<string, unknown> = {}, fallback: T): Promise<T> {
  if (!sanity) return fallback;
  try {
    return await sanity.fetch<T>(groq, params, { next: { revalidate: REVALIDATE, tags: [CMS_TAG] } });
  } catch (error) {
    // Uma falha do CMS não pode deixar o site em branco: cai no conteúdo local.
    console.error("[sanity] consulta falhou, a usar conteúdo local:", error);
    return fallback;
  }
}
