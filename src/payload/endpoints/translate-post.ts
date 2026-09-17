import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * Um bocado de artigo passado a inglês pelo Claude, a partir do painel.
 *
 * Isto já existia como guião de linha de comandos — o `npm run translate`, que
 * traduz em lote o que estiver por traduzir. Serve para pôr 180 artigos em
 * inglês de uma assentada; não serve para quem acaba de escrever um artigo e o
 * quer em inglês antes de publicar. Mesmo modelo, mesmas regras, à espera de
 * que alguém carregue num botão.
 *
 * Vai e volta uma lista de cadeias de texto, e não a árvore do corpo. É de
 * propósito, e é a mesma decisão que a história de um caso: a estrutura, os
 * links, as imagens e as marcas de negrito nunca saem daqui, e por isso não há
 * nada nelas que o modelo possa partir. O painel tira as cadeias da árvore,
 * manda-as, e põe as que voltam no mesmo lugar.
 *
 * Uma lista de cada vez, e não o artigo inteiro: a função tem sessenta segundos
 * e um artigo de dez minutos de leitura não cabe lá. Quem chama parte o texto e
 * conta os pedaços.
 *
 * Não grava. O que volta fica no formulário à espera de ser lido — uma tradução
 * é uma primeira versão, e um artigo é o que a casa tem para dizer.
 */
const REGRAS = `Traduzes artigos de marketing digital de português europeu para inglês britânico. São os artigos do blog da Jelly, uma agência portuguesa de marketing digital e inteligência artificial.

Recebes um array JSON de cadeias, pela ordem em que aparecem no artigo: títulos de secção, parágrafos, itens de lista, legendas. Pode ser o artigo todo ou um pedaço dele.

Regras:
- Traduz o sentido, não as palavras: o texto tem de ler como se tivesse sido escrito em inglês.
- Mantém o tom directo e sem jargão de agência. Não acrescentas nem cortas ideias.
- Cada elemento mantém o seu registo e a sua dimensão. Um título de secção fica um título de secção: curto, sem ponto final se o original não o tem.
- Nomes de marcas, produtos, pessoas, ferramentas e terras ficam como estão.
- Termos técnicos que a indústria usa em inglês ficam em inglês.
- Números, percentagens e unidades ficam como estão. Preserva os símbolos (—, ·, %, €).
- Não traduzes texto que já esteja em inglês: devolve-o igual.
- Não acrescentas, tiras, juntas nem partes elementos. Sem comentários.

Respondes só com um array JSON de cadeias, do mesmo comprimento e na mesma ordem.`;

function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

/**
 * Pede a tradução e exige o mesmo número de elementos.
 *
 * O que volta vai ser encaixado nó a nó numa árvore: uma lista mais curta ou
 * mais comprida do que a que saiu põe cada parágrafo no sítio do seguinte, e
 * isso não se vê ao ler a notificação — vê-se depois, no artigo publicado. Por
 * isso é aqui que se conta, e a segunda tentativa diz-lhe o que falhou, que é o
 * que costuma resolver.
 */
async function traduz(claude: Anthropic, cadeias: string[], contexto: string): Promise<string[]> {
  let ultimo: unknown;
  for (let tentativa = 0; tentativa < 2; tentativa += 1) {
    try {
      const resposta = await claude.messages.create({
        model: MODEL,
        max_tokens: 16000,
        system: REGRAS,
        messages: [
          {
            role: "user",
            content: [
              `Contexto: ${contexto}`,
              `Traduz cada elemento deste array de ${cadeias.length} cadeias.`,
              "Responde só com um array JSON de cadeias, do mesmo comprimento e na mesma ordem. Sem comentários, sem markdown.",
              tentativa > 0 ? "A resposta anterior não tinha o comprimento certo. Conta os elementos antes de responder." : "",
              JSON.stringify(cadeias),
            ]
              .filter(Boolean)
              .join("\n\n"),
          },
        ],
      });
      const texto = resposta.content
        .filter((bloco) => bloco.type === "text")
        .map((bloco) => bloco.text)
        .join("")
        .trim();
      // O modelo cumpre o pedido, mas uma cerca de código não é um erro fatal.
      const lido: unknown = JSON.parse(texto.replace(/^```(?:json)?\s*|\s*```$/g, ""));
      if (!Array.isArray(lido) || lido.length !== cadeias.length) {
        throw new Error(`esperava ${cadeias.length} traduções, veio ${Array.isArray(lido) ? lido.length : typeof lido}`);
      }
      return lido.map((item) => String(item ?? ""));
    } catch (error) {
      ultimo = error;
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error("a tradução não veio no formato pedido");
}

/**
 * Traduz uma lista de textos de um artigo.
 *
 * POST /api/posts/traduzir
 * { textos: string[], titulo?: string }  →  { traducoes: string[] }
 */
export const translatePost: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as { textos?: unknown; titulo?: string } | undefined;
  const textos = (Array.isArray(pedido?.textos) ? pedido.textos : []).map((item) => String(item ?? ""));

  if (!textos.some((texto) => texto.trim())) {
    return Response.json({ error: "Não há texto português para traduzir." }, { status: 422 });
  }
  if (textos.join(" ").length > 24000) {
    return Response.json({ error: "Pedaço grande demais para uma vez." }, { status: 413 });
  }

  const titulo = (pedido?.titulo ?? "").trim();

  try {
    const claude = new Anthropic({ apiKey: key });
    const traducoes = await traduz(claude, textos, `artigo do blog da Jelly: ${titulo || "(sem título)"}`);
    return Response.json({ traducoes });
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`traduzir artigo: ${mensagem}`);
    return Response.json({ error: mensagem }, { status: 502 });
  }
};
