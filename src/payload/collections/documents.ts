import type { CollectionConfig } from "payload";
import { recruiterOnly } from "./recruitment";

/**
 * Ficheiros que não são imagens e não são públicos: para já, os CV.
 *
 * Ao contrário das imagens, estes não passam pelo CDN com o endereço à vista.
 * Ficam atrás do controlo de acesso do Payload — quem pede o ficheiro tem de
 * ter sessão e perfil de recrutamento. Um CV com endereço público é um CV que
 * qualquer pessoa encontra.
 */
export const Documents: CollectionConfig = {
  slug: "documents",
  labels: { singular: "Documento", plural: "Documentos" },
  admin: { useAsTitle: "filename", group: "Recrutamento", hidden: true },
  access: { read: recruiterOnly, create: () => false, update: recruiterOnly, delete: recruiterOnly },
  upload: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ],
    filesRequiredOnCreate: true,
  },
  fields: [{ name: "note", label: "Nota", type: "text", admin: { readOnly: true } }],
};
