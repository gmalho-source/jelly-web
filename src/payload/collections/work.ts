import type { Block, CollectionConfig } from "payload";
import { slugDaPessoa } from "@/lib/equipa";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";
import { fillTeamMember, teamPlan } from "../endpoints/fill-team";
import { translateBio } from "../endpoints/translate-bio";
import { kpiField, locale, slugEnField, slugField } from "../fields";

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
    slugEnField,
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
    {
      name: "hideCoverInBody",
      label: "Não mostrar a capa dentro da página",
      type: "checkbox",
      admin: {
        description:
          "A capa continua a identificar o projeto na grelha e no índice, e continua a servir de primeiro fotograma aos vídeos do caso. Deixa apenas de aparecer no corpo da página — útil quando a história já abre com uma imagem melhor.",
      },
    },
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
    slugEnField,
    { name: "order", label: "Ordem", type: "number", defaultValue: 100 },
    locale("claim", "Claim", { long: true }),
    locale("link", "Nome curto"),
    locale("promise", "Promessa", { long: true }),
    { name: "includes", label: "O que inclui", type: "array", fields: [locale("item", "Linha")] },
    { name: "phases", label: "Fases", type: "array", fields: [locale("name", "Nome"), locale("body", "Descrição", { long: true })] },
    { name: "cases", label: "Casos", type: "relationship", relationTo: "projects", hasMany: true },
    { name: "accent", label: "Cor de acento", type: "select", options: ["lavender", "chartreuse", "coral"] },

    /**
     * Daqui para baixo é a página longa, e é tudo opcional: um serviço sem nada
     * disto fica com a página curta que já tinha. Foi feito para receber o
     * conteúdo das páginas do site antigo, que têm vídeo no topo, uma frase de
     * impacto, as áreas onde a casa ajuda, e um texto de fecho.
     */
    {
      type: "collapsible",
      label: "Página longa",
      admin: { initCollapsed: true, description: "Vídeo de topo, frase de impacto, áreas e texto. Tudo opcional." },
      fields: [
        locale("heroTitle", "Título de topo", { long: true }),
        {
          name: "heroVideo",
          label: "Vídeo de topo",
          type: "text",
          admin: {
            description:
              "Endereço do MP4 no armazenamento. Sem áudio, curto, e leve: um fundo de 7 segundos deve ficar abaixo de 1 MB (npm run video:prep encolhe-o).",
          },
        },
        { name: "heroPoster", label: "Primeiro fotograma", type: "upload", relationTo: "media", admin: { description: "O que se vê antes de o vídeo começar, e o que fica para quem pediu menos movimento." } },
        {
          name: "heroHeight",
          label: "Altura do topo",
          type: "select",
          defaultValue: "medio",
          options: [
            { label: "Curto", value: "curto" },
            { label: "Médio", value: "medio" },
            { label: "Alto", value: "alto" },
          ],
          admin: { description: "Quanto do ecrã ocupa a faixa de topo. Médio é o que se usa; alto é quase o ecrã todo." },
        },
        {
          name: "statement",
          label: "Frase de impacto",
          type: "group",
          admin: { description: "Duas linhas: a afirmação, e a volta que ela dá." },
          fields: [locale("first", "Primeira linha", { long: true }), locale("second", "Segunda linha", { long: true })],
        },
        {
          name: "areas",
          label: "Onde podemos ajudar",
          type: "array",
          fields: [locale("title", "Título"), locale("body", "Descrição", { long: true })],
        },
        locale("essayTitle", "Título do texto"),
        { name: "essay", label: "Texto", type: "array", fields: [locale("body", "Parágrafo", { long: true })] },
        { name: "essayImage", label: "Imagem do texto", type: "upload", relationTo: "media" },
        {
          name: "closing",
          label: "Fecho",
          type: "group",
          fields: [locale("question", "Pergunta", { long: true }), locale("answer", "Resposta")],
        },
      ],
    },
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
      // Com etiqueta e valor: o valor é o que fica gravado e o que a página
      // usa para ordenar e traduzir; a etiqueta é o que quem escolhe lê — e
      // «Saúde» com acento vale mais do que «Saude».
      //
      // A lista é fechada de propósito. Acrescentar um setor é acrescentá-lo
      // aqui, no tipo do conteúdo, na ordem da página e nas duas traduções — e
      // correr um `alter type` na base, porque isto é um enum em Postgres.
      options: [
        { label: "Financeiro e seguros", value: "financeiro" },
        { label: "Saúde e estética", value: "saude" },
        { label: "Bebidas e espirituosas", value: "bebidas" },
        { label: "Produtos de consumo", value: "consumo" },
        { label: "Retalho", value: "retalho" },
        { label: "Indústria", value: "industria" },
        { label: "Arquitetura e construção", value: "construcao" },
        { label: "Transportes & Logística", value: "transportes" },
        { label: "Serviços", value: "servicos" },
        { label: "ONG", value: "ong" },
        { label: "Arte e coleccionismo", value: "arte" },
        { label: "Eventos e espaços", value: "eventos" },
        { label: "Turismo e lazer", value: "lazer" },
        { label: "Tecnologia", value: "tecnologia" },
      ],
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

/** Onde uma pessoa aparece, nas duas línguas. */
function paginasDaPessoa(doc: Record<string, unknown>) {
  const slug = slugDaPessoa(String(doc.name ?? ""));
  return ["/", "/sobre", "/equipa", "/team", `/equipa/${slug}`, `/team/${slug}`];
}

export const TeamMembers: CollectionConfig = {
  slug: "team",
  labels: { singular: "Pessoa", plural: "Equipa" },
  // Sem campo de ordem: a grelha do site é de A a Z, pelo nome. Uma ordem à mão
  // numa lista de vinte e uma pessoas é uma coisa que alguém tem de manter e que
  // ninguém lê — e um campo que o site ignora é pior do que campo nenhum.
  //
  // A lista do painel segue a mesma ordem, com a cara ao lado do nome: por
  // ordem de criação, encontrar alguém obriga a percorrer três páginas.
  admin: {
    useAsTitle: "name",
    group: "Casa",
    defaultColumns: ["name", "photo"],
    // O aviso por cima da lista, enquanto houver fichas sem conteúdo. Desaparece
    // sozinho quando não houver nada a fazer.
    components: { beforeListTable: ["@/payload/components/PreencherEquipa#PreencherEquipa"] },
  },
  defaultSort: "name",
  access: { read: () => true },
  hooks: {
    // Mexer numa pessoa refaz a grelha, a página dela e o cartaz do Sobre. O
    // endereço inglês da grelha e da pessoa é outro (/team), e por isso vai
    // escrito: a purga põe a língua à frente do caminho, não traduz o caminho.
    afterChange: [revalidateOnChange((doc) => paginasDaPessoa(doc))],
    afterDelete: [revalidateOnDelete((doc) => paginasDaPessoa(doc))],
  },
  endpoints: [
    // A apresentação inglesa, escrita pelo Claude a partir da portuguesa. Não
    // leva id: o texto vem do formulário, para isto servir também uma pessoa
    // ainda por gravar.
    { path: "/traduzir", method: "post", handler: translateBio },
    // Encher as fichas a partir do ficheiro do repositório, do botão que está
    // por cima da lista. Uma pessoa por chamada.
    { path: "/preencher", method: "get", handler: teamPlan },
    { path: "/preencher", method: "post", handler: fillTeamMember },
  ],
  fields: [
    { name: "name", label: "Nome", type: "text", required: true },
    locale("role", "Função"),
    // Dois retratos por pessoa, como na página antiga: o preto e branco é o que
    // se vê na grelha, o de cor aparece quando se abre a pessoa.
    { name: "photo", label: "Retrato (preto e branco)", type: "upload", relationTo: "media" },
    { name: "photoColor", label: "Retrato (cor)", type: "upload", relationTo: "media" },
    {
      name: "bio",
      label: "Apresentação",
      type: "group",
      admin: {
        description:
          "O texto que aparece na página da pessoa. Uma linha por parágrafo — o site separa-os por onde a linha acaba.",
      },
      fields: [
        { name: "pt", label: "Português", type: "textarea" },
        {
          name: "en",
          label: "English",
          type: "textarea",
          admin: {
            components: {
              afterInput: [{ path: "@/payload/components/TraduzirIA#TraduzirIA" }],
            },
          },
        },
      ],
    },
    { name: "linkedin", label: "LinkedIn", type: "text" },
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
