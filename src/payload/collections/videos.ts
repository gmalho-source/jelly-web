import type { CollectionConfig } from "payload";
import { revalidateEverythingOnChange, revalidateEverythingOnDelete } from "../hooks/revalidate";

/**
 * Vídeos: os dos casos de portfólio, e os fundos de topo das páginas.
 *
 * Coleção separada das imagens por uma razão de mecânica e não de arrumação.
 *
 * Uma imagem tem de passar pelo servidor: é lá que o sharp a converte para WebP
 * e gera os três tamanhos. Mas um pedido a uma função da Vercel não pode
 * exceder 4,5 MB — e é esse, e não outro, o tecto com que alguém bate ao tentar
 * carregar um vídeo de 34 MB pelo painel. Não há maneira de o levantar.
 *
 * Um vídeo não precisa de passar pelo servidor: não há nada a converter. Por
 * isso vai do browser direito ao armazenamento, com uma senha de curta duração
 * que o servidor assina — é o `clientUploads` na configuração. O tecto passa a
 * ser o do próprio armazenamento, que são terabytes.
 *
 * As imagens ficam como estavam: o caminho antigo continua a ser o certo para
 * elas, e misturar as duas coleções obrigaria a escolher um dos dois caminhos
 * para ambas.
 */
export const Videos: CollectionConfig = {
  slug: "videos",
  labels: { singular: "Vídeo", plural: "Vídeos" },
  admin: {
    useAsTitle: "title",
    group: "Casa",
    defaultColumns: ["title", "filename", "filesize"],
    description:
      "Vídeos dos casos e fundos de topo. Vão do browser direito ao armazenamento, sem passar pelo servidor — por isso não há o limite de 4,5 MB que trava as imagens.",
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverythingOnChange], afterDelete: [revalidateEverythingOnDelete] },
  upload: {
    mimeTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },
  fields: [
    {
      name: "title",
      label: "Título",
      type: "text",
      admin: { description: "Como este vídeo se chama no painel. Não vai para o site." },
    },
    {
      name: "note",
      label: "Nota",
      type: "text",
      admin: {
        description:
          "Para quem vier a seguir: de onde veio, que corte é, o que não se pode voltar a usar.",
      },
    },
  ],
};
