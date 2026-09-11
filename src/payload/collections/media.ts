import type { CollectionConfig } from "payload";
import { describeImage, describeUpload } from "../endpoints/describe-image";

/** Imagens. O texto alternativo é obrigatório — não é decoração. */
export const Media: CollectionConfig = {
  slug: "media",
  labels: { singular: "Imagem", plural: "Imagens" },
  // Sem isto o painel mostra o nome do ficheiro, e um nome vindo do WordPress
  // (256513_441780705844923_o-150x150.webp) não diz nada a ninguém.
  admin: { useAsTitle: "title", group: "Biblioteca", defaultColumns: ["title", "alt", "filename"] },
  access: { read: () => true },
  upload: {
    mimeTypes: ["image/*"],
    // Tudo o que entra sai em WebP e com o lado maior travado: uma fotografia
    // de máquina traz 6 MB e 6000 px que nenhum ecrã usa. O site serve estas
    // imagens pelo otimizador do Next, que corta o resto por tamanho de ecrã.
    //
    // 90 e não 82: este é o primeiro de dois passos com perda, e o que aqui se
    // deita fora não há otimizador que o devolva. O que fica guardado é a
    // matriz de tudo o que o site mostra dessa fotografia, e vale mais uns
    // quilobytes a mais no armazenamento do que um gradiente aos quadrados em
    // todos os tamanhos servidos. A régua de saída está no `next.config.ts`.
    formatOptions: { format: "webp", options: { quality: 90 } },
    resizeOptions: { width: 2400, height: 2400, fit: "inside", withoutEnlargement: true },
    imageSizes: [
      { name: "thumb", width: 400 },
      { name: "card", width: 1200 },
      { name: "wide", width: 1920 },
    ],
  },
  // O Claude escreve a proposta de texto alternativo; o endpoint só responde a
  // quem tem sessão no painel.
  endpoints: [
    // Uma para a imagem já gravada, outra para a que ainda está a ser escolhida:
    // a ajuda serve na altura em que se escreve, não só depois de gravar.
    { path: "/:id/descrever", method: "post", handler: describeImage },
    { path: "/descrever", method: "post", handler: describeUpload },
  ],
  fields: [
    // Logo a seguir ao ficheiro: encolhe no browser o que passar dos 4,5 MB que
    // a Vercel deixa entrar numa função, e diz o peso do que vai subir.
    {
      name: "peso",
      type: "ui",
      admin: { components: { Field: "@/payload/components/EncolheImagem#EncolheImagem" } },
    },
    {
      name: "title",
      label: "Título",
      type: "text",
      admin: { description: "Como esta imagem se chama no painel. Não vai para o site." },
    },
    {
      name: "alt",
      label: "Texto alternativo",
      type: "text",
      required: true,
      admin: { components: { afterInput: ["@/payload/components/DescribeImage#DescribeImage"] } },
    },
    { name: "caption", label: "Legenda", type: "text" },
    { name: "legacyUrl", label: "Endereço de origem", type: "text", admin: { readOnly: true, description: "De onde a imagem foi migrada." } },
  ],
};
