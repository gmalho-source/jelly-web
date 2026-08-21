import type { CollectionConfig } from "payload";
import { revalidateOnChange } from "../hooks/revalidate";

/** A copy de uma página só afeta essa página — e a home afeta a raiz. */
const pagePaths = (doc: Record<string, unknown>) => {
  const key = String(doc.key ?? "");
  const routes: Record<string, string> = {
    home: "/",
    about: "/sobre",
    services: "/servicos",
    work: "/projetos",
    clients: "/clientes",
    blog: "/blog",
    newsroom: "/newsroom",
    contact: "/contactos",
  };
  return [routes[key] ?? "/"];
};

/**
 * Caderno de copy de uma página: a lista de textos que ela usa, chave a chave,
 * nas duas línguas. As chaves são criadas pela migração e não se editam —
 * inventar uma chave nova aqui não punha texto nenhum no site, porque quem
 * decide o que existe é o código.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Página", plural: "Páginas" },
  admin: {
    useAsTitle: "title",
    group: "Páginas",
    defaultColumns: ["title", "key"],
    description: "Os textos das páginas. Não se criam nem se apagam: editam-se.",
    livePreview: { url: ({ data }) => (data?.key === "home" ? "/" : `/${data?.key ?? ""}`) },
  },
  access: { read: () => true, create: () => false, delete: () => false },
  hooks: { afterChange: [revalidateOnChange(pagePaths)] },
  fields: [
    { name: "title", label: "Página", type: "text", required: true },
    { name: "key", label: "Chave", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: "image",
      label: "Imagem principal",
      type: "upload",
      relationTo: "media",
      admin: { description: "Hoje só a homepage a usa: é a fotografia larga do topo. Sem imagem, o topo mostra a capa do primeiro projeto." },
    },
    {
      name: "entries",
      label: "Textos",
      type: "array",
      admin: { initCollapsed: false },
      fields: [
        { name: "key", label: "Chave", type: "text", required: true, admin: { readOnly: true } },
        { name: "pt", label: "Português", type: "textarea" },
        { name: "en", label: "English", type: "textarea" },
      ],
    },
  ],
};
