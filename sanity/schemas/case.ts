type Rule = { required: () => Rule };

/**
 * Narrativa de um caso. É Portable Text com três blocos a mais do que um
 * artigo — galeria, vídeo e link externo — porque é disso que uma página de
 * projeto é feita. A ordem no editor é a ordem na página.
 */
export const galleryBlock = {
  name: "galleryBlock",
  title: "Galeria",
  type: "object",
  fields: [{ name: "images", title: "Imagens", type: "array", of: [{ type: "coverImage" }], validation: (rule: Rule) => rule.required() }],
  preview: { select: { images: "images" }, prepare: ({ images }: { images?: unknown[] }) => ({ title: `Galeria (${images?.length ?? 0})` }) },
};

export const videoBlock = {
  name: "videoBlock",
  title: "Vídeo",
  type: "object",
  fields: [
    { name: "mp4", title: "MP4", type: "url", description: "Endereço do ficheiro. Os vídeos do site antigo ainda servem de www.jelly.pt." },
    { name: "webm", title: "WebM", type: "url" },
    { name: "poster", title: "Primeiro fotograma", type: "coverImage" },
    { name: "portrait", title: "Vertical (9:16)", type: "boolean", initialValue: false },
  ],
  preview: { select: { subtitle: "mp4" }, prepare: ({ subtitle }: { subtitle?: string }) => ({ title: "Vídeo", subtitle }) },
};

export const embedBlock = {
  name: "embedBlock",
  title: "Vídeo do YouTube",
  type: "object",
  fields: [{ name: "url", title: "Endereço", type: "url", validation: (rule: Rule) => rule.required() }],
  preview: { select: { subtitle: "url" }, prepare: ({ subtitle }: { subtitle?: string }) => ({ title: "YouTube", subtitle }) },
};

export const linkBlock = {
  name: "linkBlock",
  title: "Botão para fora",
  type: "object",
  fields: [
    { name: "label", title: "Texto", type: "string", validation: (rule: Rule) => rule.required() },
    { name: "href", title: "Endereço", type: "url", validation: (rule: Rule) => rule.required() },
  ],
  preview: { select: { title: "label", subtitle: "href" } },
};

export const caseStory = {
  name: "caseStory",
  title: "História",
  type: "array",
  of: [
    {
      type: "block",
      styles: [
        { title: "Parágrafo", value: "normal" },
        { title: "Secção", value: "h2" },
        { title: "Subsecção", value: "h3" },
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
          { name: "link", title: "Link", type: "object", fields: [{ name: "href", title: "URL", type: "url" }] },
        ],
      },
    },
    { type: "coverImage" },
    { type: "galleryBlock" },
    { type: "videoBlock" },
    { type: "embedBlock" },
    { type: "linkBlock" },
  ],
};
