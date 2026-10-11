import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Os PDFs das assinaturas: o documento gerado a partir de um modelo (o NDA) e a
 * página de certificado que se junta ao fim de qualquer documento assinado.
 *
 * Helvetica, das catorze que todo o leitor de PDF traz: um contrato não precisa
 * da fonte da casa, precisa de abrir em qualquer sítio daqui a dez anos. Cobre
 * o português todo (ã, ç, º, «») — o que não cobre é trocado antes de escrever.
 */
const A4 = { largura: 595.28, altura: 841.89 };
const MARGEM = { x: 64, topo: 72, base: 72 };
const TINTA = rgb(0.08, 0.09, 0.1);
const SUAVE = rgb(0.45, 0.49, 0.53);
const VERMELHO = rgb(0.867, 0.212, 0.29);

export type Bloco =
  | { t: "titulo"; texto: string }
  | { t: "clausula"; numero: string; titulo: string }
  | { t: "p"; texto: string; negrito?: boolean }
  | { t: "item"; texto: string }
  | { t: "espaco"; altura?: number };

/** O que a Helvetica não sabe escrever, trocado pelo que sabe. */
function limpa(texto: string, fonte: PDFFont): string {
  const trocado = texto
    .replace(/[​‌‍﻿]/g, "")
    .replace(/[‐‑]/g, "-")
    .replace(/ /g, " ");
  let saida = "";
  for (const letra of trocado) {
    try {
      fonte.encodeText(letra);
      saida += letra;
    } catch {
      saida += "?";
    }
  }
  return saida;
}

/** Parte um parágrafo em linhas que cabem na largura. */
function linhas(texto: string, fonte: PDFFont, tamanho: number, largura: number): string[] {
  const saida: string[] = [];
  for (const paragrafo of texto.split("\n")) {
    let atual = "";
    for (const palavra of paragrafo.split(/\s+/).filter(Boolean)) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra;
      if (fonte.widthOfTextAtSize(tentativa, tamanho) <= largura || !atual) atual = tentativa;
      else {
        saida.push(atual);
        atual = palavra;
      }
    }
    saida.push(atual);
  }
  return saida;
}

type Escritor = {
  doc: PDFDocument;
  pagina: PDFPage;
  y: number;
  regular: PDFFont;
  negrito: PDFFont;
  cabecalho: string;
};

function novaPagina(e: Escritor) {
  e.pagina = e.doc.addPage([A4.largura, A4.altura]);
  e.y = A4.altura - MARGEM.topo;
  e.pagina.drawText(limpa(e.cabecalho, e.regular), { x: MARGEM.x, y: A4.altura - 40, size: 8, font: e.regular, color: SUAVE });
}

function escreve(e: Escritor, texto: string, { tamanho = 10, fonte, cor = TINTA, entrelinha = 1.45, recuo = 0, centro = false } = {} as {
  tamanho?: number;
  fonte?: PDFFont;
  cor?: ReturnType<typeof rgb>;
  entrelinha?: number;
  recuo?: number;
  centro?: boolean;
}) {
  const f = fonte ?? e.regular;
  const largura = A4.largura - MARGEM.x * 2 - recuo;
  for (const linha of linhas(limpa(texto, f), f, tamanho, largura)) {
    if (e.y - tamanho * entrelinha < MARGEM.base) novaPagina(e);
    const x = centro ? (A4.largura - f.widthOfTextAtSize(linha, tamanho)) / 2 : MARGEM.x + recuo;
    e.pagina.drawText(linha, { x, y: e.y - tamanho, size: tamanho, font: f, color: cor });
    e.y -= tamanho * entrelinha;
  }
}

/** O rodapé de todas as páginas: a referência e a numeração. */
function numera(doc: PDFDocument, fonte: PDFFont, referencia: string, desde = 0) {
  const paginas = doc.getPages();
  const total = paginas.length;
  paginas.forEach((pagina, i) => {
    if (i < desde) return;
    const texto = limpa(`Ref. ${referencia} · Página ${i + 1} de ${total}`, fonte);
    pagina.drawText(texto, { x: A4.largura - MARGEM.x - fonte.widthOfTextAtSize(texto, 8), y: 36, size: 8, font: fonte, color: SUAVE });
  });
}

/** Um documento a partir de blocos de texto: o modelo do NDA. */
export async function geraDocumento(blocos: Bloco[], { cabecalho, referencia, titulo }: { cabecalho: string; referencia: string; titulo: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(titulo);
  doc.setAuthor("Jelly");
  doc.setCreator("jelly.pt");
  const e: Escritor = {
    doc,
    pagina: undefined as unknown as PDFPage,
    y: 0,
    regular: await doc.embedFont(StandardFonts.Helvetica),
    negrito: await doc.embedFont(StandardFonts.HelveticaBold),
    cabecalho,
  };
  novaPagina(e);

  for (const bloco of blocos) {
    if (bloco.t === "titulo") {
      escreve(e, bloco.texto, { tamanho: 14, fonte: e.negrito, centro: true });
      e.y -= 10;
    } else if (bloco.t === "clausula") {
      e.y -= 8;
      // A cláusula não fica sozinha no fundo da página, separada do texto.
      if (e.y - 60 < MARGEM.base) novaPagina(e);
      escreve(e, bloco.numero, { fonte: e.negrito, centro: true });
      escreve(e, `(${bloco.titulo})`, { centro: true });
      e.y -= 4;
    } else if (bloco.t === "p") {
      escreve(e, bloco.texto, { fonte: bloco.negrito ? e.negrito : e.regular });
      e.y -= 5;
    } else if (bloco.t === "item") {
      if (e.y - 15 < MARGEM.base) novaPagina(e);
      e.pagina.drawText("•", { x: MARGEM.x + 10, y: e.y - 10, size: 10, font: e.regular, color: TINTA });
      escreve(e, bloco.texto, { recuo: 24 });
      e.y -= 2;
    } else if (bloco.t === "espaco") {
      e.y -= bloco.altura ?? 12;
    }
  }

  numera(doc, e.regular, referencia);
  return doc.save();
}

export type LinhaDeCertificado = { rotulo: string; valor: string };

export type Certificado = {
  titulo: string;
  referencia: string;
  emitente: string;
  documento: LinhaDeCertificado[];
  signatarios: { cabeca: string; linhas: LinhaDeCertificado[] }[];
  nota: string;
};

/**
 * Junta ao fim do documento original a página (ou páginas) de certificado.
 * As páginas do original não se tocam: a impressão digital no certificado é a
 * do PDF que foi enviado, e continua a poder ser verificada contra ele.
 */
export async function juntaCertificado(original: Uint8Array, c: Certificado) {
  const doc = await PDFDocument.load(original, { updateMetadata: false });
  const desde = doc.getPageCount();
  const e: Escritor = {
    doc,
    pagina: undefined as unknown as PDFPage,
    y: 0,
    regular: await doc.embedFont(StandardFonts.Helvetica),
    negrito: await doc.embedFont(StandardFonts.HelveticaBold),
    cabecalho: `Certificado de assinatura eletrónica · ${c.emitente}`,
  };
  novaPagina(e);

  escreve(e, "Certificado de assinatura eletrónica", { tamanho: 16, fonte: e.negrito });
  e.pagina.drawRectangle({ x: MARGEM.x, y: e.y - 4, width: 48, height: 2, color: VERMELHO });
  e.y -= 16;
  escreve(e, c.titulo, { tamanho: 12, fonte: e.negrito });
  e.y -= 6;

  const tabela = (linhasDaTabela: LinhaDeCertificado[]) => {
    for (const { rotulo, valor } of linhasDaTabela) {
      const yAntes = e.y;
      if (e.y - 14 < MARGEM.base) novaPagina(e);
      const topo = e.y === yAntes ? e.y : e.y;
      e.pagina.drawText(limpa(rotulo, e.regular), { x: MARGEM.x, y: topo - 9, size: 8.5, font: e.regular, color: SUAVE });
      const antes = e.y;
      e.y = topo;
      escreve(e, valor, { tamanho: 9, recuo: 150, entrelinha: 1.4 });
      if (e.y > antes - 12) e.y = antes - 12;
      e.y -= 2;
    }
  };

  tabela(c.documento);
  for (const s of c.signatarios) {
    e.y -= 10;
    if (e.y - 120 < MARGEM.base) novaPagina(e);
    escreve(e, s.cabeca, { tamanho: 10.5, fonte: e.negrito });
    e.y -= 2;
    tabela(s.linhas);
  }
  e.y -= 12;
  escreve(e, c.nota, { tamanho: 8, cor: SUAVE });

  numera(doc, e.regular, c.referencia, desde);
  return doc.save();
}

/** Quantas páginas tem um PDF; falha se não for um PDF que se consiga abrir. */
export async function paginasDe(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  return doc.getPageCount();
}
