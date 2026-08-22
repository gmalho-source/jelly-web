import type { CollectionConfig } from "payload";
import { describeImage } from "../endpoints/describe-image";

/** Imagens. O texto alternativo é obrigatório — não é decoração. */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Imagem", plural: "Imagens" },
  access: { read: () => true },
  upload: {
    mimeTypes: ["image/*"],
    // Tudo o que entra sai em WebP e com o lado maior travado: uma fotografia
    // de máquina traz 6 MB e 6000 px que nenhum ecrã usa. O site serve estas
    // imagens pelo otimizador do Next, que corta o resto por tamanho de ecrã.
    formatOptions: { format: "webp", options: { quality: 82 } },
    resizeOptions: { width: 2400, height: 2400, fit: "inside", withoutEnlargement: true },
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 1200 },
      { name: "wide", width: 1920 },
    ],
  },
  // O Claude escreve a proposta de texto alternativo; o endpoint só responde a
  // quem tem sessão no painel.
  endpoints: [{ path: "/:id/descrever", method: "post", handler: describeImage }],
  fields: [
    {
      name: "alt",
      label: "Texto alternativo",
      type: "text",
      required: true,
      // TEMPORÁRIO: o botão de IA está desligado enquanto se confirma se é ele
      // que deixa o painel em branco. O endpoint fica de pé.
      // admin: { components: { afterInput: ["@/payload/components/DescribeImage#DescribeImage"] } },
    },
    { name: "caption", label: "Legenda", type: "text" },
    { name: "legacyUrl", label: "Endereço de origem", type: "text", admin: { readOnly: true, description: "De onde a imagem foi migrada." } },
  ],
};
