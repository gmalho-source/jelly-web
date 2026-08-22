import type { CollectionConfig } from "payload";

/**
 * O que chega pelo formulário de contactos.
 *
 * Antes só ia por email: se o email falhasse, ou se alguém o apagasse sem
 * querer, o pedido desaparecia. Agora fica gravado primeiro e o email é o
 * aviso, não o arquivo.
 *
 * Ninguém escreve aqui de fora: quem submete passa pela rota do site, que
 * valida, limita o ritmo e grava. A coleção só se lê e se responde.
 */
export const Messages: CollectionConfig = {
  slug: "messages",
  labels: { singular: "Mensagem", plural: "Mensagens" },
  admin: {
    useAsTitle: "name",
    group: "Casa",
    defaultColumns: ["name", "company", "email", "status", "createdAt"],
    description: "Os briefings que entram pela página de contactos.",
  },
  access: { read: ({ req }) => Boolean(req.user), create: () => false, update: ({ req }) => Boolean(req.user), delete: ({ req }) => Boolean(req.user) },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", label: "Nome", type: "text", required: true, admin: { readOnly: true } },
        { name: "company", label: "Empresa", type: "text", admin: { readOnly: true } },
        { name: "email", label: "Email", type: "email", required: true, admin: { readOnly: true } },
      ],
    },
    { name: "message", label: "O que precisa", type: "textarea", admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        {
          name: "status",
          label: "Estado",
          type: "select",
          defaultValue: "nova",
          options: [
            { label: "Nova", value: "nova" },
            { label: "Respondida", value: "respondida" },
            { label: "Arquivada", value: "arquivada" },
          ],
        },
        { name: "locale", label: "Língua", type: "text", admin: { readOnly: true } },
      ],
    },
    { name: "notes", label: "Notas", type: "textarea", admin: { description: "Para quem responde: o que ficou combinado." } },
  ],
};
