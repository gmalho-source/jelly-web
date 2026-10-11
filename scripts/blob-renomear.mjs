// Dá nomes impossíveis de adivinhar aos ficheiros pessoais que já estão no Blob
// (CV, briefings, documentos para assinar). Ver o comentário em
// payload.config.ts: o armazenamento é público, e o nome era a única fechadura.
//
// Três passos, com SQL à mão pelo meio — este script nunca escreve na base de
// dados, só lê:
//
//   1. SQL scripts/sql/2026-10-11-blob-nomes-1.sql  → cria a tabela
//      `blob_renomear` com o nome novo de cada ficheiro (um sufixo aleatório).
//   2. node scripts/blob-renomear.mjs copiar        → copia cada ficheiro para o
//      nome novo. O antigo fica: até ao passo 3 é ele que o site lê.
//   3. SQL scripts/sql/2026-10-11-blob-nomes-2.sql  → as fichas passam a
//      apontar para o nome novo.
//   4. node scripts/blob-renomear.mjs apagar        → apaga o ficheiro antigo,
//      só onde a ficha já aponta para o novo e o novo existe. Onde a ficha não
//      mudou (foi trocada ou apagada entretanto), apaga a cópia e deixa o resto.
//   5. SQL scripts/sql/2026-10-11-blob-nomes-3.sql  → apaga a tabela.
//
//   node scripts/blob-renomear.mjs ver              → só conta, não mexe.
//
// Precisa de DATABASE_URL e BLOB_READ_WRITE_TOKEN. Não escreve nomes de
// ficheiros no ecrã: têm nomes de pessoas, e os novos são a fechadura.
import { copy, del, head } from "@vercel/blob";

const passo = process.argv[2];
const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
const base = process.env.DATABASE_URL?.trim();
if (!["ver", "copiar", "apagar"].includes(passo) || !token || !base) {
  console.error("Uso: node scripts/blob-renomear.mjs ver|copiar|apagar (com DATABASE_URL e BLOB_READ_WRITE_TOKEN)");
  process.exit(1);
}

const TABELAS = ["documents", "attachments", "assinaturas_ficheiros"];

/** Em local, Postgres por TCP; na Neon, pelo WebSocket (a porta 5432 nem sempre passa). */
async function liga() {
  if (/@(localhost|127\.0\.0\.1)[:/]/.test(base)) {
    const { default: pg } = await import("pg");
    const cliente = new pg.Client({ connectionString: base });
    await cliente.connect();
    return cliente;
  }
  const { Client, neonConfig } = await import("@neondatabase/serverless");
  const { default: ws } = await import("ws");
  neonConfig.webSocketConstructor = ws;
  const cliente = new Client(base);
  await cliente.connect();
  return cliente;
}

const existe = async (pathname) => {
  try {
    return await head(pathname, { token });
  } catch (erro) {
    if (erro?.constructor?.name === "BlobNotFoundError") return null;
    throw erro;
  }
};

/** Vários de cada vez, sem afogar a API. */
async function emLotes(itens, fazer, lote = 8) {
  for (let i = 0; i < itens.length; i += lote) await Promise.all(itens.slice(i, i + lote).map(fazer));
}

const db = await liga();
let linhas;
try {
  await db.query("begin read only");
  const partes = TABELAS.map(
    (tabela) =>
      `select r.tabela, r.id, r.antigo, r.novo, t.filename as atual from blob_renomear r left join ${tabela} t on t.id = r.id where r.tabela = '${tabela}'`,
  );
  linhas = (await db.query(partes.join(" union all "))).rows;
  await db.query("rollback");
} finally {
  await db.end();
}

const conta = {};
const soma = (chave) => (conta[chave] = (conta[chave] ?? 0) + 1);

if (passo === "ver") {
  await emLotes(linhas, async (l) => {
    const [antigo, novo] = await Promise.all([existe(l.antigo), existe(l.novo)]);
    soma(`ficha→${l.atual === l.novo ? "novo" : l.atual === l.antigo ? "antigo" : l.atual == null ? "apagada" : "outro"} · antigo ${antigo ? "existe" : "não"} · novo ${novo ? "existe" : "não"}`);
  });
}

if (passo === "copiar") {
  await emLotes(linhas, async (l) => {
    if (l.atual !== l.antigo) return soma("ficha mudou entretanto — não copiado");
    if (await existe(l.novo)) return soma("já copiado");
    const antigo = await existe(l.antigo);
    if (!antigo) return soma("ERRO: o antigo não existe no Blob");
    await copy(antigo.url, l.novo, { access: "public", token, addRandomSuffix: false, contentType: antigo.contentType });
    const novo = await existe(l.novo);
    soma(novo && novo.size === antigo.size ? "copiado" : "ERRO: cópia com tamanho diferente");
  });
}

if (passo === "apagar") {
  await emLotes(linhas, async (l) => {
    const novo = await existe(l.novo);
    if (l.atual === l.novo) {
      if (!novo) return soma("ERRO: a ficha aponta para o novo, que não existe — antigo mantido");
      if (await existe(l.antigo)) {
        await del(l.antigo, { token });
        return soma("antigo apagado");
      }
      return soma("antigo já não existia");
    }
    // A ficha não aponta para o nome novo: a cópia não serve a ninguém.
    if (novo) {
      await del(l.novo, { token });
      return soma("cópia sem uso apagada (ficha mudou ou foi apagada)");
    }
    soma("nada a fazer (ficha mudou ou foi apagada)");
  });
}

console.log(`${passo}: ${linhas.length} ficheiros na tabela`);
console.table(conta);
if (Object.keys(conta).some((k) => k.startsWith("ERRO"))) process.exitCode = 1;
