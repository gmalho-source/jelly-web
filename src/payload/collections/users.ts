import type { CollectionConfig } from "payload";

/**
 * Quem entra no painel. O primeiro cria-se no arranque, em /admin.
 *
 * Os perfis existem por causa do recrutamento: as candidaturas trazem CV,
 * morada e respostas escritas, e não devem estar à vista de quem edita o blog.
 * Quem não tem perfis definidos é de antes desta mudança e continua a ver tudo
 * — trancar a porta a quem já estava dentro não é segurança, é um bloqueio.
 */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Utilizador", plural: "Utilizadores" },
  admin: { useAsTitle: "email", group: "Casa", defaultColumns: ["email", "name", "roles"] },
  auth: true,
  fields: [
    { name: "name", label: "Nome", type: "text" },
    {
      name: "roles",
      label: "Perfis",
      type: "select",
      hasMany: true,
      defaultValue: ["admin"],
      options: [
        { label: "Administração", value: "admin" },
        { label: "Conteúdo", value: "editorial" },
        { label: "Recrutamento", value: "recrutamento" },
      ],
      admin: { description: "Administração vê tudo. Recrutamento é o único perfil que vê as candidaturas." },
    },
  ],
};
