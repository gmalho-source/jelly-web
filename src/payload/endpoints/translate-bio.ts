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

/**
 * Traduz a apresentação.
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

  if (texto.length < 20) {
    return Response.json({ error: "Escreve primeiro a apresentação em português." }, { status: 422 });
  }
  // Uma apresentação são três parágrafos. Vinte mil caracteres é folga com
  // margem, e evita que um erro de campo mande um artigo inteiro para tradução.
  if (texto.length > 20000) {
    return Response.json({ error: "Texto grande demais para uma apresentação." }, { status: 413 });
  }

  try {
    const claude = new Anthropic({ apiKey: key });
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: REGRAS,
      messages: [
        {
          role: "user",
          content: nome ? `This is the bio of ${nome}.\n\n${texto}` : texto,
        },
      ],
    });

    const traducao = response.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("")
      .trim();

    if (!traducao) return Response.json({ error: "A resposta veio vazia." }, { status: 502 });
    return Response.json({ traducao, model: response.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`traduzir apresentação: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
