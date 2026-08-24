import { NextResponse, type NextRequest } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
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
export const BREVO = env(process.env.BREVO_API_BASE) ?? "https://api.brevo.com/v3";
const MAX_ANEXO = 8_000_000;
const PDF = /pdf/i;
const DOCUMENTOS = /(pdf|msword|officedocument|rtf)/i;

/**
 * A ficha da porta: o que vai no endereço em vez do segredo.
 *
 * O segredo pode ter o que lhe apetecer — quem o gera não tem de saber que ele
 * vai acabar num URL — e um `+` ou uma barra pelo meio fazem um endereço que o
 * Brevo recusa. Isto é o resumo criptográfico dele, em hexadecimal: sempre
 * seguro de pôr num caminho, e não devolve o segredo a quem o veja.
 *
 * Metade do resumo chega e sobra: 128 bits não se adivinham, e o endereço fica
 * curto o suficiente para caber em qualquer campo alheio.
 */
export const fichaDaPorta = (segredo: string) =>
  createHash("sha256").update(segredo).digest("hex").slice(0, 32);

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
 * Os nomes dos cabeçalhos que vieram, para o registo.
 *
 * Só os nomes, e os valores do que é de autenticação: um email reenviado leva
 * dados de quem se candidatou, e um registo não é sítio para eles.
 */
function retratoDosCabecalhos(cabecalhos: Item["Headers"]): string {
  if (!cabecalhos) return "nenhum";
  const nomes = Array.isArray(cabecalhos)
    ? (cabecalhos as { Name?: string }[]).map((l) => String(l?.Name ?? ""))
    : Object.keys(cabecalhos);
  const interessa = nomes.filter((n) => /auth|spf|dkim|dmarc|arc/i.test(n));
  const valores = interessa
    .map((n) => `${n}=${cabecalho(cabecalhos, n.toLowerCase()).slice(0, 160)}`)
    .join(" | ");
  return `${Array.isArray(cabecalhos) ? "lista" : "mapa"} com ${nomes.length}: ${nomes.slice(0, 40).join(", ")}${valores ? ` ·· ${valores}` : ""}`;
}

/**
 * O reenvio veio mesmo de casa?
 *
 * Aqui há uma limitação que vale a pena escrever, porque não é evidente: o
 * Brevo entrega os cabeçalhos do email tal como vieram e não acrescenta
 * veredicto nenhum — não há `Authentication-Results` nem `Received-SPF`. A
 * assinatura do Google vem lá (`DKIM-Signature`, com o `d=` do domínio que
 * assina o correio da casa), mas ninguém nos diz se foi verificada, e verificar
 * uma assinatura DKIM exige a mensagem original inteira, que também não vem.
 *
 * O que fica, então, são quatro coisas que se somam: o endereço da caixa é
 * secreto e sorteado; o destinatário tem de ser exactamente ele; o remetente
 * tem de ser da casa; e a mensagem tem de trazer assinatura do domínio que
 * assina o correio da casa. A última é presença, não verificação — quem
 * soubesse o endereço podia forjar as duas.
 *
 * É por isso que uma ficha que entre por aqui nasce «Por confirmar» e nada se
 * decide sobre ela sem uma pessoa. Se um dia isto passar a valer mais do que
 * vale — a lista de candidatos é dado pessoal, não é dinheiro —, o passo
 * seguinte é combinar uma palavra que a equipa escreve no reenvio: conhecimento
 * que não anda em cabeçalhos e que não se adivinha de fora.
 */
const ASSINA_A_CASA = /d=(?:[\w.-]+\.)?jelly\.pt|d=jelly-pt\.[\w.-]*gappssmtp\.com/i;

function autenticado(item: Item): { ok: boolean; razao: string } {
  const de = endereco(item.From);
  if (!de.endsWith("@jelly.pt")) return { ok: false, razao: `remetente de fora: ${de || "desconhecido"}` };

  // Se algum dia o cabeçalho de veredicto aparecer, é ele que manda: é o único
  // dos dois que prova alguma coisa.
  const linha = cabecalho(item.Headers, "authentication-results");
  const recebido = cabecalho(item.Headers, "received-spf");
  const dkim = /dkim=pass/.test(linha) && /header\.[di]=@?(?:[\w.-]+\.)?jelly\.pt/.test(linha);
  const spf = /spf=pass/.test(linha) && /jelly\.pt|google\.com/.test(linha);
  const spfAntigo = /^\s*pass/.test(recebido) && /jelly\.pt|google\.com/.test(recebido);
  if (dkim || spf || spfAntigo) return { ok: true, razao: dkim ? "dkim=pass" : "spf=pass" };
  if (linha || recebido) return { ok: false, razao: `autenticação não passou: ${(linha || recebido).slice(0, 200)}` };

  const assinatura = cabecalho(item.Headers, "dkim-signature");
  if (assinatura && ASSINA_A_CASA.test(assinatura)) {
    return { ok: true, razao: "assinatura da casa (presença, não verificação)" };
  }
  return { ok: false, razao: assinatura ? "assinatura de outro domínio" : "sem assinatura nenhuma" };
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

export async function recebe(request: NextRequest, chaveDada: string | null) {
  const segredo = env(process.env.CV_INBOUND_SECRET);
  const caixa = normalizeEmail(env(process.env.CV_INBOUND_ADDRESS) ?? "");
  // Sem configuração, a porta não existe. É o que se quer: uma porta a meio
  // configurar é uma porta aberta.
  if (!segredo || !caixa) return NextResponse.json({ ok: false }, { status: 404 });

  // Serve o segredo (quem experimenta à mão) e a ficha dele (o que o Brevo tem).
  const dado = chaveDada ?? "";
  if (!iguais(dado, segredo) && !iguais(dado, fichaDaPorta(segredo))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Um pedido sem corpo legível é uma sonda — o Brevo verifica o endereço
  // antes de registar um webhook, e um 400 valia-lhe uma recusa. Quem chegou
  // aqui já provou saber o segredo, portanto a resposta é sim.
  let corpo: { items?: Item[] } | Item;
  try {
    corpo = (await request.json()) as { items?: Item[] };
  } catch {
    return NextResponse.json({ ok: true, estado: "porta aberta, à espera de correio" });
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
    // Com o retrato dos cabeçalhos ao lado: sem ele, «não autenticado» é uma
    // parede, e a regra corrige-se a adivinhar.
    console.warn(`[cvs] recusado: ${prova.razao} ·· ${retratoDosCabecalhos(item.Headers)}`);
    return "não autenticado";
  }
  if (typeof item.SpamScore === "number" && item.SpamScore >= 5) {
    console.warn(`[cvs] recusado por spam score ${item.SpamScore}`);
    return "spam";
  }

  // O `Received` fica no registo — é por onde o Brevo diz de que servidor
  // recebeu a mensagem, e é o que permitirá um dia apertar isto sem adivinhar.
  console.log(
    `[cvs] aceite de ${de}, por ${prova.razao} ·· recebido: ${cabecalho(item.Headers, "received").slice(0, 200) || "nada"}`,
  );

  // Um travão, não uma tranca: vinte por hora chega para o trabalho de uma
  // equipa e não chega para inundar a base de dados a quem descubra o endereço.
  if (!withinRateLimit("cvs:entrada", 20, 60 * 60)) {
    console.warn("[cvs] travado: mais de vinte reenvios na última hora");
    return "demasiados";
  }

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
