/**
 * Nome de ficheiro → tipo de conteúdo.
 *
 * Isto existe por causa de um descuido que se pagou caro: os guiões de
 * importação montavam o tipo a partir da extensão (`image/${extensão}`), o que
 * dá `image/jpg` — que não é um tipo real. O Payload não reconhecia a imagem,
 * não lhe tirava as medidas nem a passava pelo sharp: 520 imagens ficaram sem
 * largura nem altura, e o site, sem medidas, desenhava-as todas a 16:9.
 *
 * Fica num sítio só, e é daqui que os guiões o vão buscar. Duas tabelas iguais
 * em dois ficheiros divergem sempre, e a segunda é a que erra.
 */
const POR_EXTENSAO: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  jpe: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  tif: "image/tiff",
  tiff: "image/tiff",
  bmp: "image/bmp",
  ico: "image/x-icon",
};

/** O formato que o sharp leu ganha à extensão: um .jpg pode ser um png. */
const POR_FORMATO: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  heif: "image/heif",
};

export function mimeFor(filename = "", formato?: string): string {
  if (formato && POR_FORMATO[formato]) return POR_FORMATO[formato];
  const extensao = filename.split(".").pop()?.toLowerCase() ?? "";
  return POR_EXTENSAO[extensao] ?? "image/jpeg";
}

/** O contrário: o tipo dá a extensão, para nomear o que vem sem nome. */
export function extensaoDe(tipo: string): string {
  const par = Object.entries(POR_EXTENSAO).find(([, valor]) => valor === tipo);
  return par?.[0] ?? "jpg";
}
