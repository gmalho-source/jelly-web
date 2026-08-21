import { locale } from "./locale";

type Rule = { required: () => Rule; min: (n: number) => Rule; max: (n: number) => Rule };

const kpi = {
  name: "kpi",
  title: "Número",
  type: "object",
  fields: [
    { name: "value", title: "Valor", type: "string", description: "Como sai para o ecrã: +38%, 2,4x, 11 dias." },
    locale("label", "Legenda"),
  ],
  preview: { select: { title: "value", subtitle: "label.pt" } },
};

/** Caso escrito: cliente, história e números validados. */
export const project = {
  name: "project",
  title: "Caso",
  type: "document",
  fields: [
    { name: "client", title: "Cliente", type: "string", validation: (rule: Rule) => rule.required() },
    locale("title", "Título"),
    { name: "slug", title: "Slug", type: "slug", options: { source: "client" }, validation: (rule: Rule) => rule.required() },
    { name: "year", title: "Ano", type: "string" },
    { name: "order", title: "Ordem", type: "number", initialValue: 100 },
    locale("summary", "Resumo", true),
    locale("disciplines", "Disciplinas"),
    locale("team", "Equipa"),
    { name: "headline", title: "Número principal", type: "kpi" },
    { name: "kpis", title: "Números", type: "array", of: [{ type: "kpi" }], validation: (rule: Rule) => rule.max(4) },
    {
      name: "quote",
      title: "Citação do cliente",
      type: "object",
      fields: [locale("text", "Texto", true), { name: "author", title: "Quem", type: "string" }, locale("role", "Cargo")],
    },
    { name: "cover", title: "Capa", type: "coverImage" },
    { name: "gallery", title: "Imagens", type: "array", of: [{ type: "coverImage" }] },
  ],
  orderings: [{ title: "Ordem", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "client", subtitle: "year", media: "cover" } },
};

/**
 * Arquivo do portfolio antigo: cliente, ano, disciplinas e imagem, sem
 * narrativa. Vive à parte dos casos escritos para não passar por caso o que é
 * só registo.
 */
export const archivedProject = {
  name: "archivedProject",
  title: "Projeto de arquivo",
  type: "document",
  fields: [
    { name: "client", title: "Cliente", type: "string", validation: (rule: Rule) => rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "client" }, validation: (rule: Rule) => rule.required() },
    { name: "date", title: "Data", type: "date" },
    { name: "year", title: "Ano", type: "string" },
    { name: "disciplines", title: "Disciplinas", type: "array", of: [{ type: "string" }], options: { layout: "tags" } },
    { name: "summary", title: "Resumo", type: "text", rows: 3 },
    { name: "cover", title: "Capa", type: "coverImage" },
    { name: "images", title: "Imagens", type: "array", of: [{ type: "coverImage" }] },
    { name: "legacyPath", title: "URL antigo", type: "string", readOnly: true },
  ],
  orderings: [{ title: "Mais recentes", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "client", subtitle: "year", media: "cover" } },
};

export const service = {
  name: "service",
  title: "Serviço",
  type: "document",
  fields: [
    locale("name", "Nome"),
    { name: "slug", title: "Slug", type: "slug", options: { source: "name.pt" }, validation: (rule: Rule) => rule.required() },
    { name: "order", title: "Ordem", type: "number", initialValue: 100 },
    locale("claim", "Claim", true),
    locale("link", "Nome curto (navegação)"),
    locale("promise", "Promessa", true),
    { name: "includes", title: "O que inclui", type: "array", of: [{ type: "localeString" }] },
    {
      name: "phases",
      title: "Fases",
      type: "array",
      of: [
        {
          type: "object",
          name: "phase",
          fields: [locale("name", "Nome"), locale("body", "Descrição", true)],
          preview: { select: { title: "name.pt", subtitle: "body.pt" } },
        },
      ],
    },
    { name: "cases", title: "Casos", type: "array", of: [{ type: "reference", to: [{ type: "project" }] }] },
    { name: "accent", title: "Cor de acento", type: "string", options: { list: ["lavender", "chartreuse", "coral"] } },
  ],
  orderings: [{ title: "Ordem", name: "order", by: [{ field: "order", direction: "asc" }] }],
  preview: { select: { title: "name.pt", subtitle: "claim.pt" } },
};

export const client = {
  name: "client",
  title: "Cliente",
  type: "document",
  fields: [
    { name: "name", title: "Nome", type: "string", validation: (rule: Rule) => rule.required() },
    {
      name: "sector",
      title: "Setor",
      type: "string",
      options: { list: ["financeiro", "retalho", "industria", "servicos", "lazer", "tecnologia"] },
      validation: (rule: Rule) => rule.required(),
    },
    { name: "logo", title: "Logo", type: "image" },
    { name: "link", title: "Site", type: "url" },
    { name: "order", title: "Ordem", type: "number" },
  ],
  preview: { select: { title: "name", subtitle: "sector", media: "logo" } },
};

export const teamMember = {
  name: "teamMember",
  title: "Pessoa",
  type: "document",
  fields: [
    { name: "name", title: "Nome", type: "string", validation: (rule: Rule) => rule.required() },
    locale("role", "Função"),
    { name: "order", title: "Ordem", type: "number" },
    { name: "photo", title: "Retrato", type: "image", options: { hotspot: true } },
  ],
  preview: { select: { title: "name", subtitle: "role.pt", media: "photo" } },
};

export const milestone = {
  name: "milestone",
  title: "Marco",
  type: "document",
  fields: [
    { name: "year", title: "Ano", type: "string", validation: (rule: Rule) => rule.required() },
    locale("body", "Texto", true),
  ],
  orderings: [{ title: "Ano", name: "year", by: [{ field: "year", direction: "asc" }] }],
  preview: { select: { title: "year", subtitle: "body.pt" } },
};

export const newsItem = {
  name: "newsItem",
  title: "Notícia",
  type: "document",
  fields: [
    locale("title", "Título"),
    { name: "slug", title: "Slug", type: "slug", options: { source: "title.pt" }, validation: (rule: Rule) => rule.required() },
    { name: "date", title: "Data", type: "date", validation: (rule: Rule) => rule.required() },
    {
      name: "kind",
      title: "Tipo",
      type: "string",
      options: { list: [{ title: "Notícia", value: "noticia" }, { title: "Evento", value: "evento" }, { title: "Press", value: "press" }], layout: "radio" },
      initialValue: "noticia",
    },
    locale("summary", "Resumo", true),
    { name: "outlet", title: "Meio", type: "string", description: "Só para press: onde saiu." },
    { name: "link", title: "Link externo", type: "url" },
    { name: "cover", title: "Imagem", type: "coverImage" },
  ],
  orderings: [{ title: "Mais recentes", name: "dateDesc", by: [{ field: "date", direction: "desc" }] }],
  preview: { select: { title: "title.pt", subtitle: "date", media: "cover" } },
};

/** Paredes de logos herdadas do Smart Logo do site antigo. */
export const logoGallery = {
  name: "logoGallery",
  title: "Galeria de logos",
  type: "document",
  fields: [
    { name: "gallery", title: "Nome", type: "string", validation: (rule: Rule) => rule.required() },
    { name: "slug", title: "Slug", type: "slug", options: { source: "gallery" } },
    {
      name: "logos",
      title: "Logos",
      type: "array",
      of: [
        {
          type: "object",
          name: "logo",
          fields: [
            { name: "name", title: "Nome", type: "string" },
            { name: "image", title: "Imagem", type: "image" },
            { name: "link", title: "Link", type: "url" },
          ],
          preview: { select: { title: "name", media: "image" } },
        },
      ],
    },
  ],
  preview: { select: { title: "gallery" } },
};

export { kpi };
