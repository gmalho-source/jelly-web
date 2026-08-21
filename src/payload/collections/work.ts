import type { Block, CollectionConfig } from "payload";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";
import { kpiField, locale, slugField } from "../fields";

const projectPaths = (doc: Record<string, unknown>) => ["/", "/projetos", `/projetos/${doc.slug ?? ""}`];
const servicePaths = (doc: Record<string, unknown>) => ["/", "/servicos", `/servicos/${doc.slug ?? ""}`];

/** Blocos da narrativa de um caso: é disto que uma página de projeto é feita. */
const storyBlocks: Block[] = [
  {
    slug: "text",
    labels: { singular: "Texto", plural: "Textos" },
    fields: [
      { name: "heading", label: "Título da secção", type: "text" },
      { name: "level", label: "Nível", type: "select", options: ["h2", "h3"], defaultValue: "h2" },
      { name: "body", label: "Texto", type: "textarea" },
    ],
  },
  {
    slug: "image",
    labels: { singular: "Imagem", plural: "Imagens" },
    fields: [{ name: "image", type: "upload", relationTo: "media", required: true }],
  },
  {
    slug: "gallery",
    labels: { singular: "Galeria", plural: "Galerias" },
    fields: [{ name: "images", type: "upload", relationTo: "media", hasMany: true, required: true } as Block["fields"][number]],
  },
  {
    slug: "video",
    labels: { singular: "Vídeo", plural: "Vídeos" },
    fields: [
      { name: "mp4", label: "MP4", type: "text", admin: { description: "Endereço do ficheiro." } },
      { name: "webm", label: "WebM", type: "text" },
      { name: "poster", label: "Primeiro fotograma", type: "upload", relationTo: "media" },
      { name: "portrait", label: "Vertical (9:16)", type: "checkbox" },
    ],
  },
  {
    slug: "embed",
    labels: { singular: "YouTube", plural: "YouTube" },
    fields: [{ name: "url", label: "Endereço", type: "text", required: true }],
  },
  {
    slug: "link",
    labels: { singular: "Botão", plural: "Botões" },
    fields: [
      { name: "label", label: "Texto", type: "text", required: true },
      { name: "href", label: "Endereço", type: "text", required: true },
    ],
  },
];

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Projeto", plural: "Projetos" },
  admin: {
    useAsTitle: "client",
    group: "Trabalho",
    defaultColumns: ["client", "year", "written", "_status"],
    livePreview: { url: ({ data }) => `/projetos/${data?.slug ?? ""}` },
  },
  versions: { drafts: true },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(projectPaths)], afterDelete: [revalidateOnDelete(projectPaths)] },
  fields: [
    { name: "client", label: "Cliente", type: "text", required: true },
    slugField,
    {
      type: "row",
      fields: [
        { name: "year", label: "Ano", type: "text" },
        { name: "date", label: "Data", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "order", label: "Ordem", type: "number", defaultValue: 100 },
      ],
    },
    {
      name: "written",
      label: "Caso escrito",
      type: "checkbox",
      admin: { description: "Ligado, entra na lista de casos. Desligado, fica no arquivo." },
    },
    { name: "subtitle", label: "Linha de apoio", type: "text" },
    { name: "disciplines", label: "Disciplinas", type: "text", hasMany: true },
    locale("title", "Título"),
    locale("summary", "Resumo", { long: true }),
    locale("team", "Equipa"),
    { name: "cover", label: "Capa", type: "upload", relationTo: "media" },
    { name: "story", label: "História", type: "blocks", blocks: storyBlocks },
    {
      name: "numbersValidated",
      label: "Números validados com o cliente",
      type: "checkbox",
      admin: { description: "Sem isto, a faixa de números não vai para o ecrã." },
    },
    kpiField("headline", "Número principal"),
    kpiField("kpis", "Números", true),
    {
      name: "quote",
      label: "Citação do cliente",
      type: "group",
      fields: [locale("text", "Texto", { long: true }), { name: "author", label: "Quem", type: "text" }, locale("role", "Cargo")],
    },
    { name: "legacyPath", label: "URL antigo", type: "text", admin: { readOnly: true } },
  ],
};

export const Services: CollectionConfig = {
  slug: "services",
  labels: { singular: "Serviço", plural: "Serviços" },
  admin: { useAsTitle: "namePt", group: "Trabalho", defaultColumns: ["namePt", "order"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(servicePaths)], afterDelete: [revalidateOnDelete(servicePaths)] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "namePt", label: "Nome (PT)", type: "text", required: true },
        { name: "nameEn", label: "Nome (EN)", type: "text" },
      ],
    },
    slugField,
    { name: "order", label: "Ordem", type: "number", defaultValue: 100 },
    locale("claim", "Claim", { long: true }),
    locale("link", "Nome curto"),
    locale("promise", "Promessa", { long: true }),
    { name: "includes", label: "O que inclui", type: "array", fields: [locale("item", "Linha")] },
    { name: "phases", label: "Fases", type: "array", fields: [locale("name", "Nome"), locale("body", "Descrição", { long: true })] },
    { name: "cases", label: "Casos", type: "relationship", relationTo: "projects", hasMany: true },
    { name: "accent", label: "Cor de acento", type: "select", options: ["lavender", "chartreuse", "coral"] },
  ],
};

export const Clients: CollectionConfig = {
  slug: "clients",
  labels: { singular: "Cliente", plural: "Clientes" },
  admin: { useAsTitle: "name", group: "Casa", defaultColumns: ["name", "sector", "order"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(() => ["/", "/clientes"])], afterDelete: [revalidateOnDelete(() => ["/", "/clientes"])] },
  fields: [
    { name: "name", label: "Nome", type: "text", required: true },
    {
      name: "sector",
      label: "Setor",
      type: "select",
      required: true,
      options: ["financeiro", "retalho", "industria", "servicos", "lazer", "tecnologia"],
    },
    { name: "logo", label: "Logo", type: "upload", relationTo: "media" },
    { name: "gallery", label: "Parede", type: "text", admin: { description: "Nome da galeria a que pertence." } },
    { name: "link", label: "Site", type: "text" },
    { name: "order", label: "Ordem", type: "number" },
  ],
};

/**
 * Parede de logos. Fica à parte dos clientes de propósito: o export do Smart
 * Logo não traz nomes, por isso não há forma de casar um logo com um cliente
 * sem inventar. Quem quiser ligar os dois faz isso à mão, no painel.
 */
export const Logos: CollectionConfig = {
  slug: "logos",
  labels: { singular: "Logo", plural: "Parede de logos" },
  admin: { useAsTitle: "name", group: "Casa", defaultColumns: ["name", "gallery", "order"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(() => ["/", "/clientes"])], afterDelete: [revalidateOnDelete(() => ["/", "/clientes"])] },
  fields: [
    { name: "name", label: "Nome", type: "text" },
    { name: "gallery", label: "Parede", type: "text", required: true, defaultValue: "Clientes" },
    { name: "image", label: "Imagem", type: "upload", relationTo: "media", required: true },
    { name: "link", label: "Site", type: "text" },
    { name: "order", label: "Ordem", type: "number" },
  ],
};

export const TeamMembers: CollectionConfig = {
  slug: "team",
  labels: { singular: "Pessoa", plural: "Equipa" },
  admin: { useAsTitle: "name", group: "Casa", defaultColumns: ["name", "order"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(() => ["/", "/sobre"])], afterDelete: [revalidateOnDelete(() => ["/", "/sobre"])] },
  fields: [
    { name: "name", label: "Nome", type: "text", required: true },
    locale("role", "Função"),
    { name: "photo", label: "Retrato", type: "upload", relationTo: "media" },
    { name: "order", label: "Ordem", type: "number" },
  ],
};

export const Milestones: CollectionConfig = {
  slug: "milestones",
  labels: { singular: "Marco", plural: "Marcos" },
  admin: { useAsTitle: "year", group: "Casa", defaultColumns: ["year"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateOnChange(() => ["/", "/sobre"])], afterDelete: [revalidateOnDelete(() => ["/", "/sobre"])] },
  fields: [
    { name: "year", label: "Ano", type: "text", required: true },
    locale("body", "Texto", { long: true }),
  ],
};
