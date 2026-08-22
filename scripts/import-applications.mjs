#!/usr/bin/env node
/**
 * Importa as candidaturas exportadas do Gravity Forms para o sistema novo.
 *
 * O que decide o que entra: a data. Ficou combinado guardar candidaturas doze
 * meses, e importar treze anos de dados pessoais para dentro de um sistema vivo
 * seria criar hoje um problema que a regra existe para evitar. Por isso as
 * recentes entram, e as antigas saem num ficheiro à parte, para quem manda
 * decidir o que lhes fazer.
 *
 * O que não entra: morada e código postal (a cidade basta), o IP, o agente do
 * browser e os campos de pagamento do formulário. O género entra, porque serve
 * para tratar uma pessoa por «caro» ou «cara» — mas deixa de se perguntar.
 *
 *   node scripts/import-applications.mjs --dir=… --desde=2025-08-01 --dry-run
 *   node scripts/import-applications.mjs --dir=… --desde=2025-08-01
 *
 * Idempotente: cada candidatura leva o id do registo antigo, e uma que já esteja
 * lá não entra outra vez.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { getPayload } from "payload";
import config from "../payload.config.ts";

const args = process.argv.slice(2);
const seco = args.includes("--dry-run");
const semFicheiros = args.includes("--sem-ficheiros");
const valor = (nome) => args.find((a) => a.startsWith(`--${nome}=`))?.split("=")[1];
const pasta = valor("dir");
const desde = valor("desde") ?? "1970-01-01";
const limite = Number(valor("limit") ?? 0) || Infinity;

if (!pasta) {
  console.error("uso: node scripts/import-applications.mjs --dir=<pasta com os csv> [--desde=2025-08-01]");
  process.exit(2);
}

/** Departamentos, como o formulário antigo os nomeia. */
const DEPARTAMENTOS = [
  ["marketing", "Marketing", "Marketing"],
  ["design", "Design", "Design"],
  ["development", "Development", "Development"],
  ["performance", "Performance", "Performance"],
  ["multimedia", "Multimédia", "Multimedia"],
  ["comercial", "Comercial", "Sales"],
  ["suporte", "Suporte", "Support"],
  ["outra", "Outra", "Other"],
];

/** As vagas antigas, pelo endereço de onde a candidatura veio. */
const VAGAS = {
  "seo-specialist": ["SEO Specialist", "marketing"],
  "social-media-manager": ["Social Media Manager", "marketing"],
  "account-marketing-manager": ["Account Marketing Manager", "marketing"],
  "gestor-de-ppc": ["Gestor(a) de PPC", "performance"],
  "gestor-de-ppc-e-commerce-freelancer": ["Gestor(a) de PPC para e-commerce", "performance"],
  "copywriter-freelancer-part-time": ["Copywriter", "marketing"],
  "marketing-social-media-assistant-estagio-profissional-iefp": ["Marketing & Social Media Assistant (estágio)", "marketing"],
  "designer-senior-multidisciplinar": ["Designer Sénior Multidisciplinar", "design"],
  "designer-de-branding": ["Designer de Branding", "design"],
  "video-editor-e-motion-designer": ["Video Editor e Motion Designer", "multimedia"],
};

/** Colunas que não passam: técnicas, ou dados que não queremos guardar. */
const FORA = new Set([
  "Name (Prefixo)", "Name (First)", "Name (Middle)", "Name (Last)", "Name (Sufixo)",
  "Email", "Número de Telefone", "Data Nascimento", "Género", "Função",
  "Morada (Street Address)", "Morada (Address Line 2)", "Morada (City)",
  "Morada (State / Province)", "Morada (Zip / Postal Code)", "Morada (Country)",
  "Linkedin", "Enviar CV", "Carta de Motivação",
  "Consentimento (Consentimento)", "Consentimento (Texto)", "Consentimento (Descrição)",
  "Subscrever as nossas comunicações? (Consentimento)",
  "Subscrever as nossas comunicações? (Texto)",
  "Subscrever as nossas comunicações? (Descrição)",
  "Criado por (ID do utilizador)", "ID do Registo", "Data do Registo", "Data de actualização",
  "URL de origem", "ID da transação", "Valor do pagamento", "Data de pagamento",
  "Estado do pagamento", "ID do artigo", "Agente do utilizador", "IP do utilizador",
  "Velocidade de envio (ms)",
  ...DEPARTAMENTOS.map(([, nome]) => nome.toUpperCase()),
  "MULTIMEDIA", "DEVELOPMENT",
]);

const limpa = (valor = "") => String(valor).replace(/\s+/g, " ").trim();
const slug = (texto) =>
  texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const payload = await getPayload({ config });

/** Cria se não existir, e devolve o id. */
async function garante(colecao, where, data) {
  const encontrado = await payload.find({ collection: colecao, where, limit: 1, depth: 0 });
  if (encontrado.docs.length) return encontrado.docs[0].id;
  if (seco) return `(novo:${colecao})`;
  const criado = await payload.create({ collection: colecao, data });
  return criado.id;
}

const departamentos = {};
for (const [chave, pt, en] of DEPARTAMENTOS) {
  departamentos[chave] = await garante("departments", { slug: { equals: chave } }, { namePt: pt, nameEn: en, slug: chave });
}

/** Carrega um ficheiro do site antigo e guarda-o como documento. */
async function documento(url, nome) {
  if (!url || semFicheiros || seco) return undefined;
  try {
    const resposta = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 Chrome/141 Safari/537.36" } });
    if (!resposta.ok) throw new Error(`respondeu ${resposta.status}`);
    const data = Buffer.from(await resposta.arrayBuffer());
    if (data.byteLength > 8_000_000) throw new Error(`${Math.round(data.byteLength / 1024 / 1024)} MB, grande demais`);
    const ficheiro = decodeURIComponent(path.basename(new URL(url).pathname));
    const tipos = { pdf: "application/pdf", doc: "application/msword", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ppt: "application/vnd.ms-powerpoint", pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
    const extensao = path.extname(ficheiro).slice(1).toLowerCase();
    const criado = await payload.create({
      collection: "documents",
      data: { note: nome },
      file: { name: ficheiro, data, mimetype: tipos[extensao] ?? "application/pdf", size: data.byteLength },
    });
    return criado.id;
  } catch (erro) {
    console.log(`    ! ${nome}: ${erro.message}`);
    return undefined;
  }
}

const ficheiros = fs.readdirSync(pasta).filter((nome) => nome.endsWith(".csv"));
const antigas = [];
let entraram = 0;
let repetidas = 0;
let vazias = 0;

for (const nome of ficheiros) {
  const texto = fs.readFileSync(path.join(pasta, nome), "utf8");
  const linhas = parse(texto, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true });
  if (!linhas.length) {
    vazias += 1;
    console.log(`— ${nome}: sem candidaturas`);
    continue;
  }

  console.log(`\n=== ${nome}: ${linhas.length} candidaturas`);

  for (const linha of linhas) {
    if (entraram >= limite) break;

    const data = limpa(linha["Data do Registo"]);
    const email = limpa(linha.Email).toLowerCase();
    if (!email) continue;

    // O id do registo antigo repete-se entre formulários: junta-se o ficheiro.
    const legacyId = `${slug(nome.replace(/\.csv$/, ""))}#${limpa(linha["ID do Registo"]) || createHash("sha1").update(`${email}${data}`).digest("hex").slice(0, 10)}`;

    if (data < desde) {
      antigas.push({ ficheiro: nome, ...linha });
      continue;
    }

    const jaLa = await payload.find({ collection: "applications", where: { legacyId: { equals: legacyId } }, limit: 1, depth: 0 });
    if (jaLa.docs.length) {
      repetidas += 1;
      continue;
    }

    const origem = limpa(linha["URL de origem"]).split("?")[0].replace(/\/$/, "");
    const vagaSlug = origem.includes("/recrutamento/") ? origem.split("/recrutamento/")[1] : "";
    const vaga = VAGAS[vagaSlug];

    let vagaId;
    let funcaoId;
    if (vaga) {
      const [titulo, departamento] = vaga;
      funcaoId = await garante(
        "job-functions",
        { slug: { equals: slug(titulo) } },
        { namePt: titulo, slug: slug(titulo), department: departamentos[departamento] },
      );
      vagaId = await garante(
        "jobs",
        { slug: { equals: vagaSlug } },
        {
          titlePt: titulo,
          slug: vagaSlug,
          function: funcaoId,
          status: "fechada",
          legacyPath: `/recrutamento/${vagaSlug}/`,
        },
      );
    }

    // Nas espontâneas o departamento vem das colunas que a pessoa marcou.
    const marcados = DEPARTAMENTOS.map(([chave, nome]) => (limpa(linha[nome.toUpperCase()]) ? departamentos[chave] : null)).filter(Boolean);

    const respostas = Object.entries(linha)
      .filter(([pergunta, resposta]) => !FORA.has(pergunta) && limpa(resposta))
      .map(([pergunta, resposta]) => ({ question: limpa(pergunta), answer: limpa(resposta).slice(0, 4000) }));

    const nomeCompleto = [linha["Name (First)"], linha["Name (Middle)"], linha["Name (Last)"]].map(limpa).filter(Boolean).join(" ");
    const genero = { Feminino: "feminino", Masculino: "masculino" }[limpa(linha["Género"])] ?? undefined;

    if (seco) {
      entraram += 1;
      if (entraram <= 5) console.log(`  · ${nomeCompleto} <${email}> ${vagaSlug || "espontânea"} ${data}`);
      continue;
    }

    const doze = new Date(data.replace(" ", "T") + "Z");
    doze.setMonth(doze.getMonth() + 12);

    const cv = await documento(limpa(linha["Enviar CV"]), `CV de ${nomeCompleto}`);
    const carta = await documento(limpa(linha["Carta de Motivação"]), `Carta de ${nomeCompleto}`);

    await payload.create({
      collection: "applications",
      data: {
        legacyId,
        name: nomeCompleto || email,
        email,
        phone: limpa(linha["Número de Telefone"]) || undefined,
        city: limpa(linha["Morada (City)"]) || undefined,
        country: limpa(linha["Morada (Country)"]) || "Portugal",
        gender: genero,
        linkedin: limpa(linha["Linkedin"]) || undefined,
        job: vagaId,
        function: funcaoId,
        department: marcados.length ? marcados : undefined,
        cv,
        letter: carta,
        answers: respostas,
        status: "nova",
        source: `site antigo · ${nome}`,
        newsletterOptIn: limpa(linha["Subscrever as nossas comunicações? (Consentimento)"]) === "Seleccionado",
        consentAt: new Date(data.replace(" ", "T") + "Z").toISOString(),
        retentionUntil: doze.toISOString(),
      },
    });

    entraram += 1;
    if (entraram % 25 === 0) console.log(`  ${entraram} importadas…`);
  }
}

console.log(`\n${entraram} candidaturas importadas${seco ? " (ensaio)" : ""}`);
console.log(`${repetidas} já estavam lá | ${antigas.length} anteriores a ${desde} | ${vazias} ficheiros vazios`);

if (antigas.length) {
  // Fora do repositório, de propósito: são dados pessoais e não têm nada que
  // andar no controlo de versões. Ficam ao lado dos ficheiros de origem.
  const saida = path.join(pasta, `candidaturas-anteriores-a-${desde}.csv`);
  const colunas = [...new Set(antigas.flatMap((linha) => Object.keys(linha)))];
  const escapa = (valor) => `"${String(valor ?? "").replace(/"/g, '""')}"`;
  fs.writeFileSync(
    saida,
    [colunas.map(escapa).join(","), ...antigas.map((linha) => colunas.map((coluna) => escapa(linha[coluna])).join(","))].join("\n"),
  );
  console.log(`as anteriores ficaram em ${saida}`);
}

process.exit(0);
