import type { Access, CollectionBeforeChangeHook, CollectionConfig, FieldAccess } from "payload";
import { MODULOS, escondeDe, tem, type ComModulos } from "../acesso";

/**
 * Quem entra no painel, e em que módulos. O primeiro cria-se no arranque, em
 * /admin.
 *
 * Os módulos (o campo `roles`) decidem o que cada um vê e muda — ver
 * src/payload/acesso.ts. Só a Administração mexe nos utilizadores e nos
 * módulos; cada um vê e muda a sua própria ficha (a palavra-passe), mas não os
 * seus módulos. Sem módulos, não se vê nada: a regra antiga de «sem perfis vê
 * tudo» saiu quando todos passaram a ter módulos.
 */
const admin = (user: unknown) => tem(user as ComModulos);

/** A Administração vê todos; os outros, só a si próprios. */
const lerUtilizadores: Access = ({ req }) => (admin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false);
const soAdmin: Access = ({ req }) => admin(req.user);

/** Os módulos só os muda a Administração. No primeiro utilizador, ainda sem sessão, também se escrevem. */
const mudarModulos: FieldAccess = ({ req }) => !req.user || admin(req.user);

/** Um administrador não tira a Administração a si próprio: ficava a casa sem chave. */
const naoSeTrancaFora: CollectionBeforeChangeHook = ({ data, originalDoc, operation, req }) => {
  if (operation !== "update" || !req.user || String(req.user.id) !== String(originalDoc?.id)) return data;
  const antes = (originalDoc?.roles ?? []) as string[];
  const depois = (data.roles ?? antes) as string[];
  if (antes.includes("admin") && !depois.includes("admin")) data.roles = [...depois, "admin"];
  return data;
};
export const Users: CollectionConfig = {
  slug: "users",
  labels: { singular: "Utilizador", plural: "Utilizadores" },
  admin: { useAsTitle: "email", group: "Casa", hidden: escondeDe(), defaultColumns: ["email", "name", "roles"] },
  auth: true,
  access: { read: lerUtilizadores, create: soAdmin, delete: soAdmin, update: ({ req }) => (admin(req.user) ? true : req.user ? { id: { equals: req.user.id } } : false) },
  hooks: { beforeChange: [naoSeTrancaFora] },
  fields: [
    // Entra a seguir aos campos de entrada, que o Payload desenha sozinho: o
    // email, a palavra-passe e a confirmação. É aí que o botão faz falta.
    {
      name: "gerarPalavraPasse",
      type: "ui",
      admin: { components: { Field: "@/payload/components/GerarPalavraPasse#GerarPalavraPasse" } },
    },
    { name: "name", label: "Nome", type: "text" },
    {
      name: "roles",
      label: "Módulos",
      type: "select",
      hasMany: true,
      // O primeiro utilizador, criado no arranque, é da Administração. Os
      // seguintes nascem sem módulos: quem os cria escolhe.
      defaultValue: ({ user }: { user?: unknown }) => (user ? [] : ["admin"]),
      options: [...MODULOS],
      access: { create: mudarModulos, update: mudarModulos },
      admin: {
        description:
          "O que esta pessoa vê no painel. Administração vê tudo, incluindo os utilizadores. A Biblioteca (imagens, vídeos) vem com Blog ou com Páginas.",
      },
    },
  ],
};
