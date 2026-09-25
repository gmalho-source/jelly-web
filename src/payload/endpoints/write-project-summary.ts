import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * O resumo de um projeto, escrito pelo Claude nas duas línguas de uma vez.
 *
 * O resumo é a frase debaixo do nome do cliente, no topo da página do caso, e é
 * a description que sai no Google. Quem o escreve dá o contexto — o que o
 * cliente precisava, o que se fez, o que mudou — e o Claude devolve o português
 * e o inglês juntos, para as duas versões dizerem a mesma coisa. Pedir uma de
 * cada vez dava duas frases irmãs que não eram a mesma frase.
 *
 * Não grava nada: devolve o texto, e quem está a escrever lê, corrige e grava.
 * É a primeira coisa que o caso diz sobre o cliente, e isso não se publica sem
 * ler.
 */
const REGRAS = `Escreves o resumo dos projetos no site da Jelly, uma agência portuguesa de branding, marketing digital, inteligência artificial e tecnologia.

O resumo aparece por baixo do nome do cliente, no topo da página do projeto, e é também a meta description no Google. Escreves duas versões que dizem exactamente a mesma coisa: "pt" em português europeu e "en" em inglês britânico.

Como é um bom resumo desta casa:
- Uma frase, no máximo duas curtas. Entre 110 e 160 caracteres em cada língua, contados. Nunca mais de 170.
- Diz o que mudou para o cliente, não a lista de serviços. "Reconstruímos o funil de paid media de cima a baixo e ligámos as campanhas ao CRM, para deixar de otimizar cliques e passar a otimizar contratos." é o tom certo. "Branding, website e redes sociais" não é um resumo, é uma etiqueta.
- Primeira pessoa do plural, na voz da Jelly: "Criámos", "Reconstruímos", "Levámos". Em inglês, "We built", "We rebuilt".
- Concreto: se o contexto traz um número, um mercado, um prazo ou um resultado verificável, usa-o. Nunca inventas números, resultados, prémios ou nomes que não estejam no contexto.
- Português europeu, nunca do Brasil ("equipa", "ecrã", "utilizador", "facto"). Inglês britânico ("optimise", "programme", "colour").
- Sem adjectivos de agência ("inovador", "disruptivo", "de excelência", "cutting-edge"), sem pontos de exclamação, sem aspas, sem emoji, sem hashtags, sem reticências.
- Não repetes o nome do cliente se ele já é o título da página — só se a frase precisar dele para se ler.

O pedido traz o contexto escrito por quem conhece o projeto e, quando houver, o que já está na ficha e no texto do caso. O contexto de quem escreve manda sobre o resto.`;

/** O formato da resposta: as duas línguas, e nada mais. */
const FORMATO = {
  type: "json_schema" as const,
  schema: {
    type: "object",
    properties: {
      pt: { type: "string", description: "O resumo em português europeu." },
      en: { type: "string", description: "The same summary in British English." },
    },
    required: ["pt", "en"],
    additionalProperties: false,
  },
};

/** O que impede o pedido de sair: sessão no painel e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

type Pedido = {
  contexto?: string;
  cliente?: string;
  titulo?: string;
  linha?: string;
  disciplinas?: string[];
  historia?: string;
  atual?: { pt?: string; en?: string };
};

const limpa = (valor: unknown, maximo: number) =>
  (typeof valor === "string" ? valor : "").replace(/\s+/g, " ").trim().slice(0, maximo);

/**
 * Escreve o resumo nas duas línguas.
 *
 * POST /api/projects/resumo
 * { contexto, cliente, titulo, linha, disciplinas, historia, atual }
 */
export const writeProjectSummary: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = ((await req.json?.()) ?? {}) as Pedido;
  const contexto = limpa(pedido.contexto, 4000);
  const cliente = limpa(pedido.cliente, 200);
  // O texto do caso ajuda, mas é o contexto de quem escreve que diz o que
  // interessa. Oito mil caracteres chegam para saber do que fala um caso.
  const historia = limpa(pedido.historia, 8000);

  if (contexto.length < 20 && historia.length < 200) {
    return Response.json(
      { error: "Escreve umas linhas de contexto: o que o cliente precisava, o que fizemos, o que mudou." },
      { status: 422 },
    );
  }

  const partes = [
    `Cliente: ${cliente || "(sem nome)"}`,
    limpa(pedido.titulo, 300) && `Título do caso: ${limpa(pedido.titulo, 300)}`,
    limpa(pedido.linha, 300) && `Linha de apoio: ${limpa(pedido.linha, 300)}`,
    pedido.disciplinas?.length && `Disciplinas: ${pedido.disciplinas.map((d) => limpa(d, 60)).join(", ")}`,
    limpa(pedido.atual?.pt, 400) && `Resumo que está lá agora (para melhorar, não para copiar): ${limpa(pedido.atual?.pt, 400)}`,
    `Contexto de quem conhece o projeto:\n${contexto || "(nenhum — usa o texto do caso)"}`,
    historia && `Texto do caso:\n${historia}`,
  ].filter(Boolean);

  try {
    const claude = new Anthropic({ apiKey: key });
    const response = await claude.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      system: REGRAS,
      messages: [{ role: "user", content: partes.join("\n\n") }],
      output_config: { format: FORMATO },
      // Se o pedido for recusado por um filtro de segurança, o próprio serviço
      // tenta outro modelo em vez de devolver nada.
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
    });

    if (response.stop_reason === "refusal") {
      return Response.json({ error: "O modelo recusou escrever este resumo. Reformula o contexto." }, { status: 422 });
    }
    if (response.stop_reason === "max_tokens") {
      return Response.json({ error: "A resposta ficou cortada. Tenta outra vez." }, { status: 502 });
    }

    const texto = response.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("");
    const { pt, en } = JSON.parse(texto) as { pt?: string; en?: string };
    const resumo = { pt: (pt ?? "").trim(), en: (en ?? "").trim() };
    if (!resumo.pt || !resumo.en) return Response.json({ error: "A resposta veio incompleta." }, { status: 502 });

    return Response.json({ ...resumo, model: response.model });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return Response.json({ error: "Demasiados pedidos ao mesmo tempo — tenta dentro de um minuto." }, { status: 429 });
    }
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`escrever resumo do projeto: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
