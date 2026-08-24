import type { Block, CollectionConfig } from "payload";
import { BlocksFeature, UploadFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import {
  revalidateEverythingOnChange,
  revalidateEverythingOnDelete,
  revalidateOnChange,
  revalidateOnDelete,
} from "../hooks/revalidate";
import { locale, slugEnField, slugField } from "../fields";
import { importMarkdown } from "../endpoints/markdown-import";
import { writeExcerpt } from "../endpoints/write-excerpt";

const postPaths = (doc: Record<string, unknown>) => ["/", "/blog", `/blog/${doc.slug ?? ""}`];

/**
 * Vídeo no corpo de um artigo.
 *
 * Um campo só, o endereço, porque é o que quem escreve tem à mão: cola-se o
 * que está na barra do browser, ou o que o botão «partilhar» dá, e o site
 * reconhece o YouTube, o Vimeo e um ficheiro nosso. Não se pede o código de
 * `<iframe>` a ninguém — colar HTML num campo de texto é a porta pela qual
 * entram os problemas que depois não se sabe de onde vieram.
 *
 * Colar o endereço sozinho num parágrafo também funciona, e é o que faz os
 * ficheiros Markdown importados trazerem vídeo. O bloco existe para que se veja
 * que é possível, e para que possa levar legenda.
 */
const videoBlock: Block = {
  slug: "video",
  labels: { singular: "Vídeo", plural: "Vídeos" },
  fields: [
    {
      name: "url",
      label: "Endereço do vídeo",
      type: "text",
      required: true,
      admin: {
        description:
          "YouTube, Vimeo ou um ficheiro .mp4. Cola o endereço tal como está na barra do browser — por exemplo https://www.youtube.com/watch?v=XXXXXXXXXXX",
      },
    },
    {
      name: "caption",
      label: "Legenda",
      type: "text",
      admin: { description: "Aparece debaixo do vídeo, e é o que os leitores de ecrã anunciam." },
    },
  ],
};

/*
 * O corpo dos artigos leva as funcionalidades de origem mais o bloco de vídeo.
 * `defaultFeatures` primeiro, e não uma lista escrita à mão: assim os títulos,
 * as listas, os links e as imagens continuam todos lá quando o Payload lhes
 * mexer.
 */
/*
 * A imagem no meio do texto ganha dois campos próprios, escolhidos imagem a
 * imagem: onde fica e o que diz por baixo.
 *
 * O contorno só acontece quando a coluna de texto tem largura para duas coisas
 * lado a lado — e quem decide isso é a coluna, não o tamanho do ecrã. Num
 * telemóvel a imagem volta sozinha à largura toda, que é o que se quer: texto a
 * contornar uma imagem numa medida de trinta caracteres não se lê.
 */
const imagemDoCorpo = UploadFeature({
  collections: {
    media: {
      fields: [
        {
          name: "align",
          label: "Posição",
          type: "select",
          defaultValue: "full",
          options: [
            { label: "Na largura do texto", value: "full" },
            { label: "À esquerda, com o texto a contornar", value: "left" },
            { label: "À direita, com o texto a contornar", value: "right" },
          ],
          admin: {
            description:
              "A contornar, a imagem fica com pouco menos de metade da coluna. Em ecrãs estreitos volta à largura toda — não há contorno que se leia numa coluna de telemóvel.",
          },
        },
        {
          name: "caption",
          label: "Legenda",
          type: "text",
          admin: { description: "Aparece debaixo da imagem, em letra pequena. O texto alternativo continua a ser o da biblioteca." },
        },
      ],
    },
  },
});

const corpoDeArtigo = lexicalEditor({
  // A funcionalidade das imagens vem depois das de origem de propósito: é a
  // mesma, com os campos acrescentados, e a última é a que fica.
  features: ({ defaultFeatures }) => [...defaultFeatures, imagemDoCorpo, BlocksFeature({ blocks: [videoBlock] })],
});

/*
 * Autores e categorias aparecem em muitos artigos, e por isso limpam tudo — o
 * gancho `revalidateEverything*` abaixo.
 *
 * Faltava-lhes gancho nenhum, e o efeito era o pior possível: silencioso. A
 * fotografia entrava na ficha do autor, ficava lá gravada, e o site continuava a
 * servir a versão guardada sem ela. Nada falhava; só não mudava.
 */

export const Categories: CollectionConfig = {
  slug: "categories",
  labels: { singular: "Categoria", plural: "Categorias" },
  // O título tem de ser texto simples: o painel desenha-o em colunas e num
  // grupo { pt, en } o React recebia um objeto onde esperava uma string.
  admin: { useAsTitle: "titlePt", group: "Editorial", defaultColumns: ["titlePt", "slug"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverythingOnChange], afterDelete: [revalidateEverythingOnDelete] },
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

/**
 * Quem escreve.
 *
 * Tabela própria, sem relação com os utilizadores do painel — e isso é a
 * decisão, não um atalho. Quem assina um artigo não é necessariamente quem tem
 * sessão no backoffice: há textos da casa assinados «Jelly», há quem escreva
 * uma vez e nunca mais entre aqui, e há quem administre o site sem nunca
 * escrever. Amarrar as duas coisas obrigava a criar uma conta de acesso a cada
 * pessoa que assina uma peça.
 */
export const Authors: CollectionConfig = {
  slug: "authors",
  labels: { singular: "Autor", plural: "Autores" },
  admin: { useAsTitle: "name", group: "Editorial", defaultColumns: ["name", "role"] },
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverythingOnChange], afterDelete: [revalidateEverythingOnDelete] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", label: "Nome", type: "text", required: true },
        {
          name: "role",
          label: "Função",
          type: "text",
          admin: { description: "Como aparece debaixo do nome: «CEO», «Head of Paid Media»." },
        },
      ],
    },
    {
      name: "photo",
      label: "Fotografia",
      type: "upload",
      relationTo: "media",
      admin: { description: "De rosto e quadrada, se possível: é assim que sai no artigo." },
    },
    {
      name: "bio",
      label: "Uma linha",
      type: "textarea",
      admin: { description: "Opcional. Uma frase, não um currículo — é o que cabe no fim de um artigo." },
    },
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
  // Um Markdown a povoar o artigo. O trabalho é do servidor porque é lá que as
  // imagens entram na biblioteca.
  endpoints: [
    { path: "/markdown", method: "post", handler: importMarkdown },
    // O resumo escrito pelo Claude. Não leva id: o corpo do artigo vem do
    // editor, para isto servir também um artigo ainda por gravar.
    { path: "/resumo", method: "post", handler: writeExcerpt },
  ],
  fields: [
    {
      type: "row",
      fields: [
        { name: "titlePt", label: "Título (PT)", type: "text", required: true },
        { name: "titleEn", label: "Título (EN)", type: "text" },
      ],
    },
    slugField,
    slugEnField,
    {
      type: "row",
      fields: [
        { name: "date", label: "Data", type: "date", required: true, admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "authorRef", label: "Autor", type: "relationship", relationTo: "authors" },
        {
          name: "author",
          label: "Autor (texto antigo)",
          type: "text",
          admin: {
            readOnly: true,
            description: "O que veio do site antigo. Fica para conferência; quem manda é o campo acima.",
          },
        },
        { name: "readingMinutes", label: "Minutos de leitura", type: "number" },
      ],
    },
    { name: "category", label: "Categoria", type: "relationship", relationTo: "categories" },
    {
      name: "excerpt",
      label: "Resumo",
      type: "group",
      admin: {
        description:
          "A primeira linha do artigo na página e a description que sai no Google. Até 155 caracteres.",
      },
      fields: [
        {
          name: "pt",
          label: "Português",
          type: "textarea",
          admin: {
            components: {
              afterInput: [
                { path: "@/payload/components/ResumoIA#ResumoIA", clientProps: { lingua: "pt" } },
              ],
            },
          },
        },
        {
          name: "en",
          label: "English",
          type: "textarea",
          admin: {
            components: {
              afterInput: [
                { path: "@/payload/components/ResumoIA#ResumoIA", clientProps: { lingua: "en" } },
              ],
            },
          },
        },
      ],
    },
    { name: "cover", label: "Capa", type: "upload", relationTo: "media" },
    {
      name: "body",
      label: "Corpo (PT)",
      type: "richText",
      editor: corpoDeArtigo,
      admin: {
        components: {
          beforeInput: [
            { path: "@/payload/components/MarkdownImport#MarkdownImport", clientProps: { campo: "body" } },
          ],
        },
      },
    },
    {
      name: "bodyEn",
      label: "Corpo (EN)",
      type: "richText",
      editor: corpoDeArtigo,
      admin: {
        description: "Tradução do corpo. Vazio, o site em inglês mostra o texto português.",
        components: {
          beforeInput: [
            { path: "@/payload/components/MarkdownImport#MarkdownImport", clientProps: { campo: "bodyEn" } },
          ],
        },
      },
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
    {
      name: "post",
      label: "Artigo do blog",
      type: "relationship",
      relationTo: "posts",
      admin: { description: "Se a notícia tem artigo no site, é para lá que a linha leva." },
    },
    { name: "link", label: "Link externo", type: "text", admin: { description: "Usado quando não há artigo: notícia na imprensa, inscrição num evento." } },
  ],
};
