import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";
import sharp from "sharp";

type Media = { id: number | string; url?: string | null; mimeType?: string | null; filename?: string | null };

const MODEL = "claude-opus-5";

const SYSTEM = `Escreves texto alternativo e legendas para as imagens do site de uma agência portuguesa de marketing digital e inteligência artificial, a Jelly.

Regras do texto alternativo:
- Descreve o que está na imagem, para quem não a vê. Não interpretas nem vendes.
- Uma frase, até 125 caracteres, sem ponto final.
- Não começas com "Imagem de" nem "Fotografia de": isso o leitor de ecrã já diz.
- Se houver texto legível na imagem, transcreve-o entre aspas — é muitas vezes a informação que importa.
- Se a imagem for um gráfico ou infografia, diz o que ela mostra, não a sua aparência.

Regras do título:
- Como a imagem se chama para quem a procura no painel: três a seis palavras.
- Nomeia o que ela é, não o que se vê nela ("Equipa Jelly no escritório", "Gráfico do tráfego pago por canal").
- Sem ponto final.

Regras da legenda:
- Serve o leitor que vê a imagem: acrescenta o que a imagem não diz sozinha.
- Uma frase curta, em português europeu, sem ponto final.
- Se não houver nada de útil a acrescentar, devolve uma legenda vazia.

Respondes só com JSON: {"title": "…", "alt": "…", "caption": "…"}`;

/** O que impede o pedido de sair: sessão no painel e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

/**
 * Os bytes da imagem → título, texto alternativo e legenda.
 *
 * A imagem vai nos bytes, não por endereço: assim funciona com ficheiros locais
 * em desenvolvimento, com uma imagem que ainda não foi gravada, e não depende de
 * quem está do outro lado conseguir descarregar do nosso armazenamento.
 * Encolhida para 1200 px porque o custo da visão cresce com os pixels e a
 * descrição não melhora.
 */
async function descreve(key: string, original: Buffer, nome: string) {
  const jpeg = await sharp(original)
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const claude = new Anthropic({ apiKey: key });
  const response = await claude.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM,
    messages: [
      {
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: jpeg.toString("base64") } },
          {
            type: "text",
            text: `Descreve esta imagem. O ficheiro chama-se "${nome}", o que pode dar contexto — ou não dar nenhum.`,
          },
        ],
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("")
    .trim()
    .replace(/^```(?:json)?\s*|\s*```$/g, "");

  const parsed = JSON.parse(text) as { title?: string; alt?: string; caption?: string };
  return {
    title: (parsed.title ?? "").trim(),
    alt: (parsed.alt ?? "").trim(),
    caption: (parsed.caption ?? "").trim(),
    model: response.model,
  };
}

/**
 * Descreve uma imagem já gravada, pelo id.
 *
 * POST /api/media/:id/descrever
 */
export const describeImage: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Falta o id da imagem." }, { status: 400 });

  const media = (await req.payload.findByID({ collection: "media", id: String(id), depth: 0 })) as Media | null;
  if (!media?.url) return Response.json({ error: "Imagem sem endereço." }, { status: 404 });

  const url = media.url.startsWith("http")
    ? media.url
    : `${req.payload.config.serverURL || `https://${req.headers.get("host")}`}${media.url}`;

  try {
    const fetched = await fetch(url);
    if (!fetched.ok) throw new Error(`a imagem respondeu ${fetched.status}`);
    const descrito = await descreve(key, Buffer.from(await fetched.arrayBuffer()), media.filename ?? "sem nome");
    return Response.json(descrito);
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`descrever imagem ${id}: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};

/**
 * Descreve uma imagem que ainda não foi gravada: os bytes vêm no corpo do
 * pedido, escolhidos no painel e encolhidos no browser.
 *
 * É a mesma ajuda, mas na altura em que ela serve: quem carrega uma imagem
 * quer escrever o título e o texto alternativo ali, antes de gravar, e não
 * gravar às cegas para depois voltar atrás.
 *
 * POST /api/media/descrever?nome=…
 */
export const describeUpload: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const nome = new URL(req.url ?? "http://localhost").searchParams.get("nome") ?? "sem nome";

  // O tipo do Payload marca os métodos do Request como opcionais, porque o
  // mesmo objeto serve pedidos que não vêm da rede.
  if (typeof req.arrayBuffer !== "function") {
    return Response.json({ error: "Pedido sem corpo legível." }, { status: 400 });
  }

  try {
    const bytes = Buffer.from(await req.arrayBuffer());
    if (!bytes.byteLength) return Response.json({ error: "O pedido veio sem imagem." }, { status: 400 });
    // O painel encolhe antes de enviar; este limite é a rede de segurança, e
    // fica abaixo do que a plataforma aceita num corpo de pedido.
    if (bytes.byteLength > 4_000_000) {
      return Response.json({ error: "Imagem grande demais para descrever antes de gravar." }, { status: 413 });
    }

    return Response.json(await descreve(key, bytes, nome));
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`descrever imagem por carregar (${nome}): ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
