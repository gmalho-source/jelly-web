import type { CollectionConfig } from "payload";

/** Imagens. O texto alternativo é obrigatório — não é decoração. */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Imagem", plural: "Imagens" },
  access: { read: () => true },
  upload: {
    mimeTypes: ["image/*"],
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 1200 },
      { name: "wide", width: 1920 },
    ],
  },
  fields: [
    { name: "alt", label: "Texto alternativo", type: "text", required: true },
    { name: "caption", label: "Legenda", type: "text" },
    { name: "legacyUrl", label: "Endereço de origem", type: "text", admin: { readOnly: true, description: "De onde a imagem foi migrada." } },
  ],
};
