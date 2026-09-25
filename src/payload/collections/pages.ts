import type { CollectionConfig } from "payload";
import { guardarSoOQueMuda, mostrarCopyDoSite } from "../hooks/copy-do-site";
import { revalidateOnChange } from "../hooks/revalidate";

/** Onde cada caderno aparece no site. */
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

/** A copy de uma página só afeta essa página — e a home afeta a raiz. */
const pagePaths = (doc: Record<string, unknown>) => [routes[String(doc.key ?? "")] ?? "/"];

/**
 * Caderno de copy de uma página: a lista de textos que ela usa, chave a chave,
 * nas duas línguas. Quem decide que chaves existem é o código — o caderno
 * mostra-as todas, pela ordem da página, com o texto que está online, e guarda
 * só o que quem edita mudou (ver `hooks/copy-do-site.ts`).
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  labels: { singular: "Página", plural: "Páginas" },
  admin: {
    useAsTitle: "title",
    group: "Páginas",
    defaultColumns: ["title", "key"],
    description:
      "Os textos das páginas, tal como estão no site. Mudar um texto aqui muda-o no site; um texto que fique igual ao original continua a acompanhar as alterações feitas no código.",
    // Era `/${key}` — `/about`, `/work` — e só a homepage abria a página certa.
    livePreview: { url: ({ data }) => routes[String(data?.key ?? "")] ?? "/" },
  },
  access: { read: () => true, create: () => false, delete: () => false },
  hooks: {
    afterRead: [mostrarCopyDoSite],
    beforeChange: [guardarSoOQueMuda],
    afterChange: [revalidateOnChange(pagePaths)],
  },
  fields: [
    { name: "title", label: "Página", type: "text", required: true },
    { name: "key", label: "Chave", type: "text", required: true, unique: true, index: true, admin: { readOnly: true } },
    {
      name: "images",
      label: "Imagens principais",
      type: "upload",
      relationTo: "media",
      hasMany: true,
      maxRows: 4,
      admin: {
        description:
          "Hoje só a homepage as usa: são as fotografias do topo, ao lado do título. Com mais do que uma, trocam entre si em fundido, pela ordem desta lista. Sem nenhuma, o topo mostra a capa do primeiro projeto.",
      },
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
