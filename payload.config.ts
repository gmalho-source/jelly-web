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
import { i18n } from "./src/payload/i18n";
import { Authors, Categories, NewsItems, Posts, Tags } from "./src/payload/collections/editorial";
import { Documents } from "./src/payload/collections/documents";
import { Attachments } from "./src/payload/collections/attachments";
import { Messages } from "./src/payload/collections/messages";
import { Applications, Departments, JobFunctions, Jobs } from "./src/payload/collections/recruitment";
import { Videos } from "./src/payload/collections/videos";
import { BillingAttempts, BillingTokens, Prestadores } from "./src/payload/collections/prestadores";
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
    // 30/06/2026, e não «junho 30º 2026, 12:00 AM».
    dateFormat: "dd/MM/yyyy",
    // Inicial em vez de gravatar: uma fotografia de perfil não vale um pedido a
    // um serviço de fora com o email de quem entra pelo meio.
    avatar: "default",
    /*
     * Atenção ao regenerar o mapa (`payload generate:importmap`): tem de ser
     * com o ambiente de produção, com BLOB_READ_WRITE_TOKEN. Os plugins entram
     * na configuração conforme o ambiente, e o do Blob traz um componente de
     * cliente para os uploads. Gerado sem o token, o mapa fica sem essa entrada
     * — e em produção, onde o plugin está ligado, o painel pede um componente
     * que o mapa não tem e fica em branco. Inteiro, entrada incluída. Foi
     * exactamente isso que aconteceu a 23/08/2026.
     */
    importMap: { baseDir: path.resolve(dirname) },
    components: {
      // A marca da casa em vez da do Payload, e uma linha de boas-vindas.
      graphics: {
        Logo: "@/payload/components/PainelMarca#PainelLogo",
        Icon: "@/payload/components/PainelMarca#PainelIcone",
      },
      afterLogin: ["@/payload/components/PainelEntrada#PainelEntrada"],
      // A faixa de boas-vindas, com os atalhos do dia-a-dia.
      beforeDashboard: ["@/payload/components/PainelCasa#PainelCasa"],
      // A marca no topo da barra lateral.
      beforeNavLinks: ["@/payload/components/PainelBarra#PainelBarra"],
    },
  },
  collections: [
    Prestadores,
    BillingTokens,
    BillingAttempts,
    Pages,
    Posts,
    Categories,
    Tags,
    Authors,
    Projects,
    Services,
    NewsItems,
    Clients,
    Logos,
    TeamMembers,
    Milestones,
    Messages,
    Attachments,
    Departments,
    JobFunctions,
    Jobs,
    Applications,
    Media,
    Videos,
    Documents,
    Users,
  ],
  // O painel fala português de Portugal — ver src/payload/i18n.ts.
  i18n,
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
          collections: { media: { disablePayloadAccessControl: true }, documents: {}, attachments: {} },
          token: blobToken,
        }),
        // ── Os vídeos, pelo caminho contrário ──────────────────────────────
        // Segunda instância do mesmo adaptador, com `clientUploads` ligado e só
        // para os vídeos. Aqui o ficheiro vai do browser direito ao Blob, com
        // uma senha de curta duração que o servidor assina, e por isso não há o
        // tecto de 4,5 MB da função. É o que permite carregar um vídeo de 34 MB
        // pelo painel em vez de o pôr no armazenamento à mão e colar o
        // endereço.
        //
        // O que se perde é o que os vídeos não precisam: o servidor nunca vê os
        // bytes, e por isso não há conversão nenhuma. Nas imagens isso seria
        // perder o WebP e os três tamanhos; num MP4 não há nada a fazer.
        //
        // Quem assina a senha decide quem pode carregar: só quem tem sessão no
        // painel. Sem esta guarda, o endpoint que assina ficava aberto a
        // qualquer pessoa que soubesse o endereço.
        vercelBlobStorage({
          collections: { videos: { disablePayloadAccessControl: true } },
          clientUploads: { access: ({ req }) => Boolean(req.user) },
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
