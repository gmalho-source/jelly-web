import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { resendAdapter } from "@payloadcms/email-resend";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob";
import { buildConfig } from "payload";
import sharp from "sharp";
import { Media } from "./src/payload/collections/media";
import { Pages } from "./src/payload/collections/pages";
import { Users } from "./src/payload/collections/users";
import { Categories, NewsItems, Posts } from "./src/payload/collections/editorial";
import { Clients, Logos, Milestones, Projects, Services, TeamMembers } from "./src/payload/collections/work";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const resendKey = process.env.RESEND_API_KEY;

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: " · Jelly" },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [Pages, Posts, Categories, Projects, Services, NewsItems, Clients, Logos, TeamMembers, Milestones, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({ pool: { connectionString: process.env.DATABASE_URL ?? "" } }),
  typescript: { outputFile: path.resolve(dirname, "src/payload/types.ts") },
  // Os ficheiros vivem no Blob da Vercel: não há disco persistente no serverless.
  // Sem token, ficam no disco local, o que serve para desenvolver.
  plugins: blobToken ? [vercelBlobStorage({ collections: { media: true }, token: blobToken })] : [],
  // Redimensionamento das imagens carregadas.
  sharp,
  // Recuperação de senha do painel. Sem chave, o Payload escreve no log, que
  // basta para desenvolver.
  ...(resendKey
    ? {
        email: resendAdapter({
          defaultFromAddress: "geral@jelly.pt",
          defaultFromName: "Jelly",
          apiKey: resendKey,
        }),
      }
    : {}),
});
