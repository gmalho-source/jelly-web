import type { PayloadHandler, PayloadRequest } from "payload";
import { chave, fichaDoCabecalho, juntaFichas, lerData, type CampoDaFicha, type Ficha } from "@/lib/ficha-tecnica";
import { markdownParaLexical, trazImagem, type Guarda } from "@/lib/markdown-lexical";
import { aSlug } from "../hooks/slug-etiqueta";

/**
 * Um ficheiro Markdown a povoar um artigo: texto, formatação e imagens.
 *
 * O trabalho está em `src/lib/markdown-lexical.ts`, que corre sem base de dados
 * e por isso se pode conferir num guião. Aqui fica o que é do servidor: a porta
 * e a criação dos ficheiros na biblioteca.
 *
 * E a ficha técnica: o que o documento diz sobre si — título, data, autor,
 * categoria, etiquetas, capa, resumo — passa aqui a valores de campo. Só se
 * resolvem os campos que o painel diz estarem vazios (`preencher`), para uma
 * reimportação não pisar o que alguém já mudou, e para não se criarem
 * etiquetas que ninguém vai usar.
 *
 * POST /api/posts/markdown
 *   { markdown, nome, ficha?, preencher?, lingua?, id?, tituloAtual? }
 */
export const importMarkdown: PayloadHandler = async (req) => {
  if (!req.user) return Response.json({ error: "Sem sessão." }, { status: 401 });

  let markdown = "";
  let nome = "";
  let pedido: Pedido = {};
  try {
    const corpo = (await req.json?.()) as ({ markdown?: string; nome?: string } & Pedido) | undefined;
    markdown = String(corpo?.markdown ?? "");
    nome = String(corpo?.nome ?? "");
    pedido = corpo ?? {};
  } catch {
    return Response.json({ error: "Corpo do pedido ilegível." }, { status: 400 });
  }

  if (!markdown.trim()) return Response.json({ error: "O ficheiro está vazio." }, { status: 400 });

  const guarda: Guarda = async (ficheiro) => {
    const guardada = await req.payload.create({
      collection: "media",
      data: { alt: ficheiro.alt },
      file: { name: ficheiro.nome, data: ficheiro.bytes, mimetype: ficheiro.tipo, size: ficheiro.bytes.length },
    });
    return guardada.id;
  };

  const importado = await markdownParaLexical(
    markdown,
    guarda,
    // A configuração vem do pedido e não de `@payload-config`. Importá-la aqui
    // fechava um círculo — a configuração carrega as coleções, as coleções
    // carregam este endpoint, e o endpoint voltava à configuração —, e um
    // círculo à volta da configuração deixa o leitor do CMS a meio de arrancar
    // em qualquer rota que entre por ele em execução. O `req.payload.config` é
    // a mesma configuração, já resolvida, sem passar por cima de ninguém.
    { nome, config: req.payload.config },
  );

  // O Word manda a ficha já lida; o Markdown traz a sua no cabeçalho. O título
  // do cabeçalho — o estilo «Título» de um Word, o `title:` de um .md — ganha
  // à linha «Título» da ficha, que é para quando o documento não o tem.
  const ficha = juntaFichas(pedido.ficha ?? {}, fichaDoCabecalho(importado.cabecalho));
  const resolvida = await resolveFicha(req, ficha, pedido, guarda, nome);

  return Response.json({ ...importado, ficha: resolvida });
};

type Pedido = {
  ficha?: Ficha;
  /** Os campos da ficha que estão vazios no artigo — os únicos que se resolvem. */
  preencher?: CampoDaFicha[];
  lingua?: "pt" | "en";
  /** O artigo aberto, para o slug dele não contar como ocupado. */
  id?: number | string;
  /** O título que o artigo já tem, para o slug quando o documento não traz um. */
  tituloAtual?: string;
};

type Ligado = { id: number | string; nome: string; nova?: boolean };

export type FichaResolvida = {
  /** O que o documento trazia, preenchido ou não. */
  presentes: CampoDaFicha[];
  campos: Partial<{
    titulo: string;
    slug: string;
    data: string;
    autor: Ligado;
    categoria: Ligado;
    etiquetas: Ligado[];
    capa: Ligado;
    resumo: string;
  }>;
  avisos: string[];
};

/** Um slug com até sessenta caracteres, cortado num hífen e não a meio de uma palavra. */
function slugCurto(texto: string) {
  const inteiro = aSlug(texto);
  if (inteiro.length <= 60) return inteiro;
  const cortado = inteiro.slice(0, 61);
  return cortado.slice(0, cortado.lastIndexOf("-") > 20 ? cortado.lastIndexOf("-") : 60).replace(/-+$/, "");
}

async function resolveFicha(
  req: PayloadRequest,
  ficha: Ficha,
  pedido: Pedido,
  guarda: Guarda,
  nome: string,
): Promise<FichaResolvida> {
  const { payload } = req;
  const quer = new Set(pedido.preencher ?? []);
  const campos: FichaResolvida["campos"] = {};
  const avisos: string[] = [];
  const presentes = (Object.keys(ficha) as CampoDaFicha[]).filter((campo) => ficha[campo] !== undefined);
  const baseDoSlug = ficha.slug || ficha.titulo || pedido.tituloAtual || "";
  if (baseDoSlug && !presentes.includes("slug")) presentes.push("slug");

  if (quer.has("titulo") && ficha.titulo) campos.titulo = ficha.titulo;
  if (quer.has("resumo") && ficha.resumo) {
    campos.resumo = ficha.resumo;
    if (ficha.resumo.length > 160) avisos.push(`o resumo tem ${ficha.resumo.length} caracteres — o Google corta perto dos 155`);
  }

  if (quer.has("slug") && baseDoSlug) {
    const campo = pedido.lingua === "en" ? "slugEn" : "slug";
    const base = slugCurto(baseDoSlug);
    for (let numero = 1; base && numero < 50; numero += 1) {
      const tentativa = numero === 1 ? base : `${base}-${numero}`;
      const { totalDocs } = await payload.count({
        collection: "posts",
        where: {
          and: [{ [campo]: { equals: tentativa } }, ...(pedido.id ? [{ id: { not_equals: pedido.id } }] : [])],
        },
      });
      if (!totalDocs) {
        campos.slug = tentativa;
        if (numero > 1) avisos.push(`o slug «${base}» já é de outro artigo — ficou «${tentativa}»`);
        break;
      }
    }
  }

  if (quer.has("data") && ficha.data) {
    const data = lerData(ficha.data);
    if (data) campos.data = `${data}T12:00:00.000Z`;
    else avisos.push(`a data «${ficha.data}» não se percebe — escreve-a como 28/09/2026`);
  }

  if (quer.has("autor") && ficha.autor) {
    const { docs } = await payload.find({ collection: "authors", limit: 500, depth: 0, pagination: false });
    const autor = docs.find((doc) => chave(String(doc.name ?? "")) === chave(ficha.autor!));
    if (autor) campos.autor = { id: autor.id, nome: String(autor.name) };
    else avisos.push(`o autor «${ficha.autor}» não existe em Editorial → Autores`);
  }

  if (quer.has("categoria") && ficha.categoria) {
    const { docs } = await payload.find({ collection: "categories", limit: 200, depth: 0, pagination: false });
    const procura = chave(ficha.categoria);
    const categoria = docs.find((doc) =>
      [doc.titlePt, doc.titleEn, doc.slug].some((valor) => valor && chave(String(valor)) === procura),
    );
    if (categoria) campos.categoria = { id: categoria.id, nome: String(categoria.titlePt) };
    else avisos.push(`a categoria «${ficha.categoria}» não existe em Editorial → Categorias`);
  }

  if (quer.has("etiquetas") && ficha.etiquetas?.length) {
    const { docs } = await payload.find({ collection: "tags", limit: 2000, depth: 0, pagination: false });
    const etiquetas: Ligado[] = [];
    for (const nomeDaEtiqueta of ficha.etiquetas) {
      const procura = chave(nomeDaEtiqueta);
      const existe = docs.find(
        (doc) =>
          [doc.titlePt, doc.titleEn].some((valor) => valor && chave(String(valor)) === procura) ||
          doc.slug === aSlug(nomeDaEtiqueta),
      );
      if (existe) {
        if (!etiquetas.some((e) => e.id === existe.id)) etiquetas.push({ id: existe.id, nome: String(existe.titlePt) });
        continue;
      }
      try {
        const nova = await payload.create({ collection: "tags", data: { titlePt: nomeDaEtiqueta } as never });
        docs.push(nova);
        etiquetas.push({ id: nova.id, nome: nomeDaEtiqueta, nova: true });
      } catch {
        avisos.push(`não consegui criar a etiqueta «${nomeDaEtiqueta}»`);
      }
    }
    if (etiquetas.length) campos.etiquetas = etiquetas;
  }

  if (quer.has("capa") && ficha.capa) {
    try {
      const id = await trazImagem(
        { indice: 0, alt: ficha.titulo || pedido.tituloAtual || "", origem: ficha.capa },
        guarda,
        `${nome.replace(/\.[^.]+$/, "") || "artigo"}-capa`,
      );
      campos.capa = { id, nome: "capa" };
    } catch (erro) {
      avisos.push(`a capa não entrou: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    }
  }

  return { presentes, campos, avisos };
}
