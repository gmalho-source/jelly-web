#!/usr/bin/env node
/**
 * Traduz os artigos de português para inglês com o Claude, escrevendo nos campos
 * ingleses que o painel já mostra ao lado dos portugueses. Fica tudo revisível:
 * a tradução é uma primeira versão, não uma publicação.
 *
 *   ANTHROPIC_API_KEY=… DATABASE_URL=… PAYLOAD_SECRET=… npm run translate -- --dry-run
 *   ANTHROPIC_API_KEY=… DATABASE_URL=… PAYLOAD_SECRET=… npm run translate -- --limit=5
 *
 * Opções: --dry-run, --limit=N, --slug=um-artigo, --force (retraduz o que já
 * tem inglês), --model=…, --concurrency=N.
 *
 * O corpo é Lexical, uma árvore. Não se pede ao modelo para devolver a árvore:
 * extraem-se as cadeias de texto pela ordem em que aparecem, traduzem-se em
 * bloco, e voltam ao mesmo lugar. A estrutura, os links e as marcas de negrito
 * sobrevivem intactos porque nunca saem daqui.
 */
import Anthropic from "@anthropic-ai/sdk";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split("=").slice(1).join("=");

const dryRun = flag("dry-run");
const force = flag("force");
const limit = Number(value("limit") ?? 0) || Infinity;
const onlySlug = value("slug");
const model = value("model") ?? "claude-opus-5";
const concurrency = Math.max(1, Number(value("concurrency") ?? 3));

// A chave pode vir com outro nome: nos ambientes da Claude Code na nuvem, uma
// variável chamada ANTHROPIC_API_KEY é retirada antes de a sessão nascer (as
// sessões autenticam-se pela conta, não por chave), e o script ficava sem ela.
const apiKey = (process.env.ANTHROPIC_API_KEY ?? process.env.JELLY_ANTHROPIC_API_KEY)?.trim();
if (!apiKey) {
  console.error("Falta ANTHROPIC_API_KEY (ou JELLY_ANTHROPIC_API_KEY). A chave cria-se em console.anthropic.com.");
  process.exit(1);
}

const claude = new Anthropic({ apiKey });

const SYSTEM = `Traduzes artigos de marketing digital de português europeu para inglês britânico.

Regras:
- Traduz o sentido, não as palavras: o texto tem de ler como se tivesse sido escrito em inglês.
- Mantém o tom directo e sem jargão de agência. Não acrescentas nem cortas ideias.
- Nomes de marcas, produtos, pessoas e ferramentas ficam como estão.
- Termos técnicos que a indústria usa em inglês ficam em inglês.
- Preserva a pontuação de citação e os símbolos (—, ·, %, €).
- Não traduzes texto que já esteja em inglês: devolve-o igual.`;

/** Recolhe as cadeias de texto de uma árvore Lexical, pela ordem do documento. */
function collect(node, out) {
  if (Array.isArray(node)) {
    for (const child of node) collect(child, out);
    return out;
  }
  if (!node || typeof node !== "object") return out;
  if (typeof node.text === "string" && node.text.trim()) out.push(node);
  if (node.children) collect(node.children, out);
  if (node.root) collect(node.root, out);
  return out;
}

/** Pede ao modelo um array de traduções com o mesmo comprimento do pedido. */
async function translateStrings(strings, hint) {
  if (!strings.length) return [];

  const ask = async (attempt) => {
    // Em streaming e com tecto alto: um artigo longo passava dos 16 mil tokens
    // de saída e o JSON vinha cortado a meio de uma frase.
    const stream = claude.messages.stream({
      model,
      max_tokens: 64000,
      system: SYSTEM,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: [
            hint ? `Contexto: ${hint}` : "",
            `Traduz cada elemento deste array de ${strings.length} cadeias.`,
            "Responde só com um array JSON de cadeias, do mesmo comprimento e na mesma ordem. Sem comentários, sem markdown.",
            attempt > 0 ? "A resposta anterior não tinha o comprimento certo. Conta os elementos antes de responder." : "",
            JSON.stringify(strings, null, 0),
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
    });
    const response = await stream.finalMessage();

    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    // O modelo cumpre o pedido, mas uma cerca de código não é um erro fatal.
    const json = text.replace(/^```(?:json)?\s*|\s*```$/g, "");
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed) || parsed.length !== strings.length) {
      throw new Error(`esperava ${strings.length} traduções, veio ${Array.isArray(parsed) ? parsed.length : typeof parsed}`);
    }
    return { parsed, usage: response.usage };
  };

  let last;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { parsed, usage } = await ask(attempt);
      custo.entrada += usage.input_tokens ?? 0;
      custo.saida += usage.output_tokens ?? 0;
      return parsed;
    } catch (error) {
      last = error;
      if (error instanceof Anthropic.RateLimitError) await new Promise((r) => setTimeout(r, 20000 * (attempt + 1)));
    }
  }
  throw last;
}

const custo = { entrada: 0, saida: 0 };

/** Corre as tarefas com um tecto de simultaneidade. */
async function pool(items, worker) {
  const fila = [...items];
  const runners = Array.from({ length: Math.min(concurrency, fila.length) }, async () => {
    while (fila.length) {
      const item = fila.shift();
      await worker(item);
    }
  });
  await Promise.all(runners);
}

const payload = await getPayload({ config });

const where = onlySlug ? { slug: { equals: onlySlug } } : {};
const { docs } = await payload.find({ collection: "posts", where, limit: 0, depth: 0, sort: "-date" });

const pendentes = docs
  .filter((doc) => doc.lang !== "en")
  .filter((doc) => force || !doc.titleEn?.trim() || !doc.excerpt?.en?.trim() || !doc.bodyEn)
  .slice(0, limit);

console.log(`${pendentes.length} artigos por traduzir de ${docs.length}${dryRun ? " (ensaio)" : ""}`);

let feitos = 0;
let falhados = 0;

await pool(pendentes, async (doc) => {
  const nos = collect(doc.body ?? {}, []);
  const pedido = [doc.titlePt ?? "", doc.excerpt?.pt ?? "", ...nos.map((no) => no.text)];

  if (dryRun) {
    console.log(`· ${doc.slug}: ${pedido.length} cadeias, ${pedido.join(" ").length} caracteres`);
    return;
  }

  try {
    const traduzido = await translateStrings(pedido, `artigo do blog da Jelly: ${doc.titlePt}`);
    const [titulo, resumo, ...corpo] = traduzido;

    // A árvore é a portuguesa com o texto trocado: estrutura, links e marcas
    // ficam iguais, o que nenhuma tradução da árvore inteira garantiria.
    const arvore = structuredClone(doc.body);
    collect(arvore, []).forEach((no, index) => {
      no.text = corpo[index] ?? no.text;
    });

    await payload.update({
      collection: "posts",
      id: doc.id,
      data: {
        titleEn: titulo,
        excerpt: { pt: doc.excerpt?.pt ?? "", en: resumo },
        bodyEn: arvore,
      },
    });
    feitos += 1;
    console.log(`✓ ${doc.slug}`);
  } catch (error) {
    falhados += 1;
    console.log(`! ${doc.slug}: ${error.message}`);
  }
});

// Preços por milhão de tokens, para a conta ficar à vista de quem corre isto.
const PRECO = { "claude-opus-5": [5, 25], "claude-sonnet-5": [3, 15], "claude-haiku-4-5": [1, 5] };
const [entrada, saida] = PRECO[model] ?? [];
const conta = entrada ? ` ≈ ${((custo.entrada / 1e6) * entrada + (custo.saida / 1e6) * saida).toFixed(2)} USD` : "";
console.log(`${feitos} traduzidos, ${falhados} falhados; ${custo.entrada} tokens de entrada, ${custo.saida} de saída${conta}`);

if (feitos) await purgeSite();
process.exit(falhados ? 1 : 0);
