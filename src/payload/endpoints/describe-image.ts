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

/**
 * Descreve uma imagem do CMS com o Claude: devolve texto alternativo e legenda
 * para quem está a editar aceitar, corrigir ou ignorar. Não grava nada — a
 * decisão é de quem escreve.
 *
 * POST /api/media/:id/descrever
 */
export const describeImage: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  }

  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) {
    return Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 });
  }

  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Falta o id da imagem." }, { status: 400 });

  const media = (await req.payload.findByID({ collection: "media", id: String(id), depth: 0 })) as Media | null;
  if (!media?.url) return Response.json({ error: "Imagem sem endereço." }, { status: 404 });

  const url = media.url.startsWith("http")
    ? media.url
    : `${req.payload.config.serverURL || `https://${req.headers.get("host")}`}${media.url}`;

  const claude = new Anthropic({ apiKey: key });

  try {
    // A imagem vai nos bytes, não por endereço: assim funciona com ficheiros
    // locais em desenvolvimento e não depende de quem está do outro lado
    // conseguir descarregar do nosso armazenamento. Encolhida para 1200 px
    // porque o custo da visão cresce com os pixels e a descrição não melhora.
    const fetched = await fetch(url);
    if (!fetched.ok) throw new Error(`a imagem respondeu ${fetched.status}`);
    const jpeg = await sharp(Buffer.from(await fetched.arrayBuffer()))
      .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

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
              text: `Descreve esta imagem. O ficheiro chama-se "${media.filename ?? "sem nome"}", o que pode dar contexto — ou não dar nenhum.`,
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
    return Response.json({
      title: (parsed.title ?? "").trim(),
      alt: (parsed.alt ?? "").trim(),
      caption: (parsed.caption ?? "").trim(),
      model: response.model,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`descrever imagem ${id}: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
