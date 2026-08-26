import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

/**
 * As comunicações da Jelly: quem as recebe vive no Brevo, não aqui.
 *
 * O Brevo é que tem a lista de supressão, o tratamento de devoluções e a saída
 * num clique. Guardar os subscritores também do nosso lado era ter duas
 * verdades: alguém sai pelo link do email, ele sabe, nós não, e voltamos a
 * escrever a quem pediu para não escrevermos mais.
 *
 * Antes da confirmação não guardamos nada — nem aqui nem lá. O link que sai na
 * carta leva o email assinado lá dentro, e o contacto só nasce quando alguém
 * carregar nele. Sem clique não há registo nenhum para apagar depois.
 *
 * A assinatura usa o segredo do painel com uma etiqueta própria: a mesma chave
 * a assinar coisas diferentes é a mesma chave a poder ser trocada de porta.
 */
const ETIQUETA = "subscricao-v1";
const DIAS = 7;

const segredo = () => env(process.env.PAYLOAD_SECRET) ?? "";

const assina = (dados: string) => createHmac("sha256", `${ETIQUETA}:${segredo()}`).update(dados).digest("base64url");

export type Bilhete = { email: string; lingua: "pt" | "en"; origem: string; quando: number };

/** O bilhete que vai no link: legível, mas que ninguém consegue forjar. */
/*
 * O til a separar as duas metades, e não um ponto: o middleware do site deixa
 * passar sem tocar tudo o que tenha um ponto no endereço — é assim que os
 * ficheiros estáticos não passam pela tradução de idiomas — e um token com
 * ponto dava 404 na página de confirmação. O til não pertence ao alfabeto do
 * base64url, portanto separa sem ambiguidade.
 */
export function bilheteNovo(email: string, lingua: "pt" | "en", origem: string): string {
  const dados = Buffer.from(JSON.stringify({ email, lingua, origem, quando: Date.now() })).toString("base64url");
  return `${dados}~${assina(dados)}`;
}

/** O que o link traz — ou nada, se a assinatura não bater ou o prazo tiver passado. */
export function bilheteLido(token: string): Bilhete | null {
  if (!segredo()) return null;
  const [dados, marca] = token.split("~");
  if (!dados || !marca) return null;

  const esperada = Buffer.from(assina(dados));
  const veio = Buffer.from(marca);
  if (esperada.length !== veio.length || !timingSafeEqual(esperada, veio)) return null;

  try {
    const bilhete = JSON.parse(Buffer.from(dados, "base64url").toString()) as Bilhete;
    if (!bilhete?.email || Date.now() - bilhete.quando > DIAS * 24 * 60 * 60 * 1000) return null;
    return { ...bilhete, lingua: bilhete.lingua === "en" ? "en" : "pt" };
  } catch {
    return null;
  }
}

export const DIAS_DE_VALIDADE = DIAS;

/** Para o registo: saber que entrou alguém sem escrever quem no log. */
export const emSilencio = (email: string) => createHash("sha256").update(email).digest("hex").slice(0, 8);

const BREVO = env(process.env.BREVO_API_BASE) ?? "https://api.brevo.com/v3";

/**
 * O contacto no Brevo, criado só depois de a pessoa confirmar.
 *
 * `updateEnabled` porque quem subscreve duas vezes não é um erro: é alguém que
 * mudou de ideias sobre a língua, ou que se esqueceu que já o tinha feito.
 */
export async function guardaNoBrevo(bilhete: Bilhete): Promise<{ ok: boolean; erro?: string }> {
  const chave = env(process.env.BREVO_API_KEY);
  const lista = Number(env(process.env.BREVO_LIST_ID) ?? "");
  if (!chave) return { ok: false, erro: "falta a BREVO_API_KEY" };
  if (!lista) return { ok: false, erro: "falta a BREVO_LIST_ID" };

  const resposta = await fetch(`${BREVO}/contacts`, {
    method: "POST",
    headers: { "api-key": chave, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      email: bilhete.email,
      listIds: [lista],
      updateEnabled: true,
      attributes: {
        // A língua não se pergunta: sabe-se pela página onde a pessoa estava, e
        // é por este atributo que se segmenta na hora de escrever.
        LINGUA: bilhete.lingua.toUpperCase(),
        ORIGEM: bilhete.origem.slice(0, 120),
        CONSENTIMENTO: new Date().toISOString().slice(0, 10),
      },
    }),
  });

  if (resposta.ok || resposta.status === 204) return { ok: true };
  const corpo = (await resposta.json().catch(() => ({}))) as { message?: string; code?: string };
  return { ok: false, erro: corpo.message ?? `o Brevo respondeu ${resposta.status}` };
}
