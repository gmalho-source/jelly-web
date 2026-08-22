import path from "node:path";
import { fileURLToPath } from "node:url";
import * as neonServerless from "@neondatabase/serverless";
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
import { Documents } from "./src/payload/collections/documents";
import { Messages } from "./src/payload/collections/messages";
import { Applications, Departments, JobFunctions, Jobs } from "./src/payload/collections/recruitment";
import { Clients, Logos, Milestones, Projects, Services, TeamMembers } from "./src/payload/collections/work";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
const resendKey = process.env.RESEND_API_KEY;
const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";

/**
 * Na Neon fala-se pelo driver serverless, que usa WebSocket em 443: liga mais
 * depressa a frio, não esgota o número de ligações quando há muitas funções ao
 * mesmo tempo, e passa em redes onde a 5432 não sai. A interface é a do `pg`, o
 * que deixa o adaptador igual. Fora da Neon — Postgres local — usa-se o `pg`.
 */
const onNeon = /\.neon\.tech(?::|\/|$)/.test(new URL(databaseUrl || "postgresql://localhost").hostname);

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: { titleSuffix: " · Jelly" },
    importMap: { baseDir: path.resolve(dirname) },
  },
  collections: [
    Pages,
    Posts,
    Categories,
    Projects,
    Services,
    NewsItems,
    Clients,
    Logos,
    TeamMembers,
    Milestones,
    Messages,
    Departments,
    JobFunctions,
    Jobs,
    Applications,
    Media,
    Documents,
    Users,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: { connectionString: databaseUrl },
    ...(onNeon ? { pg: neonServerless as unknown as Parameters<typeof postgresAdapter>[0]["pg"] } : {}),
  }),
  typescript: { outputFile: path.resolve(dirname, "src/payload/types.ts") },
  // Os ficheiros vivem no Blob da Vercel: não há disco persistente no serverless.
  // Sem token, ficam no disco local, o que serve para desenvolver.
  plugins: blobToken
    ? [
        // Sem `clientUploads`: mandar o ficheiro do browser direito ao Blob
        // parece melhor, mas aí o servidor nunca vê os bytes — o sharp não
        // corre, a conversão para WebP não acontece, e o ficheiro principal
        // ficava a faltar na store enquanto o documento apontava para ele. O
        // preço é o limite de 4,5 MB por upload que a Vercel impõe às funções.
        vercelBlobStorage({
          // Sem o controlo de acesso do Payload à frente, os endereços apontam
          // direitos ao CDN do Blob: as imagens deixam de passar por uma função
          // a cada pedido. São capas de projetos, públicas de qualquer maneira.
          // As imagens são públicas; os documentos não. Sem esta distinção, um
          // CV ficava com endereço no CDN, sem sessão pelo meio.
          collections: { media: { disablePayloadAccessControl: true }, documents: {} },
          token: blobToken,
        }),
      ]
    : [],
  // Redimensionamento das imagens carregadas.
  sharp,
  // Recuperação de senha do painel. Sem chave, o Payload escreve no log, que
  // basta para desenvolver.
  ...(resendKey
    ? {
        email: resendAdapter({
          defaultFromAddress: "hello@jelly.pt",
          defaultFromName: "Jelly",
          apiKey: resendKey,
        }),
      }
    : {}),
});
