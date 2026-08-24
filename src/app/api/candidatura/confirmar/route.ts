import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { aindaVale, resumoDaChave } from "@/lib/confirmacao";
import { withinRateLimit } from "@/lib/billing/store";

export const runtime = "nodejs";

/**
 * O outro lado da terceira via: o que o candidato decidir.
 *
 * Duas decisões possíveis, e as duas são dele. Confirmar — e aí a candidatura
 * passa a ter consentimento, com data, e entra na fila como qualquer outra. Ou
 * apagar — e aí desaparece, ela e o currículo, no momento.
 *
 * A chave do link é a credencial. Vale catorze dias, é de uso único, e a
 * confirmação apaga-a: um link que continuasse a abrir a ficha depois de usado
 * era um dado pessoal a viver para sempre numa caixa de correio.
 */
const ANOS = new Set(["nenhuma", "menos-de-um", "um-dois", "tres-cinco", "mais-de-cinco"]);
const VINCULOS = new Set(["contrato", "estagio", "freelancer"]);

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  // Um travão contra quem queira experimentar chaves à sorte. Trinta e dois
  // bytes não se adivinham, mas não custa fechar a porta ao ruído.
  if (!withinRateLimit(`confirmar:${ip}`, 20, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const token = String(corpo.token ?? "");
  if (!token) return NextResponse.json({ ok: false }, { status: 400 });

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "applications",
    where: { confirmTokenHash: { equals: resumoDaChave(token) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const ficha = docs[0];
  // A mesma resposta para chave errada, chave usada e chave velha: do lado de
  // fora não se distingue uma da outra, e é assim que se quer.
  if (!ficha || ficha.confirmedAt || !aindaVale(ficha.confirmSentAt)) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const texto = (chave: string, limite = 300) => String(corpo[chave] ?? "").trim().slice(0, limite);

  if (corpo.apagar === true) {
    const cv = typeof ficha.cv === "number" ? ficha.cv : null;
    const carta = typeof ficha.letter === "number" ? ficha.letter : null;
    await payload.delete({ collection: "applications", id: ficha.id, overrideAccess: true });
    // O currículo vai atrás: guardá-lo depois de a candidatura ser apagada era
    // ficar com o documento sem a ficha que explica porque é que ele existe.
    for (const documento of [cv, carta].filter((valor): valor is number => typeof valor === "number")) {
      await payload
        .delete({ collection: "documents", id: documento, overrideAccess: true })
        .catch((erro) => console.error("[confirmar] o documento não foi apagado", erro));
    }
    console.log(`[confirmar] ficha ${ficha.id} apagada a pedido do candidato`);
    return NextResponse.json({ ok: true, estado: "apagada" });
  }

  const nome = texto("name", 120);
  if (!nome) return NextResponse.json({ ok: false }, { status: 400 });

  const agora = new Date().toISOString();
  const anos = texto("experienceYears", 20);
  const vinculo = texto("contractWanted", 20);

  await payload.update({
    collection: "applications",
    id: ficha.id,
    overrideAccess: true,
    data: {
      name: nome,
      phone: texto("phone", 30),
      city: texto("city", 120),
      country: texto("country", 120),
      linkedin: texto("linkedin"),
      portfolio: texto("portfolio"),
      ...(ANOS.has(anos) ? { experienceYears: anos as "nenhuma" } : {}),
      ...(VINCULOS.has(vinculo) ? { contractWanted: vinculo as "contrato" } : {}),
      newsletterOptIn: corpo.newsletter === true,
      // O que esta página existe para recolher. A data é a de agora, e é a
      // primeira vez que esta candidatura tem uma.
      consentAt: agora,
      confirmedAt: agora,
      // A chave morre aqui: usada uma vez, não volta a abrir nada.
      confirmTokenHash: null,
      status: "nova",
    },
  });

  console.log(`[confirmar] ficha ${ficha.id} confirmada pelo candidato`);
  return NextResponse.json({ ok: true, estado: "confirmada" });
}
