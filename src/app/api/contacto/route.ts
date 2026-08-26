import { NextResponse, after, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
import { cartaDeContacto } from "@/lib/email-contacto";
import { avisoDeContacto } from "@/lib/email-aviso";
import { indicativoDe } from "@/lib/indicativos";
import { abreNegocio } from "@/lib/pipedrive";
import { absoluto } from "@/lib/email-aviso";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { envOr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * Briefing curto da página de contactos.
 *
 * Grava primeiro, avisa depois: o email é o aviso, não o arquivo. Antes isto só
 * enviava, e um email que se perdesse levava o pedido com ele.
 *
 * Saem dois emails: um para a casa, com o briefing, e um para quem escreveu, a
 * dizer que chegou e quando terá resposta. O segundo é o que evita a dúvida de
 * quem carrega em enviar e não vê nada acontecer.
 */
export async function POST(request: NextRequest) {
  // Chega como formulário, porque pode traz um briefing em ficheiro. O JSON
  // ficou para trás: um ficheiro em base64 dentro de JSON é um terço mais de
  // peso por nada.
  let dados: FormData;
  try {
    dados = await request.formData();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // A armadilha do formulário: um campo que ninguém vê e que só um robô
  // preenche. Responde-se com um sim — um «apanhei-te» é uma aula de como
  // passar à próxima.
  if (String(dados.get("empresa_") ?? "").trim()) return NextResponse.json({ ok: true });

  const texto = (chave: string, limite: number) => String(dados.get(chave) ?? "").trim().slice(0, limite);
  const name = texto("name", 120);
  const company = texto("company", 120);
  const email = normalizeEmail(texto("email", 160));
  const message = texto("message", 4000);
  const start = texto("start", 20);
  // O indicativo vem por código ISO e não pelo número: um "+1" não diz se é dos
  // Estados Unidos ou do Canadá, e o que se guarda é o número já montado.
  const numero = texto("phone", 30).replace(/[^\d\s]/g, "").trim();
  const phone = numero ? `${indicativoDe(texto("dial", 2).toUpperCase()).codigo} ${numero}` : "";
  const brief = dados.get("brief");

  // A mesma regra do formulário, aqui outra vez: a validação do browser é uma
  // cortesia, não uma garantia — um pedido pode chegar sem ela.
  if (!name || !company || !message || !isValidEmail(email) || numero.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`contacto:${ip}`, 5, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const JANELAS: Record<"pt" | "en", Record<string, string>> = {
    pt: {
      "um-mes": "dentro de um mês",
      "dois-tres": "dentro de dois a três meses",
      "mais-tarde": "mais para a frente",
      "nao-sei": "ainda não sabe",
    },
    en: {
      "um-mes": "within a month",
      "dois-tres": "in two to three months",
      "mais-tarde": "further ahead",
      "nao-sei": "not sure yet",
    },
  };

  const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "pt";

  // O registo primeiro. Se a base falhar, o pedido não se perde por isso: o
  // email sai a seguir de qualquer maneira.
  // O id do anexo é numérico nesta base; o campo da janela só aceita os quatro
  // valores da lista, e o que vier de fora dela não entra.
  let anexo: number | undefined;
  // O briefing segue com o aviso à casa. Fica em memória de propósito: ir
  // buscá-lo outra vez ao armazenamento para o anexar era uma viagem à rede por
  // um ficheiro que já se tem na mão.
  let briefing:
    | { nome: string; url: string; bytes: number; segue: boolean; base64?: string; conteudo?: Buffer; tipo?: string }
    | undefined;
  let registoId: string | number | undefined;
  const JANELAS_VALIDAS = ["um-mes", "dois-tres", "mais-tarde", "nao-sei"] as const;
  const janela = (JANELAS_VALIDAS as readonly string[]).includes(start)
    ? (start as (typeof JANELAS_VALIDAS)[number])
    : undefined;
  try {
    const payload = await getPayload({ config });

    if (brief instanceof File && brief.size > 0) {
      if (brief.size > 4_000_000) return NextResponse.json({ ok: false, erro: "ficheiro grande" }, { status: 413 });
      // Em caixa própria: um ficheiro que o servidor recuse — um PDF que não é
      // um PDF — não pode levar consigo o pedido inteiro.
      const conteudo = Buffer.from(await brief.arrayBuffer());
      try {
        const guardado = await payload.create({
          collection: "attachments",
          data: { note: `Briefing de ${name}${company ? ` (${company})` : ""}` },
          file: {
            name: brief.name,
            data: conteudo,
            mimetype: brief.type || "application/pdf",
            size: brief.size,
          },
        });
        anexo = Number(guardado.id);
        // Acima disto o anexo é grande para seguir por email — em base64 cresce
        // um terço — e o risco é o fornecedor recusar a mensagem inteira. Um
        // aviso sem ficheiro serve; um aviso que não chega, não.
        const segue = brief.size <= 3_500_000;
        briefing = {
          nome: brief.name,
          url: String(guardado.url ?? `/api/attachments/file/${guardado.filename ?? brief.name}`),
          bytes: brief.size,
          segue,
          ...(segue ? { base64: conteudo.toString("base64") } : {}),
          // Para o Pipedrive vão sempre os bytes, seja qual for o tamanho: o
          // limite de 3,5 MB é do email, não dele.
          conteudo,
          tipo: brief.type || "application/pdf",
        };
      } catch (error) {
        console.error("[contacto] o briefing não entrou", error);
      }
    }

    const registo = await payload.create({
      collection: "messages",
      data: { name, company, email, phone, message, locale, status: "nova", start: janela, brief: anexo },
    });
    registoId = registo.id;
  } catch (error) {
    console.error("[contacto] não gravou a mensagem", error);
  }

  const paraCasa = envOr(process.env.CONTACT_TO_EMAIL, "gmalho@jelly.pt");

  const paraCasaCarta = avisoDeContacto({
    nome: name,
    empresa: company,
    email,
    telefone: phone,
    janela: janela ? (JANELAS.pt[janela] ?? "") : "",
    mensagem: message,
    mensagemId: registoId,
    ...(briefing ? { briefing } : {}),
  });

  const aviso = await enviaEmail({
    voz: "cliente",
    to: paraCasa,
    replyTo: email,
    ...paraCasaCarta,
    ...(briefing?.base64 ? { anexos: [{ nome: briefing.nome, base64: briefing.base64 }] } : {}),
  });

  // Sem chave de email — em desenvolvimento — o texto fica no log e o pedido
  // conta como aceite. Com chave e com recusa, é outra coisa: o pedido está
  // gravado mas ninguém foi avisado, e quem submeteu tem de saber que precisa
  // de insistir por outro caminho.
  if (!aviso.ok && aviso.via !== "log") {
    console.error(`[contacto] o aviso à casa não saiu (${aviso.via}): ${aviso.erro}`);
    return NextResponse.json({ ok: false, erro: "email" }, { status: 502 });
  }

  const confirmacao = cartaDeContacto({
    locale,
    nome: name,
    empresa: company,
    telefone: phone,
    janela: janela ? (JANELAS[locale][janela] ?? "") : "",
    mensagem: message,
    temAnexo: anexo !== undefined,
  });

  // A confirmação a quem escreveu. Falhar aqui não invalida o pedido, que já
  // está gravado e já foi avisado — por isso não devolve erro.
  const recibo = await enviaEmail({ voz: "cliente", to: email, replyTo: paraCasa, ...confirmacao });
  if (!recibo.ok) console.error(`[contacto] a confirmação não saiu (${recibo.via}): ${recibo.erro}`);

  // O negócio no Pipedrive abre-se depois da resposta. São três chamadas a um
  // servidor de fora e quem submeteu não tem de esperar por elas — e se
  // falharem, o pedido está gravado e avisado de qualquer maneira.
  after(async () => {
    await abreNegocio({
      nome: name,
      empresa: company,
      email,
      telefone: phone,
      janela: janela ? (JANELAS.pt[janela] ?? "") : "",
      mensagem: message,
      ...(briefing ? { briefingUrl: absoluto(briefing.url) } : {}),
      ...(briefing?.conteudo
        ? { ficheiro: { nome: briefing.nome, bytes: briefing.conteudo, tipo: briefing.tipo ?? "application/pdf" } }
        : {}),
      ...(registoId !== undefined ? { mensagemId: registoId } : {}),
    });
  });

  // O `via` diz por onde saiu — brevo, resend, ou o log de desenvolvimento. Não
  // é segredo nenhum e poupa uma ida aos registos do servidor quando alguém
  // pergunta se o email saiu.
  return NextResponse.json({ ok: true, via: aviso.via, recibo: recibo.via });
}
