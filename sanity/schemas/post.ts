import { locale } from "./locale";

/**
 * Artigo do blog. O corpo é Portable Text; o site converte-o nos blocos que o
 * ArticleBody já desenha (parágrafo, h2, h3, citação, lista, imagem).
 */
export const post = {
  name: "post",
  title: "Artigo",
  type: "document",
  fields: [
    locale("title", "Título"),
    { name: "slug", title: "Slug", type: "slug", options: { source: "title.pt", maxLength: 96 }, validation: (rule: Rule) => rule.required() },
    { name: "date", title: "Data", type: "date", validation: (rule: Rule) => rule.required() },
    { name: "lang", title: "Língua do original", type: "string", options: { list: ["pt", "en"], layout: "radio" }, initialValue: "pt" },
    locale("excerpt", "Resumo", true),
    { name: "category", title: "Categoria", type: "reference", to: [{ type: "category" }] },
    { name: "author", title: "Autor", type: "string", initialValue: "Jelly" },
    { name: "readingMinutes", title: "Minutos de leitura", type: "number" },
    { name: "cover", title: "Capa", type: "coverImage" },
    { name: "body", title: "Corpo", type: "articleBody" },
    { name: "legacyPath", title: "URL antigo", type: "string", description: "Caminho no jelly.pt anterior. Serve o redirecionamento 301.", readOnly: true },
    { name: "draft", title: "Rascunho", type: "boolean", initialValue: false },
  ],
  orderings: [{ title: "Mais recentes", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title.pt", subtitle: "date", media: "cover" } },
};

export const category = {
  name: "category",
  title: "Categoria",
  type: "document",
  fields: [
    locale("title", "Nome"),
    { name: "slug", title: "Slug", type: "slug", options: { source: "title.pt" }, validation: (rule: Rule) => rule.required() },
  ],
  preview: { select: { title: "title.pt" } },
};

/** Imagem com texto alternativo obrigatório e legenda opcional. */
export const coverImage = {
  name: "coverImage",
  title: "Imagem",
  type: "image",
  options: { hotspot: true },
  fields: [
    { name: "alt", title: "Texto alternativo", type: "string", validation: (rule: Rule) => rule.required() },
    { name: "caption", title: "Legenda", type: "string" },
  ],
};

/** Portable Text limitado ao que o site desenha. Sem tabelas nem HTML solto. */
export const articleBody = {
  name: "articleBody",
  title: "Corpo",
  type: "array",
  of: [
    {
      type: "block",
      styles: [
        { title: "Parágrafo", value: "normal" },
        { title: "Título 2", value: "h2" },
        { title: "Título 3", value: "h3" },
        { title: "Citação", value: "blockquote" },
      ],
      lists: [
        { title: "Lista", value: "bullet" },
        { title: "Lista numerada", value: "number" },
      ],
      marks: {
        decorators: [
          { title: "Negrito", value: "strong" },
          { title: "Itálico", value: "em" },
        ],
        annotations: [
          {
            name: "link",
            title: "Link",
            type: "object",
            fields: [{ name: "href", title: "URL", type: "url", validation: (rule: Rule) => rule.uri({ allowRelative: true, scheme: ["http", "https", "mailto", "tel"] }) }],
          },
        ],
      },
    },
    { type: "coverImage" },
  ],
};

/** Só o que usamos das regras de validação do Studio. */
type Rule = {
  required: () => Rule;
  uri: (options: { allowRelative?: boolean; scheme?: string[] }) => Rule;
};
