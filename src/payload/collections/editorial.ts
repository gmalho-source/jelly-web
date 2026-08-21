import type { CollectionConfig } from "payload";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";
import { locale, slugField } from "../fields";

const postPaths = (doc: Record<string, unknown>) => ["/", "/blog", `/blog/${doc.slug ?? ""}`];

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Categoria", plural: "Categorias" },
  // O título tem de ser texto simples: o painel desenha-o em colunas e num
  // grupo { pt, en } o React recebia um objeto onde esperava uma string.
  admin: { useAsTitle: "titlePt", group: "Editorial", defaultColumns: ["titlePt", "slug"] },
  access: { read: () => true },
  fields: [
    {
      type: "row",
      fields: [
        { name: "titlePt", label: "Nome (PT)", type: "text", required: true },
        { name: "titleEn", label: "Nome (EN)", type: "text" },
      ],
    },
    slugField,
  ],
};

export const Posts: CollectionConfig = {
  slug: "posts",
  labels: { singular: "Artigo", plural: "Artigos" },
  admin: {
    useAsTitle: "titlePt",
    group: "Editorial",
    defaultColumns: ["titlePt", "date", "category", "_status"],
    // Escrever e ver ao lado: é a razão de estarmos no Payload.
    livePreview: { url: ({ data }) => `/blog/${data?.slug ?? ""}` },
  },
  versions: { drafts: true },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(postPaths)], afterDelete: [revalidateOnDelete(postPaths)] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "titlePt", label: "Título (PT)", type: "text", required: true },
        { name: "titleEn", label: "Título (EN)", type: "text" },
      ],
    },
    slugField,
    {
      type: "row",
      fields: [
        { name: "date", label: "Data", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "author", label: "Autor", type: "text", defaultValue: "Jelly" },
        { name: "readingMinutes", label: "Minutos de leitura", type: "number" },
      ],
    },
    { name: "category", label: "Categoria", type: "relationship", relationTo: "categories" },
    locale("excerpt", "Resumo", { long: true }),
    { name: "cover", label: "Capa", type: "upload", relationTo: "media" },
    { name: "body", label: "Corpo (PT)", type: "richText" },
    {
      name: "bodyEn",
      label: "Corpo (EN)",
      type: "richText",
      admin: { description: "Tradução do corpo. Vazio, o site em inglês mostra o texto português." },
    },
    { name: "lang", label: "Língua do original", type: "select", options: ["pt", "en"], defaultValue: "pt" },
    { name: "legacyPath", label: "URL antigo", type: "text", admin: { readOnly: true, description: "Serve o redirecionamento 301." } },
  ],
};

export const NewsItems: CollectionConfig = {
  slug: "news",
  labels: { singular: "Notícia", plural: "Newsroom" },
  admin: { useAsTitle: "titlePt", group: "Editorial", defaultColumns: ["titlePt", "kind", "date"] },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateOnChange(() => ["/newsroom"])],
    afterDelete: [revalidateOnDelete(() => ["/newsroom"])],
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "titlePt", label: "Título (PT)", type: "text", required: true },
        { name: "titleEn", label: "Título (EN)", type: "text" },
      ],
    },
    slugField,
    {
      type: "row",
      fields: [
        { name: "date", label: "Data", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly" } } },
        {
          name: "kind",
          label: "Tipo",
          type: "select",
          required: true,
          defaultValue: "noticia",
          options: [
            { label: "Notícia", value: "noticia" },
            { label: "Evento", value: "evento" },
            { label: "Press", value: "press" },
          ],
        },
        { name: "outlet", label: "Meio", type: "text", admin: { description: "Só para press: onde saiu." } },
      ],
    },
    locale("summary", "Resumo", { long: true }),
    { name: "link", label: "Link externo", type: "text" },
  ],
};
