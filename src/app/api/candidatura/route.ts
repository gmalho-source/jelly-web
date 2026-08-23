import { NextResponse, after, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
import { avisoDeCandidatura, cartaDeCandidatura, type Candidatura } from "@/lib/email-candidatura";
import { absoluto } from "@/lib/email-aviso";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { envOr } from "@/lib/env";
import { indicativoDe } from "@/lib/indicativos";

export const runtime = "nodejs";

/**
 * Uma candidatura, do site para o painel.
 *
 * Grava primeiro, avisa depois — como nos contactos, e pela mesma razão: se o
 * email falhar, a candidatura não se perde com ele. E ao contrário dos
 * contactos, aqui um registo que falhe faz falhar o pedido: dizer «enviado» a
 * quem está à procura de emprego sem ter guardado nada era mentir onde mais
 * dói.
 *
 * O CV vai para a caixa dos documentos, que só se lê com perfil de
 * recrutamento. Não é a caixa das imagens do site nem a dos briefings de
 * cliente: um CV é um dado pessoal de alguém que o confiou à casa.
 */
export async function POST(request: NextRequest) {
  let dados: FormData;
  try {
    dados = await request.formData();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const texto = (chave: string, limite: number) => String(dados.get(chave) ?? "").trim().slice(0, limite);
  const name = texto("name", 120);
  const email = normalizeEmail(texto("email", 160));
  const numero = texto("phone", 30).replace(/[^\d\s]/g, "").trim();
  const phone = numero ? `${indicativoDe(texto("dial", 2).toUpperCase()).codigo} ${numero}` : "";
  const city = texto("city", 120);
  const country = texto("country", 120) || "Portugal";
  const linkedin = texto("linkedin", 300);
  const portfolio = texto("portfolio", 300);
  const jobSlug = texto("job", 200);
  const consent = Boolean(dados.get("consent"));
  const newsletterOptIn = Boolean(dados.get("newsletter"));

  const EXPERIENCIA = ["nenhuma", "menos-de-um", "um-dois", "tres-cinco", "mais-de-cinco"] as const;
  const VINCULO = ["contrato", "estagio", "freelancer"] as const;
  const daLista = <T extends readonly string[]>(lista: T, valor: string): T[number] | undefined =>
    (lista as readonly string[]).includes(valor) ? (valor as T[number]) : undefined;

  const experienceYears = daLista(EXPERIENCIA, texto("experienceYears", 20));
  const contractWanted = daLista(VINCULO, texto("contractWanted", 20));

  const cv = dados.get("cv");
  const letter = dados.get("letter");

  // Sem consentimento não se guarda nada.
  if (!consent) return NextResponse.json({ ok: false, erro: "consentimento" }, { status: 400 });

  if (!name || !isValidEmail(email) || numero.replace(/\D/g, "").length < 6 || !(cv instanceof File && cv.size > 0)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`candidatura:${ip}`, 5, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const locale: "pt" | "en" = /\/en\//.test(request.headers.get("referer") ?? "") ? "en" : "pt";

  /** As respostas às perguntas da vaga, como foram feitas e como foram dadas. */
  const answers: { question: string; answer: string }[] = [];
  for (let indice = 0; indice < 40; indice += 1) {
    const pergunta = texto(`q${indice}-label`, 300);
    if (!pergunta) continue;
    // Uma pergunta de escolha múltipla chega repetida, uma vez por opção.
    const resposta = dados
      .getAll(`q${indice}`)
      .map((valor) => String(valor).trim())
      .filter(Boolean)
      .join(", ")
      .slice(0, 4000);
    if (resposta) answers.push({ question: pergunta, answer: resposta });
  }

  const areasEscolhidas = dados
    .getAll("departments")
    .map((valor) => String(valor).trim())
    .filter(Boolean);

  let registoId: string | number | undefined;
  let cvUrl: string | undefined;
  let vagaTitulo = texto("jobTitle", 200);
  const areasNomes: string[] = [];

  try {
    const payload = await getPayload({ config });

    /** Um ficheiro para a caixa fechada dos documentos. */
    const guarda = async (ficheiro: File, nota: string) => {
      if (ficheiro.size > 4_000_000) return undefined;
      try {
        return await payload.create({
          collection: "documents",
          data: { note: nota },
          file: {
            name: ficheiro.name,
            data: Buffer.from(await ficheiro.arrayBuffer()),
            mimetype: ficheiro.type || "application/pdf",
            size: ficheiro.size,
          },
        });
      } catch (erro) {
        // Um ficheiro que o servidor recuse — um PDF que não é um PDF — não pode
        // levar consigo a candidatura inteira.
        console.error("[candidatura] o ficheiro não entrou", erro);
        return undefined;
      }
    };

    const cvDoc = await guarda(cv, `CV de ${name}`);
    // O CV é o ponto da candidatura. Se não entrou — um ficheiro corrompido, um
    // PDF que não é um PDF — a pessoa tem de saber para tentar outro, em vez de
    // ficar com uma candidatura gravada sem ele e a acreditar que está tratada.
    if (!cvDoc?.id) return NextResponse.json({ ok: false, erro: "cv" }, { status: 415 });
    const letterDoc = letter instanceof File && letter.size > 0 ? await guarda(letter, `Carta de ${name}`) : undefined;
    if (cvDoc?.url) cvUrl = absoluto(String(cvDoc.url));

    // A vaga traz consigo a função e o departamento: a candidatura tem de nascer
    // arrumada, ou a matriz de fit não a encontra depois.
    let jobId: number | undefined;
    let functionId: number | undefined;
    let departmentIds: number[] = [];

    if (jobSlug) {
      const { docs } = await payload.find({
        collection: "jobs",
        where: { slug: { equals: jobSlug } },
        limit: 1,
        depth: 1,
      });
      const vaga = docs[0] as
        | { id?: number | string; titlePt?: string; function?: number | { id?: number | string; department?: number | { id?: number | string } } }
        | undefined;
      if (vaga?.id) {
        jobId = Number(vaga.id);
        vagaTitulo = vagaTitulo || String(vaga.titlePt ?? "");
        const funcao = vaga.function;
        if (funcao && typeof funcao === "object") {
          functionId = Number(funcao.id);
          const area = funcao.department;
          const areaId = area && typeof area === "object" ? area.id : area;
          if (areaId) departmentIds = [Number(areaId)];
        }
      }
    } else if (areasEscolhidas.length) {
      const { docs } = await payload.find({
        collection: "departments",
        where: { slug: { in: areasEscolhidas } },
        limit: 20,
        depth: 0,
      });
      departmentIds = docs.map((area) => Number(area.id));
      for (const area of docs) areasNomes.push(String((area as { namePt?: string }).namePt ?? ""));
    }

    const registo = await payload.create({
      collection: "applications",
      data: {
        name,
        email,
        phone,
        city,
        country,
        linkedin,
        portfolio,
        ...(jobId ? { job: jobId } : {}),
        ...(functionId ? { function: functionId } : {}),
        ...(departmentIds.length ? { department: departmentIds } : {}),
        ...(experienceYears ? { experienceYears } : {}),
        ...(contractWanted ? { contractWanted } : {}),
        ...(cvDoc?.id ? { cv: Number(cvDoc.id) } : {}),
        ...(letterDoc?.id ? { letter: Number(letterDoc.id) } : {}),
        newsletterOptIn,
        answers,
        status: "nova",
        consentAt: new Date().toISOString(),
        source: "site",
      },
    });
    registoId = registo.id;
  } catch (erro) {
    console.error("[candidatura] não gravou", erro);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  const carta: Candidatura = {
    locale,
    nome: name,
    email,
    telefone: phone,
    ...(vagaTitulo ? { vaga: vagaTitulo } : {}),
    areas: areasNomes.filter(Boolean),
    cidade: city,
    experiencia: experienceYears ?? "",
    temCarta: letter instanceof File && letter.size > 0,
    respostas: answers,
    ...(registoId !== undefined ? { registoId } : {}),
    ...(cvUrl ? { cvUrl } : {}),
  };

  // Os dois emails saem depois da resposta: a candidatura já está gravada e
  // quem submeteu não tem de esperar por eles.
  after(async () => {
    const paraCasa = envOr(process.env.TALENT_TO_EMAIL, "talent@jelly.pt");

    const aviso = await enviaEmail({ voz: "talento", to: paraCasa, replyTo: email, ...avisoDeCandidatura(carta) });
    if (!aviso.ok && aviso.via !== "log") console.error(`[candidatura] o aviso não saiu: ${aviso.erro}`);

    const recibo = await enviaEmail({ voz: "talento", to: email, replyTo: paraCasa, ...cartaDeCandidatura(carta) });
    if (!recibo.ok && recibo.via !== "log") console.error(`[candidatura] a confirmação não saiu: ${recibo.erro}`);
  });

  return NextResponse.json({ ok: true, registo: registoId });
}
