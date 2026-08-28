import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * A apresentação de uma pessoa da equipa, passada a inglês pelo Claude.
 *
 * As vinte e uma apresentações foram escritas em português, cada uma pela
 * própria pessoa, e o site inglês servia-as em português por não haver melhor.
 * Traduzir vinte e uma à mão é meio dia de trabalho; traduzir uma é um botão.
 *
 * Não grava: devolve o texto e quem está no painel lê, corrige e grava. Isto é
 * mais importante aqui do que num resumo — é a apresentação de uma pessoa, e
 * ninguém deve descobrir a versão inglesa dela sem que alguém a tenha lido.
 */
const REGRAS = `You translate the team bios on the website of Jelly, a Portuguese digital marketing and AI agency. The source is European Portuguese; the target is British English.

These are personal introductions. Most are written by the person themselves, in the first person; some are written about the person, in the third person. Keep whichever voice the original uses. Keep the register too: if the original jokes, the English jokes.

Rules:
- British English. Natural English, not a word-for-word carry-over from Portuguese.
- Keep the paragraph breaks exactly: one newline in, one newline out. Never merge or split paragraphs.
- Do not translate people's names, place names, company names or job titles. "Content Marketing Manager" stays. "Aveiro" stays.
- Do not add, remove or soften anything. No introductions, no conclusions, no explanations of Portuguese references.
- Portuguese degrees and institutions keep their name, with a short English gloss only if the original already explains it.
- Keep the person's own idioms working: find the English expression that does the same job, rather than translating the words.
- No quotation marks around the whole thing, no notes, no commentary.

Reply with the translation only.`;

/** O que impede o pedido de sair: sessão no painel e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

/** O texto que se aceita traduzir. Devolve a queixa, ou nada se estiver bem. */
function queixa(texto: string) {
  if (texto.length < 20) return "Escreve primeiro a apresentação em português.";
  // Uma apresentação são três parágrafos. Vinte mil caracteres é folga com
  // margem, e evita que um erro de campo mande um artigo inteiro para tradução.
  if (texto.length > 20000) return "Texto grande demais para uma apresentação.";
  return null;
}

/** A tradução, do Claude. Levanta se vier vazia. */
async function traduz(key: string, texto: string, nome: string) {
  const claude = new Anthropic({ apiKey: key });
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 4096,
    system: REGRAS,
    messages: [{ role: "user", content: nome ? `This is the bio of ${nome}.\n\n${texto}` : texto }],
  });

  const traducao = response.content
    .filter((bloco) => bloco.type === "text")
    .map((bloco) => bloco.text)
    .join("")
    .trim();

  if (!traducao) throw new Error("a resposta veio vazia");

  // Uma linha por parágrafo, como no português. Apesar de a instrução o pedir,
  // o modelo escreve por vezes uma linha em branco entre parágrafos — e como o
  // site parte o texto em cada quebra de linha, isso dava parágrafos vazios
  // pelo meio da apresentação. Cinco das vinte e uma vieram assim.
  return traducao
    .split("\n")
    .map((linha) => linha.trim())
    .filter(Boolean)
    .join("\n");
}

/**
 * Traduz a apresentação e devolve-a. Não grava.
 *
 * POST /api/team/traduzir
 * { texto, nome? }
 */
export const translateBio: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as { texto?: string; nome?: string } | undefined;
  const texto = (pedido?.texto ?? "").trim();
  const nome = (pedido?.nome ?? "").trim();

  const problema = queixa(texto);
  if (problema) return Response.json({ error: problema }, { status: texto.length < 20 ? 422 : 413 });

  try {
    return Response.json({ traducao: await traduz(key!, texto, nome) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`traduzir apresentação: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};

/**
 * Traduz a apresentação de uma pessoa e grava-a.
 *
 * Esta grava, ao contrário do botão que está dentro da ficha, e a diferença é
 * de propósito: dentro da ficha há alguém a olhar para o texto e a última
 * palavra é dessa pessoa; aqui não há ficha aberta nenhuma, o pedido é para
 * traduzir as vinte e uma de uma vez, e sem gravar não sobrava nada.
 *
 * Nunca escreve por cima de um inglês que já lá esteja: quem o escreveu sabia
 * mais do que o modelo.
 *
 * POST /api/team/traduzir-e-gravar
 * { nome }
 */
export const translateAndSaveBio: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as { nome?: string } | undefined;
  const nome = (pedido?.nome ?? "").trim();

  const { docs } = await req.payload.find({
    collection: "team",
    where: { name: { equals: nome } },
    limit: 1,
    depth: 0,
  });
  const ficha = docs[0];
  if (!ficha) return Response.json({ error: `«${nome}» não está na equipa.` }, { status: 404 });

  const apresentacao = (ficha.bio ?? {}) as { pt?: string | null; en?: string | null };
  const portuguesa = (apresentacao.pt ?? "").trim();
  if ((apresentacao.en ?? "").trim()) return Response.json({ nome, estado: "já tinha inglês" });

  const problema = queixa(portuguesa);
  if (problema) return Response.json({ nome, estado: "sem português" });

  try {
    const traducao = await traduz(key!, portuguesa, nome);
    await req.payload.update({
      collection: "team",
      id: ficha.id,
      data: { bio: { pt: apresentacao.pt, en: traducao } } as never,
      overrideAccess: true,
    });
    return Response.json({ nome, estado: "traduzida" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`traduzir e gravar «${nome}»: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
