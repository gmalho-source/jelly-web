/**
 * Nome de ficheiro → tipo de conteúdo.
 *
 * Isto existe por causa de um descuido que se pagou caro: os guiões de
 * importação montavam o tipo a partir da extensão (`image/${extensão}`), o que
 * dá `image/jpg` — que não é um tipo real. O Payload não reconhecia a imagem,
 * não lhe tirava as medidas nem a passava pelo sharp: 520 imagens ficaram sem
 * largura nem altura, e o site, sem medidas, desenhava-as todas a 16:9.
 */
const POR_EXTENSAO = {
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
const POR_FORMATO = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  svg: "image/svg+xml",
  tiff: "image/tiff",
  heif: "image/heif",
};

export function mimeFor(filename = "", formato) {
  if (formato && POR_FORMATO[formato]) return POR_FORMATO[formato];
  const extensao = filename.split(".").pop()?.toLowerCase() ?? "";
  return POR_EXTENSAO[extensao] ?? "image/jpeg";
}
