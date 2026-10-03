import type { CollectionConfig } from "payload";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";

/**
 * Ficheiros para o público descarregar: o press kit completo e os logos.
 *
 * Vão do browser direito ao armazenamento, como os vídeos — um press kit tem
 * quase 100 MB, e pelo servidor só passam 4,5. Cada um diz onde aparece, e o
 * site vai buscar o mais recente de cada sítio: para trocar o press kit,
 * carrega-se o novo com o mesmo «Onde aparece», e o botão passa a apontar
 * para ele.
 *
 * Abertos de propósito, sem pedir email a ninguém: quem descarrega um press
 * kit é quase sempre um jornalista com prazo, e o conteúdo — logos, retratos,
 * boilerplate — já é público. Quantos descarregam mede-se no GTM
 * (`press_kit_download`), e quem quiser receber comunicados subscreve ao lado.
 */
export const Downloads: CollectionConfig = {
  slug: "downloads",
  labels: { singular: "Download", plural: "Downloads" },
  admin: {
    useAsTitle: "title",
    group: "Editorial",
    defaultColumns: ["title", "uso", "filesize", "updatedAt"],
    description:
      "Ficheiros que o site oferece para descarregar, no Newsroom. Vão direito ao armazenamento, sem o limite de 4,5 MB. Para trocar um, carrega o novo com o mesmo «Onde aparece».",
  },
  access: { read: () => true },
  hooks: {
    afterChange: [revalidateOnChange(() => ["/newsroom"])],
    afterDelete: [revalidateOnDelete(() => ["/newsroom"])],
  },
  upload: {
    mimeTypes: ["application/zip", "application/x-zip-compressed", "application/pdf"],
  },
  fields: [
    {
      name: "title",
      label: "Nome",
      type: "text",
      required: true,
      admin: { description: "Como o ficheiro se chama no painel, por exemplo «Press kit 2026»." },
    },
    {
      name: "uso",
      label: "Onde aparece",
      type: "select",
      required: true,
      options: [
        { label: "Newsroom — press kit completo", value: "press-kit" },
        { label: "Newsroom — logos", value: "logos" },
      ],
    },
  ],
};
