import { NextResponse, type NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { leituraEscrita, lerCurriculo } from "@/lib/cv-leitura";

export const runtime = "nodejs";
// Ler um currículo leva dezenas de segundos, e o Brevo espera pela resposta.
export const maxDuration = 60;

/**
 * A porta B: um CV que chegou a talent@jelly.pt e que alguém da casa reenviou.
 *
 * O reenvio é à mão, de propósito. A equipa lê o que chega, e só o que tem
 * futuro é que segue para aqui — o resto, spam e phishing incluídos, morre na
 * caixa de entrada sem que nada aconteça. Isso vale mais do que qualquer filtro
 * automático que se pudesse escrever.
 *
 * O que entra aqui nasce em «Por confirmar»: os dados são de um documento e de
 * um email, não da pessoa, e o consentimento não se inventa. É o pedido de
 * confirmação — a terceira via, a mesma que serve o CV carregado no painel —
 * que promove a ficha e recolhe o consentimento.
 *
 * Quatro trancas, e a ordem importa. Se a primeira ou a segunda falharem, a
 * mensagem não é de quem diz ser, ou não é para nós: fica no registo e mais
 * nada — responder a um remetente forjado é falar com quem o forjou. Se falhar
 * o resto, é um colega à espera: esse recebe resposta.
 */

// O endereço da API do Brevo sai daqui para poder ser apontado a um servidor de
// mentira quando se prova esta porta sem passar pelo Brevo verdadeiro.
const BREVO = env(process.env.BREVO_API_BASE) ?? "https://api.brevo.com/v3";
const MAX_ANEXO = 8_000_000;
const PDF = /pdf/i;
const DOCUMENTOS = /(pdf|msword|officedocument|rtf)/i;

/** Comparação sem dar pistas pelo tempo que demora. */
function iguais(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

type Anexo = { Name?: string; ContentType?: string; ContentLength?: number; DownloadToken?: string; Token?: string };
type Item = {
  From?: { Address?: string; Name?: string } | string;
  To?: ({ Address?: string } | string)[];
  Subject?: string;
  Date?: string;
  RawTextBody?: string;
  ExtractedMarkdownMessage?: string;
  Attachments?: Anexo[];
  Headers?: Record<string, string | string[]> | { Name?: string; Value?: string }[];
  SpamScore?: number;
};

const endereco = (valor: unknown): string => {
  if (typeof valor === "string") return normalizeEmail(valor.replace(/^.*<|>.*$/g, ""));
  if (valor && typeof valor === "object" && "Address" in valor) return normalizeEmail(String((valor as { Address?: string }).Address ?? ""));
  return "";
};

/**
 * Um cabeçalho do email, venha ele como mapa (`{"From": "..."}`) ou como lista
 * (`[{"Name": "From", "Value": "..."}]`). O Brevo documenta o primeiro, mas um
 * formato de entrada não é sítio para se apostar: se a leitura falhasse, tudo o
 * que a equipa reenviasse era recusado sem se perceber porquê.
 */
function cabecalho(cabecalhos: Item["Headers"], nome: string): string {
  if (!cabecalhos) return "";
  const junta = (valor: unknown) => (Array.isArray(valor) ? valor.join(" ") : String(valor ?? ""));
  if (Array.isArray(cabecalhos)) {
    const achado = (cabecalhos as { Name?: string; Value?: unknown }[]).find(
      (linha) => String(linha?.Name ?? "").toLowerCase() === nome,
    );
    return junta(achado?.Value).toLowerCase().trim();
  }
  const chave = Object.keys(cabecalhos).find((k) => k.toLowerCase() === nome);
  return chave ? junta(cabecalhos[chave]).toLowerCase().trim() : "";
}

/**
 * O reenvio veio mesmo de casa?
 *
 * O remetente é o colega que reenviou, e o Workspace assina o que sai do
 * jelly.pt. Se a assinatura não bater certo, qualquer pessoa que soubesse o
 * endereço podia escrever fichas na base de dados.
 */
function autenticado(item: Item): { ok: boolean; razao: string } {
  const de = endereco(item.From);
  if (!de.endsWith("@jelly.pt")) return { ok: false, razao: `remetente de fora: ${de || "desconhecido"}` };

  const linha = cabecalho(item.Headers, "authentication-results");
  const recebido = cabecalho(item.Headers, "received-spf");
  if (!linha && !recebido) return { ok: false, razao: "sem cabeçalho de autenticação" };

  const dkim = /dkim=pass/.test(linha) && /header\.[di]=@?(?:[\w.-]+\.)?jelly\.pt/.test(linha);
  const spf = /spf=pass/.test(linha) && /jelly\.pt|google\.com/.test(linha);
  // Nem todos os servidores escrevem o mesmo cabeçalho. O `Received-SPF` é o
  // mais antigo dos dois e serve de rede: diz o mesmo por outras palavras.
  const spfAntigo = /^\s*pass/.test(recebido) && /jelly\.pt|google\.com/.test(recebido);
  if (!dkim && !spf && !spfAntigo) {
    return { ok: false, razao: `autenticação não passou: ${(linha || recebido).slice(0, 200)}` };
  }
  return { ok: true, razao: dkim ? "dkim" : spf ? "spf" : "received-spf" };
}

/** O email original, arrumado para ficar na ficha. */
function comoFicaNaFicha(item: Item) {
  const corpo = (item.ExtractedMarkdownMessage ?? item.RawTextBody ?? "").trim().slice(0, 6000);
  return [
    `Reenviado por ${endereco(item.From)}${item.Date ? ` em ${item.Date}` : ""}`,
    item.Subject ? `Assunto: ${item.Subject}` : "",
    "",
    corpo,
  ]
    .filter((linha) => linha !== undefined)
    .join("\n")
    .trim();
}

export async function POST(request: NextRequest) {
  const segredo = env(process.env.CV_INBOUND_SECRET);
  const caixa = normalizeEmail(env(process.env.CV_INBOUND_ADDRESS) ?? "");
  // Sem configuração, a porta não existe. É o que se quer: uma porta a meio
  // configurar é uma porta aberta.
  if (!segredo || !caixa) return NextResponse.json({ ok: false }, { status: 404 });

  const chave = request.nextUrl.searchParams.get("chave") ?? "";
  if (!iguais(chave, segredo)) return NextResponse.json({ ok: false }, { status: 401 });

  let corpo: { items?: Item[] } | Item;
  try {
    corpo = (await request.json()) as { items?: Item[] };
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const items = Array.isArray((corpo as { items?: Item[] }).items)
    ? ((corpo as { items: Item[] }).items ?? [])
    : [corpo as Item];

  const resultados: string[] = [];
  for (const item of items) resultados.push(await trata(item, caixa));
  return NextResponse.json({ ok: true, resultados });
}

async function trata(item: Item, caixa: string): Promise<string> {
  const de = endereco(item.From);

  // 1 e 2: para nós, e de casa. Falhando, não se responde a ninguém.
  const paraNos = (item.To ?? []).map(endereco).includes(caixa);
  if (!paraNos) {
    console.warn(`[cvs] destinatário não é a caixa: ${(item.To ?? []).map(endereco).join(", ") || "nenhum"}`);
    return "destinatário errado";
  }
  const prova = autenticado(item);
  if (!prova.ok) {
    console.warn(`[cvs] recusado: ${prova.razao}`);
    return "não autenticado";
  }
  if (typeof item.SpamScore === "number" && item.SpamScore >= 5) {
    console.warn(`[cvs] recusado por spam score ${item.SpamScore}`);
    return "spam";
  }

  console.log(`[cvs] aceite de ${de}, autenticado por ${prova.razao}`);

  // Daqui para baixo é um colega à espera: o que correr mal, ele fica a saber.
  const responde = async (assunto: string, texto: string) => {
    const saiu = await enviaEmail({ to: de, subject: assunto, text: texto, voz: "talento" }).catch((erro) => ({
      ok: false,
      erro: erro instanceof Error ? erro.message : String(erro),
    }));
    // Uma resposta que não sai deixa o colega a achar que o reenvio se perdeu.
    // Não trava nada — a ficha já está feita — mas fica escrito.
    if (!saiu.ok) console.error(`[cvs] a resposta a ${de} não saiu: ${saiu.erro ?? "sem razão"}`);
  };

  const anexos = (item.Attachments ?? []).filter((a) => DOCUMENTOS.test(String(a.ContentType ?? a.Name ?? "")));
  const anexo = anexos.find((a) => PDF.test(String(a.ContentType ?? a.Name ?? ""))) ?? anexos[0];
  if (!anexo) {
    await responde(
      "Não encontrei o currículo nesse email",
      "Reencaminhaste um email para a entrada de CV, mas não vinha lá nenhum ficheiro que eu saiba ler (PDF ou Word).\n\nSe o currículo estava num link, ou no corpo do email, cria a ficha no painel e usa o botão «Ler um CV».",
    );
    return "sem anexo";
  }
  if (Number(anexo.ContentLength ?? 0) > MAX_ANEXO) {
    await responde("Esse currículo é grande demais", `O ficheiro tem ${Math.round(Number(anexo.ContentLength) / 1_000_000)} MB e o limite são 8 MB. Cria a ficha no painel e carrega uma versão mais leve.`);
    return "anexo grande";
  }

  const brevoKey = env(process.env.BREVO_API_KEY);
  const token = anexo.DownloadToken ?? anexo.Token;
  if (!brevoKey || !token) {
    console.error("[cvs] sem chave do Brevo ou sem token do anexo");
    await responde("Não consegui ir buscar o currículo", "Recebi o teu reenvio mas não consegui descarregar o anexo. Já estamos a ver porquê — entretanto, cria a ficha no painel e usa o botão «Ler um CV».");
    return "anexo inacessível";
  }

  let bytes: Buffer;
  try {
    const resposta = await fetch(`${BREVO}/inbound/attachments/${token}`, { headers: { "api-key": brevoKey } });
    if (!resposta.ok) throw new Error(`o Brevo respondeu ${resposta.status}`);
    bytes = Buffer.from(await resposta.arrayBuffer());
    // O tamanho anunciado pode não vir, e o verdadeiro só se sabe aqui.
    if (bytes.length > MAX_ANEXO) throw new Error(`o ficheiro tem ${Math.round(bytes.length / 1_000_000)} MB`);
  } catch (erro) {
    const razao = erro instanceof Error ? erro.message : "sem razão conhecida";
    console.error("[cvs] anexo não veio:", razao);
    await responde(
      "Não consegui ir buscar o currículo",
      `Recebi o teu reenvio mas não consegui ficar com o anexo — ${razao}. Cria a ficha no painel e usa o botão «Ler um CV».`,
    );
    return "anexo não veio";
  }

  const payload = await getPayload({ config });
  const nome = String(anexo.Name ?? "cv.pdf").slice(0, 120);
  const tipo = String(anexo.ContentType ?? "application/pdf");

  let documento: { id: number | string } | undefined;
  try {
    documento = await payload.create({
      collection: "documents",
      data: { note: `CV reenviado por ${de}` },
      file: { data: bytes, mimetype: tipo, name: nome, size: bytes.length },
    });
  } catch (erro) {
    console.error("[cvs] o ficheiro não entrou", erro);
    await responde("O currículo não entrou", "O ficheiro que reenviaste não foi aceite — pode estar corrompido, ou não ser o que o nome diz. Cria a ficha no painel e tenta por lá.");
    return "documento recusado";
  }

  // A leitura é um extra: sem chave, ou com um Word em vez de um PDF, a ficha
  // entra na mesma — com o CV anexado e os campos por preencher.
  const chaveIA = env(process.env.ANTHROPIC_API_KEY);
  let campos: Awaited<ReturnType<typeof lerCurriculo>>["campos"] | undefined;
  if (chaveIA && PDF.test(tipo)) {
    try {
      ({ campos } = await lerCurriculo({ bytes, nome, key: chaveIA }));
    } catch (erro) {
      console.error("[cvs] não consegui ler o CV", erro);
    }
  }

  const emailCandidato = campos?.email && isValidEmail(campos.email) ? campos.email : "";
  const registoDoEmail = comoFicaNaFicha(item);

  // Duas pessoas a reenviar o mesmo currículo não fazem duas fichas.
  if (emailCandidato) {
    const { docs } = await payload.find({
      collection: "applications",
      where: { email: { equals: emailCandidato } },
      limit: 1,
      depth: 0,
      sort: "-createdAt",
    });
    const jaExiste = docs[0] as { id?: number | string; name?: string; cv?: unknown; sourceEmail?: string } | undefined;
    if (jaExiste?.id) {
      await payload.update({
        collection: "applications",
        id: jaExiste.id,
        data: {
          ...(jaExiste.cv ? {} : { cv: Number(documento.id) }),
          sourceEmail: [jaExiste.sourceEmail, registoDoEmail].filter(Boolean).join("\n\n———\n\n").slice(0, 12_000),
        },
      });
      await responde(
        `Já havia ficha de ${jaExiste.name ?? emailCandidato}`,
        `Esta pessoa já estava no sistema, por isso juntei o currículo e o email à ficha que existia em vez de criar outra.\n\nFicha: ${painel(`/collections/applications/${jaExiste.id}`)}`,
      );
      return "juntou a uma ficha existente";
    }
  }

  const ficha = await payload.create({
    collection: "applications",
    data: {
      name: campos?.name || `Candidatura reenviada por ${de}`,
      email: emailCandidato || `sem-email+${Date.now()}@cvs.jelly.pt`,
      ...(campos?.phone ? { phone: campos.phone } : {}),
      ...(campos?.city ? { city: campos.city } : {}),
      ...(campos?.country ? { country: campos.country } : {}),
      ...(campos?.linkedin ? { linkedin: campos.linkedin } : {}),
      ...(campos?.portfolio ? { portfolio: campos.portfolio } : {}),
      ...(campos?.experienceYears ? { experienceYears: campos.experienceYears as "nenhuma" } : {}),
      ...(campos?.contractWanted ? { contractWanted: campos.contractWanted as "contrato" } : {}),
      cv: Number(documento.id),
      ...(campos ? { cvReading: leituraEscrita(campos) } : {}),
      sourceEmail: registoDoEmail.slice(0, 12_000),
      // Por confirmar: os dados são de um documento, não da pessoa. O
      // consentimento fica vazio, e é o pedido de confirmação que o recolhe.
      status: "por_confirmar",
      source: "Reenviado por email",
    },
  });

  await responde(
    campos?.name ? `Ficha criada: ${campos.name}` : "Ficha criada, por confirmar",
    [
      "Recebi o currículo que reenviaste e criei a ficha.",
      emailCandidato ? "" : "Não consegui encontrar o email da pessoa no currículo — sem ele não dá para lhe pedir a confirmação, por isso escreve-o à mão na ficha.",
      "A vaga fica por escolher: é a única coisa que um currículo não diz.",
      "",
      `Ficha: ${painel(`/collections/applications/${ficha.id}`)}`,
    ]
      .filter((linha) => linha !== "")
      .join("\n"),
  );

  return `ficha ${ficha.id}`;
}

/** Endereço de uma página do painel, para o email do colega ter para onde apontar. */
function painel(caminho: string) {
  const base = env(process.env.NEXT_PUBLIC_SITE_URL) ?? "https://www.jelly.pt";
  return `${base.replace(/\/$/, "")}/admin${caminho}`;
}
