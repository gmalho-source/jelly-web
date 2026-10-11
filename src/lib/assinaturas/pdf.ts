import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from "pdf-lib";

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
  | { t: "p"; texto: string; negrito?: boolean; italico?: boolean }
  | { t: "subtitulo"; texto: string }
  /** Uma linha «rótulo — valor», com o valor alinhado numa coluna. */
  | { t: "campo"; rotulo: string; valor: string }
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

/**
 * O wordmark da Jelly, o mesmo do site (src/components/JellyLogo.tsx), para
 * desenhar em vetor: nítido a qualquer zoom, sem imagem embebida.
 */
const WORDMARK = {
  origem: { x: 190, y: 200 },
  tamanho: { largura: 1120, altura: 450 },
  caminhos: [
    "M1048.7,352.1c0,0,3.3-0.7,5.6-0.8c7.3-0.3,20,1.3,27.6,21.3l44.6,117.3c0,0,17.5,43.5,20.9,66c1.7,11.1,1.8,16.4,0,20.6c-1.4,3.2-5,8.3-12.2,8.3c-6,0-13.6-4.4-13-14.3c0.6-8.9-0.1-17.3-9.9-27.2c-14-14.1-34.9-9.1-44.5,1.3c-4.2,4.6-6.6,10-7.7,15.3c-6.1,30.7,23.9,63.2,64,63.2c37.4,0,54.1-25,67.5-57.1c15.3-36.7,87.6-209.2,87.6-209.2c4.4-10.4,8.4-23.2,19.3-23.2c1.9,0,4.2,0,4.2,0V307h-65.3v26.6c5.4-0.1,8.4,0.3,11,2.3c5.6,4.3,6.4,10.9,1.8,21.9c-7.9,18.9-35,83.1-35,83.1l-40.3-106c-4.7-12.3-19.6-32.4-47-32.4c-23,0-88.7,25-88.7,25L1048.7,352.1z",
    "M586.1,418l91.5-11.7c16-2.1,25.7-18.3,20.5-33.5c-9.6-27.8-45.8-70.3-99.6-70.3c-62.2,0-112.9,51.7-112.9,116.4c0,67.5,54.2,116,111,116c49.5,0,81.2-25.2,94.7-43.2l-13.6-19.8c-10.9,8.6-34.4,23.4-58.1,19c-26.7-5-33.4-32.1-33.4-49.9V418z M621,343.2v43.3l-34.7,4.6v-47.9c0-9.6,7.8-17.3,17.3-17.3h0C613.2,325.9,621,333.7,621,343.2z",
    "M834.6,264.1c-0.1-24.2-19.1-50.2-50.2-50.2c-15.6,0-80.7,16.7-80.7,16.7l4.4,26.5c15.9-0.8,26.2,8.2,26.2,24.9l0,176c0,46.3,37.7,76.7,76.8,76.7c42.8,0,62.3-30.9,67.9-40.4l1.5-2.5l-12.7-18.5c-2.5,2.7-7,6.2-13.9,6.2c-10.1,0-19.2-7.5-19.2-17.9L834.6,264.1z",
    "M1004.7,264.1c-0.1-24.2-19.1-50.2-50.2-50.2c-15.6,0-80.7,16.7-80.7,16.7l4.4,26.5c15.9-0.8,26.2,8.2,26.2,24.9l0,176c0,46.3,37.7,76.7,76.8,76.7c42.8,0,62.3-30.9,67.9-40.4l1.5-2.5l-12.7-18.5c-2.5,2.7-7,6.2-13.9,6.2c-10.1,0-19.2-7.5-19.2-17.9V264.1z",
    "M353.7,282.1c0-16.8-10.3-25.8-26.2-24.9l-4.4-26.5c0,0,65.1-16.7,80.7-16.7c31.1,0,50,26,50,50.2v153.8c0,70.1-56.7,116.9-121.1,116.9c-102.7,0-132.1-87.9-111.6-137.8c10-24.4,30.5-33.5,47.2-33.5c31,0,50.2,25.1,50.2,50.2c0,17-7.8,27-11.9,32.2c-15.5,19.4-1.4,44,21.1,44c13.5,0,25.6-11.6,25.6-26.3L353.7,282.1z",
  ],
};

/** A etiqueta vermelha com o wordmark, encostada ao topo da página, como no site. */
function desenhaLogo(pagina: PDFPage) {
  const lado = 62;
  const x = MARGEM.x;
  const topo = A4.altura;
  pagina.drawRectangle({ x, y: topo - lado, width: lado, height: lado, color: VERMELHO });
  const largura = 48;
  const escala = largura / WORDMARK.tamanho.largura;
  const altura = WORDMARK.tamanho.altura * escala;
  const esquerda = x + (lado - largura) / 2;
  const cimo = topo - (lado - altura) / 2;
  for (const caminho of WORDMARK.caminhos) {
    pagina.drawSvgPath(caminho, {
      x: esquerda - WORDMARK.origem.x * escala,
      y: cimo + WORDMARK.origem.y * escala,
      scale: escala,
      color: rgb(1, 1, 1),
    });
  }
}

type Escritor = {
  doc: PDFDocument;
  pagina: PDFPage;
  y: number;
  regular: PDFFont;
  negrito: PDFFont;
  italico?: PDFFont;
  cabecalho: string;
  /** Com logo, a primeira página leva a etiqueta da Jelly em vez do cabeçalho. */
  logo?: boolean;
};

function novaPagina(e: Escritor) {
  const primeira = e.doc.getPageCount() === 0;
  e.pagina = e.doc.addPage([A4.largura, A4.altura]);
  e.y = A4.altura - MARGEM.topo;
  if (primeira && e.logo) {
    desenhaLogo(e.pagina);
    e.y = A4.altura - 62 - 36;
    return;
  }
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
export async function geraDocumento(
  blocos: Bloco[],
  { cabecalho, referencia, titulo, logo = false }: { cabecalho: string; referencia: string; titulo: string; logo?: boolean },
) {
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
    italico: blocos.some((b) => b.t === "p" && b.italico) ? await doc.embedFont(StandardFonts.HelveticaOblique) : undefined,
    cabecalho,
    logo,
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
      escreve(e, bloco.texto, { fonte: bloco.negrito ? e.negrito : bloco.italico && e.italico ? e.italico : e.regular });
      e.y -= 5;
    } else if (bloco.t === "subtitulo") {
      e.y -= 6;
      if (e.y - 60 < MARGEM.base) novaPagina(e);
      escreve(e, bloco.texto, { tamanho: 11, fonte: e.negrito });
      e.y -= 3;
    } else if (bloco.t === "campo") {
      if (e.y - 15 < MARGEM.base) novaPagina(e);
      const topo = e.y;
      e.pagina.drawText(limpa(bloco.rotulo, e.negrito), { x: MARGEM.x, y: topo - 10, size: 9.5, font: e.negrito, color: TINTA });
      escreve(e, bloco.valor || "—", { tamanho: 10, recuo: 175, entrelinha: 1.4 });
      if (e.y > topo - 15) e.y = topo - 15;
      e.y -= 1;
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
  /** `imagem`: a assinatura desenhada, para quem a tem (a Jelly). */
  signatarios: { cabeca: string; linhas: LinhaDeCertificado[]; imagem?: Uint8Array }[];
  nota: string;
  /** A mesma imagem, aposta também na última página do documento. */
  naUltimaPagina?: Uint8Array;
  /** Acrescenta-se à nota quando a imagem foi mesmo aposta na última página. */
  notaDaUltimaPagina?: string;
};

/**
 * A assinatura da Jelly no canto inferior direito da última página, onde se
 * assina um papel. Fica por cima do que lá estiver: num PDF carregado não se
 * sabe se o canto está livre, e é por isso que o certificado também a leva.
 * Numa página rodada não se põe — sairia de lado — e fica só no certificado.
 */
function apoeNaUltimaPagina(doc: PDFDocument, imagem: PDFImage): boolean {
  const pagina = doc.getPage(doc.getPageCount() - 1);
  if (pagina.getRotation().angle % 360 !== 0) return false;
  const caixa = pagina.getCropBox();
  const largura = Math.min(170, caixa.width * 0.3);
  const altura = (largura * imagem.height) / imagem.width;
  pagina.drawImage(imagem, { x: caixa.x + caixa.width - 48 - largura, y: caixa.y + 50, width: largura, height: altura });
  return true;
}

/**
 * Junta ao fim do documento original a página (ou páginas) de certificado.
 * As páginas do original não se tocam: a impressão digital no certificado é a
 * do PDF que foi enviado, e continua a poder ser verificada contra ele.
 */
export async function juntaCertificado(original: Uint8Array, c: Certificado) {
  const doc = await PDFDocument.load(original, { updateMetadata: false });
  const desde = doc.getPageCount();
  const imagens = new Map<Uint8Array, PDFImage>();
  const embebe = async (png: Uint8Array) => imagens.get(png) ?? imagens.set(png, await doc.embedPng(png)).get(png)!;
  const naUltima = c.naUltimaPagina ? apoeNaUltimaPagina(doc, await embebe(c.naUltimaPagina)) : false;
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
    if (s.imagem) {
      const imagem = await embebe(s.imagem);
      const altura = (150 * imagem.height) / imagem.width;
      if (e.y - altura - 8 < MARGEM.base) novaPagina(e);
      e.pagina.drawText("Assinatura", { x: MARGEM.x, y: e.y - 9, size: 8.5, font: e.regular, color: SUAVE });
      e.pagina.drawImage(imagem, { x: MARGEM.x + 150, y: e.y - altura - 2, width: 150, height: altura });
      e.y -= altura + 8;
    }
  }
  e.y -= 12;
  escreve(e, naUltima && c.notaDaUltimaPagina ? `${c.nota} ${c.notaDaUltimaPagina}` : c.nota, { tamanho: 8, cor: SUAVE });

  numera(doc, e.regular, c.referencia, desde);
  return { bytes: await doc.save(), naUltimaPagina: naUltima };
}

/** Quantas páginas tem um PDF; falha se não for um PDF que se consiga abrir. */
export async function paginasDe(bytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  return doc.getPageCount();
}
