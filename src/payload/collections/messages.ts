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
    defaultColumns: ["name", "company", "origin", "status", "createdAt"],
    // Procurar por email: a caixa da lista só olha para o campo do título, e
    // quem vem procurar uma mensagem sabe muitas vezes o endereço e não o nome.
    listSearchableFields: ["name", "email"],
    description: "Os briefings da página de contactos e as subscrições do JellyCARE.",
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
    // O telefone chega já com o indicativo à frente, montado no formulário: um
    // número sem indicativo não se marca de fora do país, e é de fora do país
    // que vem parte destes pedidos.
    { name: "phone", label: "Telefone", type: "text", admin: { readOnly: true } },
    /*
     * De onde veio o pedido.
     *
     * A caixa é uma só de propósito: quem responde não tem de andar por duas
     * coleções. Estes dois campos é que dizem se a mensagem é um briefing da
     * página de contactos ou uma subscrição do JellyCARE — e, nesse caso, com
     * que plano e para que site.
     */
    {
      type: "row",
      fields: [
        {
          name: "origin",
          label: "Origem",
          type: "select",
          defaultValue: "contacto",
          admin: { readOnly: true },
          options: [
            { label: "Contactos", value: "contacto" },
            { label: "JellyCARE", value: "jellycare" },
          ],
        },
        { name: "plan", label: "Plano", type: "text", admin: { readOnly: true, condition: (data) => data?.origin === "jellycare" } },
        { name: "site", label: "Website", type: "text", admin: { readOnly: true, condition: (data) => data?.origin === "jellycare" } },
      ],
    },
    { name: "message", label: "O que precisa", type: "textarea", admin: { readOnly: true } },
    {
      type: "row",
      fields: [
        {
          name: "start",
          label: "Quando quer arrancar",
          type: "select",
          admin: { readOnly: true },
          options: [
            { label: "Dentro de um mês", value: "um-mes" },
            { label: "Dentro de dois a três meses", value: "dois-tres" },
            { label: "Mais para a frente", value: "mais-tarde" },
            { label: "Ainda não sabe", value: "nao-sei" },
          ],
        },
        { name: "brief", label: "Briefing", type: "upload", relationTo: "attachments", admin: { readOnly: true } },
      ],
    },
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
