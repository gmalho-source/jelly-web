import { env } from "@/lib/env";

/**
 * Há base de dados configurada?
 *
 * Vive sozinha, e não dentro do `client.ts`, por uma razão concreta. O
 * `client.ts` importa a configuração do Payload, que é um módulo assíncrono: o
 * empacotador põe a espera por ela **antes** do corpo do módulo, e por isso
 * qualquer constante declarada lá dentro só existe depois dessa espera acabar.
 * Quem lesse esta constante enquanto a configuração ainda carregava apanhava
 * `Cannot access 'h' before initialization` — um 500 em toda a rota que entrasse
 * pelo leitor do CMS em execução, que foi o que fechou a área de faturação.
 *
 * Aqui não há espera nenhuma: é uma variável de ambiente e mais nada. Quem a lê
 * lê-a sempre pronta, venha de onde vier e na ordem que vier.
 */
export const payloadConfigured = Boolean(env(process.env.DATABASE_URL));
