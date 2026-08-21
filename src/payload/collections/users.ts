import type { CollectionConfig } from "payload";

/** Quem entra no painel. O primeiro cria-se no arranque, em /admin. */
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Utilizador", plural: "Utilizadores" },
  admin: { useAsTitle: "email", group: "Casa" },
  auth: true,
  fields: [{ name: "name", label: "Nome", type: "text" }],
};
