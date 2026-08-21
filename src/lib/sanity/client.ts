import { createClient, type SanityClient } from "@sanity/client";
import { apiVersion, configured, dataset, projectId } from "../../../sanity/env";

/**
 * Cliente de leitura. Só existe quando o projeto está configurado — o site
 * continua a funcionar com o conteúdo local enquanto não estiver.
 */
export const sanity: SanityClient | null = configured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      // CDN para leituras publicadas; o token só entra em pré-visualização.
      useCdn: !process.env.SANITY_API_READ_TOKEN,
      token: process.env.SANITY_API_READ_TOKEN,
      perspective: "published",
    })
  : null;

/** Segundos de vida de uma resposta em cache. Um webhook do Sanity revalida antes. */
const REVALIDATE = 300;

export async function query<T>(groq: string, params: Record<string, unknown> = {}, fallback: T): Promise<T> {
  if (!sanity) return fallback;
  try {
    return await sanity.fetch<T>(groq, params, { next: { revalidate: REVALIDATE } });
  } catch (error) {
    // Uma falha do CMS não pode deixar o site em branco: cai no conteúdo local.
    console.error("[sanity] consulta falhou, a usar conteúdo local:", error);
    return fallback;
  }
}
