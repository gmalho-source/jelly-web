import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * O resumo de um artigo, escrito pelo Claude.
 *
 * O resumo tem dois trabalhos ao mesmo tempo: é a primeira linha do artigo no
 * site e é a `description` que aparece nos resultados de pesquisa. É por isso
 * que as regras abaixo são tão apertadas no comprimento — o Google corta perto
 * dos 155 caracteres, e um resumo cortado a meio é pior do que um resumo curto.
 *
 * Não grava nada: devolve o texto, e quem está a escrever lê, corrige e
 * publica. Um resumo é a promessa que o artigo faz a quem chega de fora, e essa
 * promessa não se assina sem ler.
 */
const REGRAS_PT = `Escreves o resumo dos artigos do blog da Jelly, uma agência portuguesa de marketing digital e inteligência artificial.

O resumo serve duas coisas ao mesmo tempo: é a primeira linha do artigo na página e é a meta description que aparece no Google.

Regras:
- Português europeu. Nunca português do Brasil.
- Entre 120 e 155 caracteres, contados. Nunca passa dos 158.
- Uma frase, ou duas curtas. Acaba com ponto final.
- Diz o que o leitor leva do artigo, em concreto. Se o artigo tem números, um método ou uma lista, é isso que se diz.
- Trata o leitor por "você" — é um artigo para clientes e para quem procura no Google.
- Sem "Neste artigo", "Saiba mais", "Descubra", "Vamos explorar", sem reticências, sem aspas, sem emoji, sem hashtags.
- Não repetes o título por outras palavras: acrescentas o que o título não diz.
- Não vendes a Jelly. O nome da casa só aparece se o artigo for sobre ela.

Respondes só com o resumo, sem aspas e sem mais nada.`;

const REGRAS_EN = `You write the excerpts for the Jelly blog. Jelly is a Portuguese digital marketing and AI agency.

The excerpt does two jobs at once: it is the opening line of the article on the page, and it is the meta description shown in search results.

Rules:
- British English.
- Between 120 and 155 characters, counted. Never more than 158.
- One sentence, or two short ones. Ends with a full stop.
- Say what the reader gets, concretely. If the article has numbers, a method or a list, say that.
- Address the reader as "you".
- No "In this article", "Learn more", "Discover", "Let's explore", no ellipses, no quotes, no emoji, no hashtags.
- Do not restate the title in other words: add what the title does not say.
- Do not sell Jelly. The agency's name appears only if the article is about it.

Reply with the excerpt only, no quotes and nothing else.`;

/** O que impede o pedido de sair: sessão no painel e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

/**
 * O texto do artigo, seja de onde vier.
 *
 * O corpo chega do browser tal como está no editor — uma árvore do Lexical —
 * porque é o que permite escrever o resumo de um artigo ainda por gravar. Aqui
 * só interessam as palavras: os nós são atravessados e o que não é texto cai.
 */
function palavras(no: unknown): string {
  if (typeof no === "string") return no;
  if (Array.isArray(no)) return no.map(palavras).join(" ");
  if (no && typeof no === "object") {
    const doc = no as Record<string, unknown>;
    if (typeof doc.text === "string") return doc.text;
    return palavras(doc.children ?? doc.root ?? []);
  }
  return "";
}

/**
 * Escreve o resumo.
 *
 * POST /api/posts/resumo
 * { titulo, corpo, lingua }
 */
export const writeExcerpt: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as { titulo?: string; corpo?: unknown; lingua?: string } | undefined;
  const titulo = (pedido?.titulo ?? "").trim();
  const lingua = pedido?.lingua === "en" ? "en" : "pt";
  // Dois mil e quinhentas palavras chegam para saber do que fala um artigo, e
  // poupam o resto. Um artigo do blog raramente passa disso.
  const texto = palavras(pedido?.corpo).replace(/\s+/g, " ").trim().slice(0, 12000);

  if (!titulo && texto.length < 200) {
    return Response.json({ error: "Escreve o título e algum corpo primeiro." }, { status: 422 });
  }

  try {
    const claude = new Anthropic({ apiKey: key });
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: lingua === "en" ? REGRAS_EN : REGRAS_PT,
      messages: [
        {
          role: "user",
          content:
            lingua === "en"
              ? `Title: ${titulo || "(untitled)"}\n\nArticle:\n${texto || "(no body yet)"}`
              : `Título: ${titulo || "(sem título)"}\n\nArtigo:\n${texto || "(ainda sem corpo)"}`,
        },
      ],
    });

    const resumo = response.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("")
      .trim()
      .replace(/^["“”']|["“”']$/g, "")
      .trim();

    if (!resumo) return Response.json({ error: "A resposta veio vazia." }, { status: 502 });
    return Response.json({ resumo, model: response.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`escrever resumo: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
