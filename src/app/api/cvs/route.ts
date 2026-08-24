import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import { BREVO, fichaDaPorta, recebe } from "./comum";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * O registo da porta no Brevo, feito pelo próprio servidor.
 *
 * Sem isto, alguém tem de montar à mão um pedido que leva o segredo da porta
 * dentro do URL — e um segredo que anda em comandos copiados acaba onde não
 * deve. Aqui não há nada para copiar: o servidor sabe o endereço em que vive e
 * o segredo que tem, e é ele que os junta.
 *
 * Fechado com o mesmo segredo que purga o site, e é sempre o mesmo webhook: se
 * já existir um a apontar para esta porta, não cria outro — dois webhooks
 * iguais fariam duas fichas por cada email.
 *
 *   curl -sS https://…/api/cvs -H "authorization: Bearer $REVALIDATE_SECRET"
 */
export async function GET(request: NextRequest) {
  const dono = env(process.env.REVALIDATE_SECRET);
  const dado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!dono || dado !== dono) return NextResponse.json({ ok: false }, { status: 401 });

  const segredo = env(process.env.CV_INBOUND_SECRET);
  const caixa = env(process.env.CV_INBOUND_ADDRESS);
  const brevoKey = env(process.env.BREVO_API_KEY);
  if (!segredo || !caixa) return NextResponse.json({ erro: "faltam CV_INBOUND_SECRET ou CV_INBOUND_ADDRESS" }, { status: 400 });
  if (!brevoKey) return NextResponse.json({ erro: "falta BREVO_API_KEY" }, { status: 400 });

  // O endereço por onde esta chamada entrou, e não o do `NEXT_PUBLIC_SITE_URL`:
  // essa variável aponta ao domínio público, que enquanto o site não for ao ar
  // é o jelly.pt antigo. O webhook tem de apontar ao sítio onde este código
  // está a correr — que é, por definição, aquele a que se está a chamar.
  const base = request.nextUrl.origin.replace(/\/$/, "");
  // O segredo vai no caminho, e não numa interrogação: o Brevo recusa um
  // endereço com query string («Enter valid notify url»), e um webhook sem
  // segredo nenhum era uma porta aberta a quem soubesse o endereço.
  // No endereço vai a ficha da porta, não o segredo: assim o caminho é sempre
  // hexadecimal — nada que um URL recuse — e o segredo não fica guardado em
  // casa alheia. A porta aceita as duas coisas.
  const alvo = `${base}/api/cvs/${fichaDaPorta(segredo)}`;
  // O segredo nunca sai daqui, nem para quem tem o direito de perguntar.
  const disfarce = (url: string) => url.replace(/\/api\/cvs\/[^/?#]+/, "/api/cvs/•••").replace(/chave=[^&]+/, "chave=•••");

  const brevo = async (caminho: string, corpo?: unknown) =>
    fetch(`${BREVO}/${caminho}`, {
      method: corpo ? "POST" : "GET",
      headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
      ...(corpo ? { body: JSON.stringify(corpo) } : {}),
    });

  const lista = await brevo("webhooks?type=inbound");
  const listados = lista.ok ? ((await lista.json()) as { webhooks?: { id?: number; url?: string }[] }).webhooks ?? [] : [];
  const jaLa = listados.find((w) => String(w.url ?? "").startsWith(`${base}/api/cvs`));
  // Webhooks de entrada a apontar para outro sítio — um deploy antigo, uma
  // tentativa falhada — não são apagados aqui, mas são ditos: dois a apontar
  // para portas vivas fariam duas fichas por cada email.
  const outros = listados
    .filter((w) => w !== jaLa)
    .map((w) => ({ id: w.id, url: disfarce(String(w.url ?? "")) }));
  if (jaLa) {
    return NextResponse.json({
      ok: true,
      estado: "já existia",
      id: jaLa.id,
      url: disfarce(String(jaLa.url)),
      caixa,
      ...(outros.length ? { outros } : {}),
    });
  }

  // O `domain` é obrigatório num webhook de entrada — sem ele o Brevo responde
  // «Enter valid notify url», que é a queixa errada e faz perder uma tarde. É o
  // domínio da caixa: o que tem os MX apontados para lá.
  const dominio = caixa.split("@")[1] ?? "";
  if (!dominio) return NextResponse.json({ erro: "CV_INBOUND_ADDRESS não parece um endereço" }, { status: 400 });

  const criado = await brevo("webhooks", {
    type: "inbound",
    events: ["inboundEmailProcessed"],
    url: alvo,
    domain: dominio,
    description: `Entrada de CV reenviados - ${caixa}`,
  });
  const resposta = (await criado.json()) as { id?: number; message?: string; code?: string };
  if (!criado.ok) {
    // Uma recusa sem se ver o que foi enviado é uma adivinha. Vai tudo, menos o
    // segredo: o endereço com ele tapado, e as pistas que costumam explicar um
    // URL recusado — o comprimento, e se o segredo tem caracteres que num
    // endereço não podem andar à solta.
    const seguro = /^[A-Za-z0-9._~-]+$/.test(segredo);
    return NextResponse.json(
      {
        ok: false,
        estado: "o Brevo recusou",
        brevo: resposta,
        enviado: { url: disfarce(alvo), domain: dominio, type: "inbound", events: ["inboundEmailProcessed"] },
        pistas: {
          host: base,
          comprimentoDoEndereco: alvo.length,
          comprimentoDoSegredo: segredo.length,
          segredoSoComCaracteresDeEndereco: seguro,
        },
      },
      { status: 502 },
    );
  }
  return NextResponse.json({
    ok: true,
    estado: "criado agora",
    id: resposta.id,
    url: disfarce(alvo),
    caixa,
    dominio,
    ...(outros.length ? { outros } : {}),
  });
}

export async function POST(request: NextRequest) {
  // A chave na query continua a servir — é o caminho mais óbvio para quem
  // experimenta à mão. O Brevo, esse, quer o endereço sem interrogações.
  return recebe(request, request.nextUrl.searchParams.get("chave"));
}
