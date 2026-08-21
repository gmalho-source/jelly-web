import { env, envOr } from "../src/lib/env";

/**
 * Configuração do Sanity, partilhada pelo Studio e pelo site.
 * Enquanto NEXT_PUBLIC_SANITY_PROJECT_ID estiver vazio, o site lê o conteúdo
 * local versionado em src/content — não há passo intermédio a manter.
 */
export const projectId = env(process.env.NEXT_PUBLIC_SANITY_PROJECT_ID) ?? "";
export const dataset = envOr(process.env.NEXT_PUBLIC_SANITY_DATASET, "production");
/** Fixa a data para o contrato da API não mudar debaixo dos pés. */
export const apiVersion = envOr(process.env.NEXT_PUBLIC_SANITY_API_VERSION, "2026-08-01");

export const configured = Boolean(projectId);
