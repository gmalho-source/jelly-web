import type { CollectionConfig } from "payload";

/**
 * Ficheiros que chegam de fora e não são imagens do site: para já, os briefings
 * que vêm no formulário de contactos.
 *
 * Separados dos documentos do recrutamento de propósito. Um CV vê-se com perfil
 * de recrutamento; um briefing de cliente vê-se com qualquer sessão no painel,
 * porque é a equipa toda que trabalha nele. Misturar as duas coisas obrigava a
 * escolher entre trancar o briefing ou destrancar o CV.
 */
export const Attachments: CollectionConfig = {
  slug: "attachments",
  labels: { singular: "Anexo", plural: "Anexos" },
  admin: { useAsTitle: "filename", group: "Casa", hidden: true },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  upload: {
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "image/png",
      "image/jpeg",
    ],
    filesRequiredOnCreate: true,
  },
  fields: [{ name: "note", label: "Nota", type: "text", admin: { readOnly: true } }],
};
