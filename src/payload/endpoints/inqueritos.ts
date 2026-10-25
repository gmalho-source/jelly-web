import { randomBytes } from "node:crypto";
import type { PayloadHandler, PayloadRequest } from "payload";
import { podeNoPedido } from "../acesso";
import { env } from "@/lib/env";
import { emTexto, identidade, legiveis, limites } from "@/lib/inqueritos/logica";
import { dataDe, filtrosDe, perguntasDe, respostasDe, type DocDoInquerito } from "@/lib/inqueritos/servidor";
import { ORIGENS } from "@/lib/inqueritos/tipos";
import * as typeform from "@/lib/inqueritos/typeform";
import { procuraNegocios } from "@/lib/pipedrive";

/**
 * As portas do painel para os inquéritos. Só quem tem o módulo passa.
 *
 * POST /api/inqueritos/:id/trocar-chave        o link geral passa a ser outro
 * GET  /api/inqueritos/:id/exportar            as respostas em CSV, com os filtros da tabela
 * POST /api/inqueritos/:id/typeform/perguntas  traz as perguntas do Typeform
 * POST /api/inqueritos/:id/typeform/respostas  traz as respostas do Typeform
 * GET  /api/inqueritos-links/negocios?q=       procura negócios no Pipedrive
 */
function porta(req: PayloadRequest) {
  if (!podeNoPedido(req, "inqueritos")) return Response.json({ error: "Sem acesso aos inquéritos." }, { status: 403 });
  return null;
}

async function inqueritoDe(req: PayloadRequest): Promise<DocDoInquerito | null> {
  const id = req.routeParams?.id;
  if (!id) return null;
  return (await req.payload.findByID({ collection: "inqueritos", id: String(id), depth: 0, overrideAccess: true }).catch(() => null)) as DocDoInquerito | null;
}

/**
 * A chave do Typeform, das variáveis de ambiente. O nome com que foi criada na
 * Vercel ficou «TYPEFORM_APY_KEY»; lê-se esse e o nome direito, para que
 * corrigir um dia não parta nada.
 */
const chaveDoTypeform = () =>
  env(process.env.TYPEFORM_API_KEY) ?? env(process.env.TYPEFORM_APY_KEY) ?? env(process.env.TYPEFORM_TOKEN);

export const trocarChaveDoInquerito: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const doc = await inqueritoDe(req);
  if (!doc) return Response.json({ error: "Inquérito não encontrado." }, { status: 404 });
  const chave = randomBytes(18).toString("base64url");
  await req.payload.update({ collection: "inqueritos", id: doc.id, data: { chave }, overrideAccess: true, context: { trocarChave: true } });
  return Response.json({ chave });
};

/** Uma célula de CSV: entre aspas quando precisa, e com as aspas dobradas. */
const celula = (valor: unknown) => {
  const texto = String(valor ?? "").replace(/\r?\n/g, " ");
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

/**
 * As respostas em CSV, com os mesmos filtros da tabela.
 *
 * Ponto e vírgula e BOM no início: é o que o Excel em português abre sem
 * perguntas, com os acentos certos e cada pergunta na sua coluna. As grelhas
 * e os grupos de campos abrem uma coluna por linha.
 */
export const exportar: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const doc = await inqueritoDe(req);
  if (!doc) return Response.json({ error: "Inquérito não encontrado." }, { status: 404 });

  const perguntas = legiveis(perguntasDe(doc));
  const filtros = filtrosDe(new URL(req.url ?? "http://localhost").searchParams);
  const respostas = await respostasDe(req.payload, doc.id, filtros);
  const origem = Object.fromEntries(ORIGENS.map((o) => [o.value, o.label]));

  const cabecalho = ["Data", "Estado", "Origem", "Empresa", "Nome", "Negócio no Pipedrive"];
  for (const pergunta of perguntas) {
    if (pergunta.tipo === "grelha" || pergunta.tipo === "campos") for (const linha of pergunta.linhas ?? []) cabecalho.push(`${pergunta.titulo} — ${linha.rotulo}`);
    else cabecalho.push(pergunta.tipo === "escala" || pergunta.tipo === "nps" ? `${pergunta.titulo} (${limites(pergunta).join("–")})` : pergunta.titulo);
  }

  const linhas = respostas.map((resposta) => {
    const dados = resposta.dados ?? { valores: {} };
    const data = dataDe(resposta);
    const celulas: unknown[] = [
      data ? new Date(data).toLocaleString("pt-PT", { timeZone: "Europe/Lisbon" }) : "",
      resposta.estado === "completa" ? "Completa" : "Incompleta",
      origem[resposta.origem ?? ""] ?? "",
      resposta.empresa ?? "",
      resposta.nome ?? "",
      resposta.pipedriveId ?? "",
    ];
    for (const pergunta of perguntas) {
      const valor = dados.valores?.[pergunta.chave];
      if (pergunta.tipo === "grelha" || pergunta.tipo === "campos") {
        const mapa = (valor ?? {}) as Record<string, string>;
        for (const linha of pergunta.linhas ?? []) {
          const escolhida = mapa[linha.chave];
          celulas.push(
            pergunta.tipo === "grelha"
              ? (pergunta.opcoes?.find((opcao) => opcao.chave === escolhida)?.rotulo ?? dados.rotulos?.[escolhida] ?? "")
              : (escolhida ?? ""),
          );
        }
      } else {
        celulas.push(emTexto(pergunta, valor, dados));
      }
    }
    return celulas.map(celula).join(";");
  });

  const nome = `${(doc.titulo ?? "inquerito").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^A-Za-z0-9]+/g, "-").toLowerCase()}-respostas.csv`;
  return new Response(`﻿${[cabecalho.map(celula).join(";"), ...linhas].join("\r\n")}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nome}"`,
      "cache-control": "no-store",
    },
  });
};

/**
 * Traz as perguntas do Typeform para um inquérito ainda sem perguntas.
 *
 * Num inquérito que já as tem, só com `?substituir=1` — o botão pergunta
 * antes —, porque trazer outra vez apaga as correções feitas no painel. As
 * respostas não se perdem: as perguntas voltam com as mesmas chaves (as
 * referências do Typeform). As imagens das opções vêm para a biblioteca do
 * site, e as que já cá estavam reaproveitam-se em vez de virem outra vez.
 */
export const trazerPerguntas: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const doc = await inqueritoDe(req);
  if (!doc) return Response.json({ error: "Inquérito não encontrado." }, { status: 404 });
  const token = chaveDoTypeform();
  if (!token) return Response.json({ error: "Falta a chave do Typeform nas variáveis de ambiente (TYPEFORM_API_KEY)." }, { status: 400 });
  if (!doc.typeformId) return Response.json({ error: "Escreva primeiro o código do formulário do Typeform e grave." }, { status: 400 });
  const substituir = new URL(req.url ?? "http://localhost").searchParams.get("substituir") === "1";
  if (doc.perguntas?.length && !substituir) {
    return Response.json({ error: "Este inquérito já tem perguntas. Trazê-las outra vez substitui as que estão aqui." }, { status: 409 });
  }

  let traducao: typeform.Traducao;
  try {
    traducao = typeform.traduz(await typeform.definicao(token, doc.typeformId));
  } catch (erro) {
    return Response.json({ error: erro instanceof Error ? erro.message : "O Typeform não respondeu." }, { status: 502 });
  }

  const notas = [...traducao.notas];
  const imagensQueJaHa = new Map<string, number>();
  for (const pergunta of doc.perguntas ?? []) {
    for (const opcao of (pergunta.opcoes ?? []) as { chave?: string | null; imagem?: unknown }[]) {
      if (opcao.chave && typeof opcao.imagem === "number") imagensQueJaHa.set(opcao.chave, opcao.imagem);
    }
  }
  const perguntas = [];
  for (const pergunta of traducao.perguntas) {
    const opcoes = [];
    for (const opcao of pergunta.opcoes ?? []) {
      let imagem: number | undefined = imagensQueJaHa.get(opcao.chave);
      if (opcao.imagemUrl && !imagem) {
        try {
          const resposta = await fetch(opcao.imagemUrl);
          if (!resposta.ok) throw new Error(String(resposta.status));
          const bytes = Buffer.from(await resposta.arrayBuffer());
          const tipo = resposta.headers.get("content-type") || "image/jpeg";
          const criada = await req.payload.create({
            collection: "media",
            data: { alt: opcao.rotulo, title: `Inquérito · ${opcao.rotulo}` },
            file: { name: `inquerito-${opcao.chave}.${tipo.split("/")[1]?.split(";")[0] || "jpg"}`, data: bytes, mimetype: tipo, size: bytes.length },
            overrideAccess: true,
          });
          imagem = Number(criada.id);
        } catch (erro) {
          console.error("[inqueritos] a imagem não veio do Typeform", erro);
          notas.push(`A imagem da opção «${opcao.rotulo}» não veio: escolha-a no painel.`);
        }
      }
      opcoes.push({ chave: opcao.chave, rotulo: opcao.rotulo, ...(imagem ? { imagem } : {}) });
    }
    perguntas.push({ ...pergunta, opcoes });
  }

  await req.payload.update({
    collection: "inqueritos",
    id: doc.id,
    data: {
      titulo: doc.titulo || traducao.titulo,
      // A abertura e o fecho vêm se estiverem vazios, ou se se pediu para substituir.
      ...((!substituir && (doc.abertura?.titulo || doc.abertura?.texto)) || !traducao.abertura ? {} : { abertura: traducao.abertura }),
      ...((!substituir && (doc.fecho?.titulo || doc.fecho?.texto)) || !traducao.fecho ? {} : { fecho: traducao.fecho }),
      perguntas,
    } as never,
    overrideAccess: true,
  });
  return Response.json({ ok: true, perguntas: perguntas.length, notas });
};

/** Quantas respostas se criam por pedido: o resto fica para o pedido seguinte, que o painel faz sozinho. */
const POR_PEDIDO = 150;

/**
 * Traz as respostas do Typeform. Pode correr as vezes que for preciso: cada
 * resposta leva o token do Typeform, e as que já cá estão ficam como estão.
 */
export const importarRespostas: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const doc = await inqueritoDe(req);
  if (!doc) return Response.json({ error: "Inquérito não encontrado." }, { status: 404 });
  const token = chaveDoTypeform();
  if (!token) return Response.json({ error: "Falta a chave do Typeform nas variáveis de ambiente (TYPEFORM_API_KEY)." }, { status: 400 });
  if (!doc.typeformId) return Response.json({ error: "Escreva primeiro o código do formulário do Typeform e grave." }, { status: 400 });
  const perguntas = perguntasDe(doc);
  if (!perguntas.length) return Response.json({ error: "Traga primeiro as perguntas: as respostas precisam delas para se encaixarem." }, { status: 400 });

  let definicao: typeform.DefinicaoTF;
  let itens: Awaited<ReturnType<typeof typeform.respostas>>;
  try {
    definicao = await typeform.definicao(token, doc.typeformId);
    itens = await typeform.respostas(token, doc.typeformId);
  } catch (erro) {
    return Response.json({ error: erro instanceof Error ? erro.message : "O Typeform não respondeu." }, { status: 502 });
  }
  const escalas = typeform.escalasOriginais(definicao);

  const ja = new Set<string>();
  for (let pagina = 1; pagina < 100; pagina += 1) {
    const lote = await req.payload.find({
      collection: "inqueritos-respostas",
      where: { and: [{ inquerito: { equals: doc.id } }, { typeformToken: { exists: true } }] },
      limit: 1000,
      page: pagina,
      depth: 0,
      select: { typeformToken: true },
      overrideAccess: true,
    });
    for (const resposta of lote.docs as { typeformToken?: string | null }[]) if (resposta.typeformToken) ja.add(resposta.typeformToken);
    if (!lote.hasNextPage) break;
  }

  const novos = itens.filter((item) => {
    const tokenDaResposta = item.token ?? item.response_id;
    return tokenDaResposta && !ja.has(tokenDaResposta);
  });
  let criadas = 0;
  let semValores = 0;
  for (const item of novos.slice(0, POR_PEDIDO)) {
    const dados = typeform.valores(item, perguntas, escalas);
    if (!Object.keys(dados.valores).length) semValores += 1;
    const { empresa, nome } = identidade(perguntas, dados.valores);
    const quando = item.submitted_at ?? item.landed_at ?? new Date().toISOString();
    await req.payload.create({
      collection: "inqueritos-respostas",
      data: {
        inquerito: doc.id,
        origem: "typeform",
        estado: "completa",
        dados,
        empresa,
        nome,
        titulo: [empresa, nome].filter(Boolean).join(" · ") || "Resposta do Typeform",
        iniciadaEm: item.landed_at ?? quando,
        concluidaEm: quando,
        typeformToken: item.token ?? item.response_id,
      } as never,
      overrideAccess: true,
    });
    criadas += 1;
  }

  return Response.json({
    ok: true,
    noTypeform: itens.length,
    jaExistiam: itens.length - novos.length,
    criadas,
    faltam: Math.max(0, novos.length - criadas),
    semValores,
  });
};

export const negociosDoPipedrive: PayloadHandler = async (req) => {
  const fechada = porta(req);
  if (fechada) return fechada;
  const termo = (new URL(req.url ?? "http://localhost").searchParams.get("q") ?? "").slice(0, 80);
  const resultado = await procuraNegocios(termo);
  return Response.json(resultado, { status: resultado.ok ? 200 : 502 });
};
