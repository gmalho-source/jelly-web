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
import { NdaLink } from "./src/payload/globals/nda-link";
import { DebitosDiretos } from "./src/payload/collections/debitos";
import { Pages } from "./src/payload/collections/pages";
import { Users } from "./src/payload/collections/users";
import { i18n } from "./src/payload/i18n";
import { Authors, Categories, NewsItems, Posts, Tags } from "./src/payload/collections/editorial";
import { Documents } from "./src/payload/collections/documents";
import { Attachments } from "./src/payload/collections/attachments";
import { CarePlans } from "./src/payload/collections/care";
import { Messages } from "./src/payload/collections/messages";
import { Applications, Departments, JobFunctions, Jobs } from "./src/payload/collections/recruitment";
import { BIBLIOTECA, tem, type ComModulos } from "./src/payload/acesso";
import { Videos } from "./src/payload/collections/videos";
import { Downloads } from "./src/payload/collections/downloads";
import { Assinaturas, AssinaturasFicheiros } from "./src/payload/collections/assinaturas";
import { BillingAttempts, BillingTokens, Prestadores } from "./src/payload/collections/prestadores";
import { Clients, LogoWalls, Logos, Milestones, Projects, Sectors, Services, TeamMembers } from "./src/payload/collections/work";

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
    meta: {
      titleSuffix: " · Jelly",
      /*
       * O separador do painel passa a ter o monograma da casa em vez do do
       * Payload. É o mesmo desenho de components/JellyLogo.tsx, recortado à
       * volta da letra: num separador de 16px o que se lê é a forma, e uma
       * forma com ar à volta desaparece. Preto sobre branco, e não o vermelho
       * do ícone do site, para se distinguir à primeira o painel do sítio
       * público — costumam estar lado a lado no mesmo browser.
       *
       * Três entradas por uma razão prática: o SVG é o que o Chrome e o
       * Firefox preferem e o único que fica nítido em qualquer tamanho; o PNG
       * de 32 é para quem não lê SVG; o de 512 é o que o telemóvel guarda
       * quando se põe o painel no ecrã inicial.
       */
      icons: [
        { rel: "icon", type: "image/svg+xml", url: "/brand/jelly-favicon-admin.svg" },
        { rel: "icon", type: "image/png", sizes: "32x32", url: "/brand/jelly-favicon-admin-32.png" },
        { rel: "apple-touch-icon", type: "image/png", sizes: "512x512", url: "/brand/jelly-favicon-admin-512.png" },
      ],
    },
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
  globals: [NdaLink],
  collections: [
    Prestadores,
    DebitosDiretos,
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
    Sectors,
    LogoWalls,
    Logos,
    TeamMembers,
    Milestones,
    Messages,
    CarePlans,
    Attachments,
    Departments,
    JobFunctions,
    Jobs,
    Applications,
    Media,
    Videos,
    Downloads,
    Assinaturas,
    AssinaturasFicheiros,
    Documents,
    Users,
  ],
  // O painel fala português de Portugal — ver src/payload/i18n.ts.
  i18n,
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  db: postgresAdapter({
    pool: { connectionString: databaseUrl },
    // Fora de produção, o Payload acerta sozinho a base pelo código («push»).
    // Numa base local é o que se quer; na Neon nunca: a base de produção muda
    // só por SQL escrito à mão (scripts/sql/). E não é teórico — o áudio corre
    // no GitHub sem NODE_ENV=production, o push encontrou colunas antigas na
    // Neon, parou a perguntar se as podia apagar, e a corrida morreu ali à
    // espera de uma resposta que ninguém ia dar (outubro de 2026).
    push: !onNeon,
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
          collections: { media: { disablePayloadAccessControl: true } },
          token: blobToken,
        }),
        // ── Os ficheiros pessoais: CV, briefings, documentos para assinar ───
        // Passam pelo controlo de acesso do Payload (`/api/…/file/…` pede
        // sessão). Mas o armazenamento do Blob é público — o plugin não sabe
        // outro — e o mesmo ficheiro existe também no CDN, sem sessão nenhuma,
        // em `<store>.public.blob.vercel-storage.com/<nome>`. Com o nome
        // original, `CV_Nome_Apelido.pdf` abria-se por quem o adivinhasse. O
        // sufixo aleatório da Vercel (trinta caracteres) torna o nome
        // impossível de adivinhar; o Payload guarda o nome com o sufixo e é por
        // ele que lê e apaga. Os que já lá estavam foram renomeados por
        // scripts/blob-renomear.mjs.
        vercelBlobStorage({
          collections: { documents: {}, attachments: {} },
          addRandomSuffix: true,
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
          // Os downloads do Newsroom vão pelo mesmo caminho: um press kit
          // passa dos 90 MB. E os PDFs para assinar, que podem passar dos
          // 4,5 MB (o teto é 10 MB, ver a coleção).
          //
          // Só pode haver uma instância com `clientUploads`: a rota que assina
          // a senha é uma só (`/vercel-blob-client-upload-route`), e com duas a
          // primeira respondia pelas duas. Por isso os PDFs para assinar vivem
          // aqui, e esta instância também põe o sufixo aleatório no nome — num
          // vídeo ou num press kit não faz mal, o endereço sai do nome guardado.
          collections: {
            videos: { disablePayloadAccessControl: true },
            downloads: { disablePayloadAccessControl: true },
            "assinaturas-ficheiros": {},
          },
          addRandomSuffix: true,
          clientUploads: {
            // Cada coleção, com o módulo dela: só quem pode criar lá pede a
            // senha para carregar.
            access: ({ req, collectionSlug }) =>
              collectionSlug === "assinaturas-ficheiros"
                ? tem(req.user as ComModulos, "assinaturas")
                : collectionSlug === "downloads"
                  ? tem(req.user as ComModulos, "editorial")
                  : tem(req.user as ComModulos, ...BIBLIOTECA),
          },
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
