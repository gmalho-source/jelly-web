#!/usr/bin/env node
/**
 * Corre um ficheiro de `scripts/sql/` contra a base de dados de `DATABASE_URL`.
 *
 * Os ficheiros daquela pasta são alterações de esquema escritas à mão, porque o
 * empurrão automático do Payload não serve para todas — há conversões que ele
 * emite sem `using`, e a Postgres recusa-as. Até aqui corriam-se colando o
 * ficheiro no editor da Neon, o que funciona e não deixa rasto de terem
 * corrido, nem ensaio antes de correr.
 *
 * Por omissão isto é um ensaio: abre uma transação, corre o ficheiro inteiro,
 * mostra o que ficou e desfaz tudo. Só com `--gravar` é que confirma. Um
 * ficheiro que não sobreviva ao ensaio não tem nada que ir à produção.
 *
 *   node scripts/run-sql.mjs scripts/sql/2026-09-20-paredes-de-logos.sql
 *   node scripts/run-sql.mjs scripts/sql/2026-09-20-paredes-de-logos.sql --gravar
 */
import { readFileSync } from "node:fs";
import { Client, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

const ficheiro = process.argv[2];
const gravar = process.argv.includes("--gravar");

if (!ficheiro) {
  console.error("Falta o ficheiro: node scripts/run-sql.mjs scripts/sql/<ficheiro>.sql [--gravar]");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Sem DATABASE_URL.");
  process.exit(1);
}

const client = new Client(url);
await client.connect();

try {
  await client.query("begin");
  await client.query(readFileSync(ficheiro, "utf8"));
  await client.query(gravar ? "commit" : "rollback");
  console.log(gravar ? `${ficheiro}: gravado.` : `${ficheiro}: corre sem erro. Nada foi gravado — falta --gravar.`);
} catch (erro) {
  await client.query("rollback").catch(() => {});
  console.error(`${ficheiro}: falhou, nada foi gravado.`);
  console.error(erro.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
