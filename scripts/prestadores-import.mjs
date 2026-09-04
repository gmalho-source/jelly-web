#!/usr/bin/env node
/**
 * Importa os prestadores do quadro do Monday para a coleção «Prestadores».
 *
 * A exportação do Monday é um Excel com três linhas de cabeçalho — o nome do
 * quadro, o grupo, e só depois os títulos das colunas — e traz a mesma pessoa
 * repetida quando está em mais de um grupo: 470 linhas para 303 emails. Por
 * isso a chave é o email, e das linhas repetidas fica a que tem mais campos
 * preenchidos; em caso de empate, a mais recente.
 *
 * Idempotente: quem já existe é atualizado, quem não existe é criado. Um campo
 * que a folha traz vazio não apaga o que já estava na ficha.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… npm run prestadores:import -- ficheiro.xlsx
 *   npm run prestadores:import -- ficheiro.xlsx --dry-run
 */
import ExcelJS from "exceljs";
import { getPayload } from "payload";
import config from "../payload.config.ts";

const args = process.argv.slice(2);
const ficheiro = args.find((a) => !a.startsWith("--"));
const ensaio = args.includes("--dry-run");
if (!ficheiro) {
  console.error("uso: npm run prestadores:import -- <exportação.xlsx> [--dry-run]");
  process.exit(2);
}

const texto = (v) => {
  if (v == null) return undefined;
  if (typeof v === "object" && "richText" in v) v = v.richText.map((r) => r.text).join("");
  if (typeof v === "object" && "text" in v) v = v.text;
  if (v instanceof Date) return v.toISOString();
  const s = String(v).trim();
  return s ? s : undefined;
};
const numero = (v) => {
  const s = texto(v);
  if (s === undefined) return undefined;
  const n = Number(String(s).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
};
const data = (v) => {
  if (v instanceof Date) return v.toISOString();
  const s = texto(v);
  if (!s) return undefined;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
};

// Os valores do Monday, para os valores da coleção.
const ESTADO = { qualified: "qualificado", disqualified: "desqualificado", parado: "parado" };
const POOL = { design: "design", development: "development", marketing: "marketing", multimedia: "multimedia", video: "video" };
const TIPO = { "pessoa singular": "singular", empresa: "empresa" };
const REGIME = { iva: "iva", isento: "isento", "retenção na fonte": "retencao", "retencao na fonte": "retencao" };
const CIVIL = { solteiro: "solteiro", solteira: "solteiro", casado: "casado", casada: "casado", "união de facto": "uniao", divorciado: "divorciado", divorciada: "divorciado", viúvo: "viuvo", viúva: "viuvo" };
const mapa = (tabela, v) => (v ? tabela[texto(v).toLowerCase()] : undefined);

const livro = new ExcelJS.Workbook();
await livro.xlsx.readFile(ficheiro);
const folha = livro.worksheets[0];

// A linha de cabeçalho é a primeira com «E-mail».
let cabecalho = null;
folha.eachRow((row, n) => {
  if (cabecalho) return;
  const valores = row.values.map((v) => texto(v)?.toLowerCase());
  if (valores.includes("e-mail") || valores.includes("email")) cabecalho = { n, valores };
});
if (!cabecalho) {
  console.error("não encontrei a linha de cabeçalho (com «E-mail»)");
  process.exit(2);
}
const col = (nome) => cabecalho.valores.findIndex((v) => v === nome.toLowerCase());
const C = {
  nome: col("Name"), estado: col("Status"), pool: col("Pool"), email: col("E-mail"), iban: col("IBAN"), nif: col("NIF"),
  telefone: col("Telefone"), rate: col("Rate Hora"), nascimento: col("Data Nascimento"), nacionalidade: col("Nacionalidade"),
  morada: col("Morada"), documento: cabecalho.valores.findIndex((v) => v?.startsWith("cartão de cidadão")),
  ss: col("Segurança Social"), civil: col("Estado Civil"), dependentes: cabecalho.valores.findIndex((v) => v?.startsWith("nº dependentes")),
  regime: col("Regime Fiscal"), tipo: col("Single select"), notificacao: col("Email Notificação"), criado: col("Criado em"),
  mondayId: cabecalho.valores.findIndex((v) => v?.startsWith("item id")),
};

// Um email tem de ser um email: o campo da coleção recusa o que não for, e uma
// linha recusada a meio parava a importação toda. O que não passa fica de fora
// e aparece no relatório, pelo nome — para se corrigir no Monday, não aqui.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const emailValido = (v) => {
  const s = texto(v)?.toLowerCase();
  return s && EMAIL.test(s) ? s : undefined;
};
const rejeitados = [];

const porEmail = new Map();
folha.eachRow((row, n) => {
  if (n <= cabecalho.n) return;
  const v = (i) => (i >= 0 ? row.values[i] : undefined);
  const bruto = texto(v(C.email));
  if (!bruto) return;
  const email = emailValido(bruto);
  if (!email) {
    rejeitados.push(`${texto(v(C.nome)) ?? "(sem nome)"} — email com ${bruto.length} caracteres, não é um endereço`);
    return;
  }
  const ficha = {
    nome: texto(v(C.nome)) ?? email,
    email,
    estado: mapa(ESTADO, v(C.estado)) ?? "qualificado",
    pool: mapa(POOL, v(C.pool)),
    tipo: mapa(TIPO, v(C.tipo)),
    emailNotificacao: emailValido(v(C.notificacao)),
    rateHora: numero(v(C.rate)),
    nif: texto(v(C.nif)),
    iban: texto(v(C.iban))?.replace(/\s+/g, ""),
    regimeFiscal: mapa(REGIME, v(C.regime)),
    telefone: texto(v(C.telefone)),
    morada: texto(v(C.morada)),
    nacionalidade: texto(v(C.nacionalidade)),
    dataNascimento: data(v(C.nascimento)),
    documento: texto(v(C.documento)),
    segurancaSocial: texto(v(C.ss)),
    estadoCivil: mapa(CIVIL, v(C.civil)),
    dependentes: numero(v(C.dependentes)),
    mondayId: texto(v(C.mondayId)),
  };
  const criado = data(v(C.criado)) ?? "";
  const cheios = Object.values(ficha).filter((x) => x !== undefined).length;
  const anterior = porEmail.get(email);
  // Fica a linha com mais campos; em empate, a mais recente.
  if (!anterior || cheios > anterior.cheios || (cheios === anterior.cheios && criado > anterior.criado)) {
    // E um «qualificado» numa linha repetida não é apagado por um vazio noutra.
    porEmail.set(email, { ficha, cheios, criado });
  }
});

const fichas = [...porEmail.values()].map((x) => x.ficha);
console.log(`${folha.rowCount - cabecalho.n} linhas → ${fichas.length} prestadores (chave: email)`);
const contagem = fichas.reduce((a, f) => ((a[f.estado] = (a[f.estado] ?? 0) + 1), a), {});
console.log("por estado:", contagem);
if (rejeitados.length) {
  console.log(`\n${rejeitados.length} linha(s) fora, por email inválido — corrigir no Monday:`);
  for (const r of rejeitados) console.log("  ", r);
}

if (ensaio) {
  console.log("\n--dry-run: nada gravado. Três exemplos, sem dados sensíveis:");
  for (const f of fichas.slice(0, 3)) console.log(`  ${f.nome} · ${f.estado} · ${f.pool ?? "—"} · ${f.tipo ?? "—"} · campos: ${Object.values(f).filter((x) => x !== undefined).length}`);
  process.exit(0);
}

const payload = await getPayload({ config });
let criados = 0, atualizados = 0;
for (const ficha of fichas) {
  const limpa = Object.fromEntries(Object.entries(ficha).filter(([, v]) => v !== undefined));
  const { docs } = await payload.find({ collection: "prestadores", where: { email: { equals: ficha.email } }, limit: 1, overrideAccess: true });
  if (docs[0]) {
    await payload.update({ collection: "prestadores", id: docs[0].id, data: limpa, overrideAccess: true });
    atualizados += 1;
  } else {
    await payload.create({ collection: "prestadores", data: limpa, overrideAccess: true });
    criados += 1;
  }
}
console.log(`\ncriados ${criados} · atualizados ${atualizados}`);
process.exit(0);
