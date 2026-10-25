import { NextResponse, after, type NextRequest } from "next/server";
import { getPayload } from "payload";
import config from "@payload-config";
import { withinRateLimit } from "@/lib/billing/store";
import { destinatarios, enviaEmail } from "@/lib/email";
import { comRespostas, dadosLimpos, emTexto, erroDe, identidade, visiveis } from "@/lib/inqueritos/logica";
import { formularioDe, porChave, type DocDoInquerito, type DocDoLink } from "@/lib/inqueritos/servidor";
import type { Dados, Formulario } from "@/lib/inqueritos/tipos";
import { notaNoNegocio } from "@/lib/pipedrive";

export const runtime = "nodejs";

/** Quantas vezes uma resposta se pode gravar: de sobra para quem responde, pouco para quem abusa. */
const GRAVACOES = 400;

type Corpo = { sessao?: unknown; valores?: unknown; concluir?: unknown };

const escapa = (texto: string) => texto.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] ?? c);

/** As respostas em linhas de «pergunta: resposta», pela ordem do inquérito. */
function resumo(formulario: Formulario, dados: Dados): { pergunta: string; resposta: string }[] {
  return formulario.perguntas
    .filter((pergunta) => dados.valores[pergunta.chave] !== undefined)
    .map((pergunta) => ({ pergunta: comRespostas(pergunta.titulo, formulario.perguntas, dados.valores, dados), resposta: emTexto(pergunta, dados.valores[pergunta.chave], dados) }));
}

/**
 * Grava a resposta de quem está a responder.
 *
 * A página chama isto um momento depois de cada resposta, e outra vez no fim
 * com `concluir`. A sessão é um código aleatório que o browser escolhe e
 * guarda: é ela que liga as gravações à mesma resposta. Tudo o que chega é
 * arrumado à medida das perguntas — uma opção que não existe ou um número
 * fora da escala não entram — e no fim confirma-se que as obrigatórias que
 * aparecem estão respondidas.
 *
 * No fim saem dois avisos, depois da resposta ao browser: um email a quem o
 * inquérito diz para avisar, e uma nota no negócio do Pipedrive, se o link
 * pessoal tiver um.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  const texto = await request.text();
  if (texto.length > 200_000) return NextResponse.json({ ok: false, erro: "grande demais" }, { status: 413 });
  let corpo: Corpo;
  try {
    corpo = JSON.parse(texto) as Corpo;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const sessao = String(corpo.sessao ?? "");
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(sessao)) return NextResponse.json({ ok: false }, { status: 400 });
  const brutos = corpo.valores && typeof corpo.valores === "object" ? (corpo.valores as Record<string, unknown>) : {};
  const concluir = corpo.concluir === true;

  const payload = await getPayload({ config });
  const encontrado = await porChave(payload, chave);
  if (!encontrado) return NextResponse.json({ ok: false }, { status: 404 });
  const { inquerito, link } = encontrado;
  const { user } = await payload.auth({ headers: request.headers }).catch(() => ({ user: null }));

  // Rascunho: só a equipa vê, e nada se grava.
  if (inquerito.estado === "rascunho") {
    return user ? NextResponse.json({ ok: true, previa: true }) : NextResponse.json({ ok: false }, { status: 404 });
  }
  if (inquerito.estado === "fechado") return NextResponse.json({ ok: false, erro: "O inquérito terminou." }, { status: 410 });
  if (link?.respondidoEm) return NextResponse.json({ ok: false, jaRespondido: true }, { status: 409 });

  const formulario = formularioDe(inquerito);
  const preenchidos: Record<string, unknown> = {};
  for (const pergunta of formulario.perguntas) {
    if (pergunta.preencher === "empresa" && link?.empresa) preenchidos[pergunta.chave] = link.empresa;
    if (pergunta.preencher === "nome" && link?.nome) preenchidos[pergunta.chave] = link.nome;
  }
  const dados = dadosLimpos(formulario.perguntas, { ...brutos, ...preenchidos });

  if (concluir) {
    for (const pergunta of visiveis(formulario.perguntas, dados.valores)) {
      const problema = erroDe(pergunta, dados.valores[pergunta.chave], formulario.lingua);
      if (problema) return NextResponse.json({ ok: false, erro: problema, chave: pergunta.chave }, { status: 422 });
    }
  }

  const existentes = await payload.find({
    collection: "inqueritos-respostas",
    where: { sessao: { equals: sessao } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const existente = existentes.docs[0] as { id: number | string; inquerito?: number | string; estado?: string; gravacoes?: number | null } | undefined;
  if (existente && String(existente.inquerito) !== String(inquerito.id)) return NextResponse.json({ ok: false }, { status: 400 });
  // Uma resposta já concluída não se reabre: um segundo «Enviar» é o mesmo envio.
  if (existente?.estado === "completa") return NextResponse.json({ ok: true });
  if ((existente?.gravacoes ?? 0) >= GRAVACOES) return NextResponse.json({ ok: false }, { status: 429 });

  if (!existente) {
    // Só as respostas novas contam para o limite: cada uma é uma linha na base.
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconhecido";
    if (!(await withinRateLimit(`inquerito:${ip}`, 30, 60 * 60))) return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { empresa, nome } = identidade(formulario.perguntas, dados.valores);
  const agora = new Date().toISOString();
  const campos = {
    dados,
    empresa: empresa || link?.empresa || "",
    nome: nome || link?.nome || "",
    titulo: [empresa || link?.empresa, nome || link?.nome].filter(Boolean).join(" · ") || (formulario.lingua === "en" ? "Anonymous answer" : "Resposta anónima"),
    gravacoes: (existente?.gravacoes ?? 0) + 1,
    ...(concluir ? { estado: "completa" as const, concluidaEm: agora } : {}),
  };

  const gravada = existente
    ? await payload.update({ collection: "inqueritos-respostas", id: existente.id, data: campos, overrideAccess: true })
    : await payload.create({
        collection: "inqueritos-respostas",
        data: {
          ...campos,
          inquerito: Number(inquerito.id),
          sessao,
          estado: concluir ? "completa" : "incompleta",
          origem: user ? "equipa" : link ? "pessoal" : "geral",
          ...(user ? { preenchidaPor: Number(user.id) } : {}),
          ...(link ? { link: Number(link.id), pipedriveId: link.pipedriveId ?? undefined } : {}),
          iniciadaEm: agora,
        },
        overrideAccess: true,
      });

  if (concluir) {
    if (link) {
      await payload.update({
        collection: "inqueritos-links",
        id: link.id,
        data: { respondidoEm: agora, resposta: Number(gravada.id) },
        overrideAccess: true,
      });
    }
    const origem = request.nextUrl.origin;
    after(() => avisos(inquerito, link, formulario, dados, gravada.id, campos.titulo, origem));
  }

  return NextResponse.json({ ok: true });
}

/** O email a quem o inquérito diz para avisar, e a nota no Pipedrive. Nenhuma falha aqui chega a quem respondeu. */
async function avisos(inquerito: DocDoInquerito, link: DocDoLink | null, formulario: Formulario, dados: Dados, id: number | string, titulo: string, origem: string) {
  const linhas = resumo(formulario, dados);
  const noPainel = `${origem}/admin/collections/inqueritos-respostas/${id}`;
  const para = destinatarios(inquerito.avisar ?? "");

  for (const destinatario of para) {
    try {
      await enviaEmail({
        to: destinatario,
        subject: `Nova resposta: ${formulario.titulo}${titulo ? ` · ${titulo}` : ""}`,
        text: [`${formulario.titulo}`, titulo, "", ...linhas.map((linha) => `${linha.pergunta}\n${linha.resposta}\n`), `No painel: ${noPainel}`].join("\n"),
        html: [
          `<p style="font:600 16px/1.4 sans-serif;margin:0 0 4px">${escapa(formulario.titulo)}</p>`,
          `<p style="font:14px/1.4 sans-serif;color:#555;margin:0 0 20px">${escapa(titulo)}</p>`,
          ...linhas.map(
            (linha) =>
              `<p style="font:13px/1.4 sans-serif;color:#555;margin:0">${escapa(linha.pergunta)}</p><p style="font:15px/1.5 sans-serif;margin:2px 0 14px">${escapa(linha.resposta).replace(/\n/g, "<br>")}</p>`,
          ),
          `<p style="font:14px/1.4 sans-serif;margin-top:20px"><a href="${noPainel}">Ver no painel</a></p>`,
        ].join(""),
      });
    } catch (erro) {
      console.error("[inqueritos] o aviso por email não saiu", erro);
    }
  }

  if (link?.pipedriveId) {
    const nota = [
      `<b>Inquérito «${escapa(formulario.titulo)}» respondido</b>`,
      "",
      ...linhas.map((linha) => `<i>${escapa(linha.pergunta)}</i><br>${escapa(linha.resposta).replace(/\n/g, "<br>")}<br>`),
      `<a href="${noPainel}">Ver a resposta no site</a>`,
    ].join("<br>");
    await notaNoNegocio(link.pipedriveId, nota);
  }
}
