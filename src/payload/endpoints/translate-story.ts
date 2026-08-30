import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * A história de um caso, passada a inglês pelo Claude.
 *
 * Vai e volta uma lista numerada de textos, e não a árvore de blocos. É de
 * propósito: a estrutura da história — que bloco vem a seguir a qual, que
 * imagem está onde — nunca sai daqui, e por isso não há nada nela que o modelo
 * possa partir. O que sai são cadeias de texto; o que volta são as mesmas
 * cadeias noutra língua, pela mesma ordem.
 *
 * Não grava: o painel põe o resultado nos campos e quem lá está lê antes de
 * gravar. Um caso de cliente é a peça comercial da casa.
 */
const REGRAS = `You translate portfolio case studies for Jelly, a Portuguese digital marketing and AI agency. The source is European Portuguese; the target is British English.

You receive a numbered list of texts taken from one case study, in order. Some are section headings, some are body paragraphs, some are button labels. You return the same list, same numbers, same count, translated.

Rules:
- British English. Natural English, not a word-for-word carry-over from Portuguese.
- Keep each item's register and length in the same range. A heading stays a heading: short, no full stop unless the original has one. A button label stays two or three words.
- Keep the paragraph breaks inside an item exactly as they are.
- Do not translate: client names, brand names, product names, people's names, place names, or the names of tools and platforms.
- Numbers, percentages and units stay as they are. Portuguese decimal commas become full stops only inside numbers written in English style; when in doubt keep the original.
- Do not add, remove, merge or split items. Do not add commentary.

Reply with a JSON array of strings and nothing else: the translations, in the same order as the numbered list you received.`;

function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

/**
 * Traduz uma lista de textos.
 *
 * POST /api/projects/traduzir-historia
 * { textos: string[], cliente?: string }
 */
export const translateStory: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as { textos?: unknown; cliente?: string } | undefined;
  const textos = (Array.isArray(pedido?.textos) ? pedido.textos : [])
    .map((item) => String(item ?? ""))
    .filter((item) => item.trim());

  if (!textos.length) return Response.json({ error: "Não há texto português para traduzir." }, { status: 422 });
  if (textos.length > 120) return Response.json({ error: "História grande demais para uma vez." }, { status: 413 });

  const numerada = textos.map((texto, indice) => `${indice + 1}. ${texto}`).join("\n\n");
  const cliente = (pedido?.cliente ?? "").trim();

  try {
    const claude = new Anthropic({ apiKey: key });
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: REGRAS,
      messages: [
        {
          role: "user",
          content: cliente ? `Case study for ${cliente}.\n\n${numerada}` : numerada,
        },
      ],
    });

    const cru = response.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("")
      .trim();

    // O modelo devolve JSON, mas às vezes embrulha-o em cercas de código.
    const limpo = cru.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    const traducoes: unknown = JSON.parse(limpo);

    if (!Array.isArray(traducoes) || traducoes.length !== textos.length) {
      // Contagem diferente é o único erro que não se pode consertar do lado de
      // cá: sem saber qual é qual, escrever seria pôr o texto errado no bloco
      // errado. Vale mais dizer que não deu.
      return Response.json(
        { error: `A resposta veio com ${Array.isArray(traducoes) ? traducoes.length : "outra forma"} em vez de ${textos.length} textos.` },
        { status: 502 },
      );
    }

    return Response.json({ traducoes: traducoes.map((item) => String(item ?? "")) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`traduzir história: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
