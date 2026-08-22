import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
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

  const texto = (chave: string, limite: number) => String(dados.get(chave) ?? "").trim().slice(0, limite);
  const name = texto("name", 120);
  const company = texto("company", 120);
  const email = normalizeEmail(texto("email", 160));
  const message = texto("message", 4000);
  const start = texto("start", 20);
  const brief = dados.get("brief");

  if (!name || !message || !isValidEmail(email)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`contacto:${ip}`, 5, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const JANELAS: Record<string, string> = {
    "um-mes": "dentro de um mês",
    "dois-tres": "dentro de dois a três meses",
    "mais-tarde": "mais para a frente",
    "nao-sei": "ainda não sabe",
  };

  const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "pt";
  const text = [
    `Nome: ${name}`,
    `Empresa ou marca: ${company || "—"}`,
    `Email: ${email}`,
    `Quer arrancar: ${JANELAS[start] ?? "—"}`,
    "",
    message,
  ].join("\n");

  // O registo primeiro. Se a base falhar, o pedido não se perde por isso: o
  // email sai a seguir de qualquer maneira.
  // O id do anexo é numérico nesta base; o campo da janela só aceita os quatro
  // valores da lista, e o que vier de fora dela não entra.
  let anexo: number | undefined;
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
      try {
        const guardado = await payload.create({
          collection: "attachments",
          data: { note: `Briefing de ${name}${company ? ` (${company})` : ""}` },
          file: {
            name: brief.name,
            data: Buffer.from(await brief.arrayBuffer()),
            mimetype: brief.type || "application/pdf",
            size: brief.size,
          },
        });
        anexo = Number(guardado.id);
      } catch (error) {
        console.error("[contacto] o briefing não entrou", error);
      }
    }

    await payload.create({
      collection: "messages",
      data: { name, company, email, message, locale, status: "nova", start: janela, brief: anexo },
    });
  } catch (error) {
    console.error("[contacto] não gravou a mensagem", error);
  }

  const de = envOr(process.env.MAIL_FROM, "Jelly <hello@jelly.pt>");
  const paraCasa = envOr(process.env.CONTACT_TO_EMAIL, "gmalho@jelly.pt");

  const aviso = await enviaEmail({
    from: de,
    to: paraCasa,
    replyTo: email,
    subject: `Briefing de ${name}${company ? ` (${company})` : ""}`,
    text: `${text}${anexo ? "\n\nVeio com briefing em anexo: está no painel." : ""}\n\nFica também no painel, em Mensagens.`,
  });

  // Sem chave de email — em desenvolvimento — o texto fica no log e o pedido
  // conta como aceite. Com chave e com recusa, é outra coisa: o pedido está
  // gravado mas ninguém foi avisado, e quem submeteu tem de saber que precisa
  // de insistir por outro caminho.
  if (!aviso.ok && aviso.via !== "log") {
    console.error(`[contacto] o aviso à casa não saiu (${aviso.via}): ${aviso.erro}`);
    return NextResponse.json({ ok: false, erro: "email" }, { status: 502 });
  }

  const confirmacao =
    locale === "en"
      ? {
          subject: "The change is about to start",
          text: `Hello ${name.split(" ")[0]},\n\nYour message reached us and someone from our team will get in touch shortly to answer your challenge.\n\nWhat you sent us:\n\n${message}\n\nIf you want to add anything, just reply to this email.\n\nJelly`,
        }
      : {
          subject: "A mudança está prestes a começar",
          text: `Olá ${name.split(" ")[0]},\n\nA sua mensagem chegou. Um elemento da nossa equipa entrará brevemente em contacto para responder ao seu desafio.\n\nO que nos enviou:\n\n${message}\n\nSe quiser acrescentar algo, basta responder a este email.\n\nJelly`,
        };

  // A confirmação a quem escreveu. Falhar aqui não invalida o pedido, que já
  // está gravado e já foi avisado — por isso não devolve erro.
  const recibo = await enviaEmail({ from: de, to: email, replyTo: paraCasa, ...confirmacao });
  if (!recibo.ok) console.error(`[contacto] a confirmação não saiu (${recibo.via}): ${recibo.erro}`);

  // O `via` diz por onde saiu — brevo, resend, ou o log de desenvolvimento. Não
  // é segredo nenhum e poupa uma ida aos registos do servidor quando alguém
  // pergunta se o email saiu.
  return NextResponse.json({ ok: true, via: aviso.via, recibo: recibo.via });
}
