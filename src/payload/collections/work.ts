import type { Block, CollectionConfig } from "payload";
import { slugDaPessoa } from "@/lib/equipa";
import { guardaSlugsAntigos } from "../hooks/slugs-antigos";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";
import { fillTeamMember, teamPlan } from "../endpoints/fill-team";
import { translateStory } from "../endpoints/translate-story";
import { translateAndSaveBio, translateBio } from "../endpoints/translate-bio";
import { kpiField, locale, oldSlugsField, slugEnField, slugField } from "../fields";

const projectPaths = (doc: Record<string, unknown>) => ["/", "/projetos", `/projetos/${doc.slug ?? ""}`];
const servicePaths = (doc: Record<string, unknown>) => ["/", "/servicos", `/servicos/${doc.slug ?? ""}`];

/** Blocos da narrativa de um caso: é disto que uma página de projeto é feita. */
/**
 * Os blocos simples de um caso. Chamam-se simples porque não contêm outros: é
 * isto que a coluna aceita lá dentro, e é o que impede uma coluna dentro de uma
 * coluna dentro de uma coluna.
 */
const blocosSimples: Block[] = [
  {
    slug: "text",
    labels: { singular: "Texto", plural: "Textos" },
    fields: [
      // O inglês entra ao lado do português e não numa segunda história.
      // A estrutura de um caso é a mesma nas duas línguas — muda a língua, não
      // o alinhamento — e duas estruturas a manter divergem no primeiro dia em
      // que alguém acrescenta um bloco só de um lado.
      { name: "heading", label: "Título da secção", type: "text" },
      { name: "headingEn", label: "Título da secção (EN)", type: "text" },
      { name: "level", label: "Nível", type: "select", options: ["h2", "h3"], defaultValue: "h2" },
      { name: "body", label: "Texto", type: "textarea" },
      { name: "bodyEn", label: "Texto (EN)", type: "textarea" },
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
      {
        name: "ficheiro",
        label: "Vídeo",
        type: "upload",
        relationTo: "videos",
        admin: {
          description:
            "Arrasta o ficheiro para aqui. Vai direito ao armazenamento, sem o limite de 4,5 MB que trava as imagens. Um vídeo de caso deve ficar abaixo dos 10 MB — `npm run video:prep` encolhe-o sem se notar.",
        },
      },
      // Os endereços à mão continuam a valer: há trinta e quatro vídeos de casos
      // ainda servidos do site antigo, e um vídeo que já está algures não tem de
      // ser carregado outra vez só para mudar de campo.
      {
        name: "mp4",
        label: "MP4 (endereço)",
        type: "text",
        admin: { description: "Só para um vídeo que já esteja noutro sítio. Com ficheiro carregado acima, isto é ignorado." },
      },
      { name: "webm", label: "WebM (endereço)", type: "text" },
      { name: "poster", label: "Primeiro fotograma", type: "upload", relationTo: "media" },
      { name: "portrait", label: "Vertical (9:16)", type: "checkbox" },
      {
        name: "modo",
        label: "Como se vê",
        type: "select",
        defaultValue: "ambiente",
        options: [
          { label: "Ambiente — corre sozinho, sem som, em ciclo, sem controlos", value: "ambiente" },
          { label: "Filme — começa parado, com controlos e com som", value: "filme" },
        ],
        admin: {
          description:
            "Ambiente é para um fundo de sete segundos que se repete. Filme é para uma peça que alguém se senta a ver — e uma peça com som nunca deve começar sozinha.",
        },
      },
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
      { name: "labelEn", label: "Texto (EN)", type: "text" },
      { name: "href", label: "Endereço", type: "text", required: true },
    ],
  },
];

/**
 * Blocos lado a lado.
 *
 * Duas a quatro colunas, e dentro de cada uma os blocos do costume — texto,
 * imagem, vídeo, lista. É o que faltava para pôr um antes e um depois lado a
 * lado, ou três ecrãs de uma aplicação em fila.
 *
 * Não se aninha: uma coluna só aceita blocos simples, e por isso não há maneira
 * de meter colunas dentro de colunas. É uma limitação de propósito — uma
 * história de um caso que precise de duas grelhas encaixadas está a pedir outra
 * coisa, e essa outra coisa não é um editor mais fundo.
 *
 * No telemóvel não há colunas: empilham-se. Três imagens lado a lado num ecrã de
 * 390 são três selos.
 */
const colunasBlock: Block = {
  slug: "colunas",
  labels: { singular: "Colunas", plural: "Colunas" },
  fields: [
    {
      name: "colunas",
      label: "Colunas",
      type: "array",
      minRows: 2,
      maxRows: 4,
      admin: {
        description: "Duas a quatro. No telemóvel empilham-se, por esta ordem.",
        initCollapsed: false,
      },
      fields: [{ name: "blocos", label: "Conteúdo", type: "blocks", blocks: blocosSimples }],
    },
  ],
};

const storyBlocks: Block[] = [...blocosSimples, colunasBlock];

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
  hooks: { beforeChange: [guardaSlugsAntigos], afterChange: [revalidateOnChange(projectPaths)], afterDelete: [revalidateOnDelete(projectPaths)] },
  endpoints: [
    // A história em inglês, escrita pelo Claude. Vai e volta uma lista de
    // textos: a estrutura da história nunca sai daqui.
    { path: "/traduzir-historia", method: "post", handler: translateStory },
  ],
  fields: [
    { name: "client", label: "Cliente", type: "text", required: true },
    slugField,
    slugEnField,
    oldSlugsField,
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
    // O botão que passa a história a inglês, debaixo dela. Anda pelos campos do
    // formulário, e por isso serve também uma história ainda por gravar.
    {
      name: "traduzirHistoria",
      type: "ui",
      admin: { components: { Field: "@/payload/components/TraduzirHistoria#TraduzirHistoria" } },
    },
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
  hooks: { beforeChange: [guardaSlugsAntigos], afterChange: [revalidateOnChange(servicePaths)], afterDelete: [revalidateOnDelete(servicePaths)] },
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
    oldSlugsField,
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
    // A mesma tradução, mas gravada: é o que o botão de traduzir todas usa,
    // onde não há ficha aberta para receber o texto.
    { path: "/traduzir-e-gravar", method: "post", handler: translateAndSaveBio },
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
