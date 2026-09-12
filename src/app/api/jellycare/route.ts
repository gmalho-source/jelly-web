import { NextResponse, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import { enviaEmail } from "@/lib/email";
import { avisoDeSubscricao, cartaDeSubscricaoCare } from "@/lib/email-jellycare";
import { indicativoDe } from "@/lib/indicativos";
import { campanhaDe, emEuros } from "@/lib/campanha";
import { isValidEmail, normalizeEmail } from "@/lib/billing/auth";
import { withinRateLimit } from "@/lib/billing/store";
import { getCarePlans } from "@/lib/cms";
import { envOr } from "@/lib/env";

export const runtime = "nodejs";

/**
 * A subscrição do JellyCARE.
 *
 * A mesma mecânica da página de contactos, e de propósito: grava primeiro,
 * avisa depois, e o pedido fica na mesma caixa de mensagens com a origem
 * marcada. O email é o aviso, não o arquivo.
 *
 * O plano não se acredita: chega uma chave do formulário e vai-se buscar o
 * nome e o preço ao painel. Sem isto, bastava alterar o valor do `radio` no
 * browser para a casa receber um pedido de um plano que não existe.
 */
export async function POST(request: NextRequest) {
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
  const site = texto("site", 200);
  const notas = texto("notas", 2000);
  const chave = texto("plano", 60);
  const infetado = dados.get("infetado") === "on";
  const consent = dados.get("consent") === "on";
  const numero = texto("phone", 30).replace(/[^\d\s]/g, "").trim();
  const phone = numero ? `${indicativoDe(texto("dial", 2).toUpperCase()).codigo} ${numero}` : "";

  // A mesma regra do formulário, aqui outra vez: a validação do browser é uma
  // cortesia, não uma garantia.
  if (!name || !site || !consent || !isValidEmail(email) || numero.replace(/\D/g, "").length < 6) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
  if (!withinRateLimit(`jellycare:${ip}`, 5, 60 * 60)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const locale = request.headers.get("referer")?.includes("/en/") ? "en" : "pt";

  // O nome do plano vem do painel, não do formulário. Se a chave não existir —
  // um plano desligado entretanto, ou alguém a mexer no pedido — fica o que
  // veio, marcado, para quem responde perceber o que aconteceu.
  const planos = await getCarePlans();
  const escolhido = planos.find((plano) => plano.key === chave);
  /*
   * O plano escrito duas vezes, e não é redundância.
   *
   * O que fica gravado e o que vai no aviso à casa é sempre português: o
   * arquivo e a caixa de quem responde são desta casa, e uma lista de
   * subscrições metade em inglês não se lê de uma vez. A carta de quem
   * subscreveu vai na língua em que ele leu a página.
   */
  const nomeDoPlano = (lingua: "pt" | "en") =>
    escolhido
      ? `${escolhido.name} (${emEuros(escolhido.price, lingua)}/${lingua === "pt" ? "mês" : "month"})`
      : chave
        ? `${chave} (fora da lista)`
        : "sem plano";
  const plano = nomeDoPlano(locale);
  const planoPt = nomeDoPlano("pt");

  /*
   * A campanha, na língua de quem subscreveu e na da casa.
   *
   * Sai da mesma função que escreve a frase no cartão de preços, para a
   * confirmação não prometer um desconto diferente do que a página anunciou. A
   * versão portuguesa é a que fica gravada e a que vai no aviso interno; a da
   * língua de quem subscreveu vai na carta que ele recebe.
   */
  const campanha = escolhido ? campanhaDe(escolhido, locale)?.detalhe : undefined;
  const campanhaPt = escolhido ? campanhaDe(escolhido, "pt")?.detalhe : undefined;

  /*
   * O que fica gravado, na caixa de sempre. A mensagem é o texto que quem
   * responde lê primeiro, por isso leva o essencial já montado: o plano, o
   * site, o aviso de infeção e as notas de quem subscreveu.
   */
  const message = [
    `Subscrição JellyCARE — ${planoPt}`,
    campanhaPt ? `Campanha: ${campanhaPt}` : "",
    `Website: ${site}`,
    infetado ? "Assinalou que o site está infetado com malware." : "",
    notas ? `\n${notas}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  let registoId: string | number | undefined;
  try {
    const payload = await getPayload({ config });
    const registo = await payload.create({
      collection: "messages",
      data: { name, company, email, phone, message, locale, status: "nova", origin: "jellycare", plan: planoPt, site },
    });
    registoId = registo.id;
  } catch (error) {
    console.error("[jellycare] não gravou a subscrição", error);
  }

  const paraCasa = envOr(process.env.CONTACT_TO_EMAIL, "gmalho@jelly.pt");

  const aviso = await enviaEmail({
    voz: "cliente",
    to: paraCasa,
    replyTo: email,
    ...avisoDeSubscricao({
      nome: name,
      empresa: company,
      email,
      telefone: phone,
      plano: planoPt,
      ...(campanhaPt ? { campanha: campanhaPt } : {}),
      site,
      infetado,
      notas,
      mensagemId: registoId,
    }),
  });

  // Sem chave de email — em desenvolvimento — o texto fica no log e o pedido
  // conta como aceite. Com chave e com recusa, é outra coisa: o pedido está
  // gravado mas ninguém foi avisado.
  if (!aviso.ok && aviso.via !== "log") {
    console.error(`[jellycare] o aviso à casa não saiu (${aviso.via}): ${aviso.erro}`);
    return NextResponse.json({ ok: false, erro: "email" }, { status: 502 });
  }

  const recibo = await enviaEmail({
    voz: "cliente",
    to: email,
    replyTo: paraCasa,
    ...cartaDeSubscricaoCare({
      locale,
      nome: name,
      empresa: company,
      telefone: phone,
      plano,
      ...(campanha ? { campanha } : {}),
      site,
      infetado,
      notas,
    }),
  });
  if (!recibo.ok) console.error(`[jellycare] a confirmação não saiu (${recibo.via}): ${recibo.erro}`);

  return NextResponse.json({ ok: true, via: aviso.via, recibo: recibo.via });
}
