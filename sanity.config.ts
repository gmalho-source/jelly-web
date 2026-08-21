// Studio do Sanity. Corre à parte do site: `npm run studio` em local,
// `npm run studio:deploy` para o alojar em jelly.sanity.studio.
// Precisa de `npm i -D sanity @sanity/vision` — ficam fora do build do site.
//
// O ID do projeto está escrito aqui de propósito: o Studio é uma aplicação
// Vite, não Next, e não tem a substituição de variáveis NEXT_PUBLIC_* que o
// site usa. Não é segredo — quem manda no acesso é o login, não o ID.
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./sanity/schemas";
import { PAGE_KEYS } from "./sanity/schemas/page";

const projectId = "ov3ljxah";
const dataset = "production";
const apiVersion = "2026-08-01";

export default defineConfig({
  name: "jelly",
  title: "Jelly",
  projectId,
  dataset,
  plugins: [
    structureTool({
      // As páginas são uma lista fixa: editam-se, não se criam nem se apagam.
      structure: (S) =>
        S.list()
          .title("Conteúdo")
          .items([
            S.listItem()
              .title("Páginas")
              .child(
                S.list()
                  .title("Páginas")
                  .items(
                    PAGE_KEYS.map(({ slug, title }) =>
                      S.listItem()
                        .id(slug)
                        .title(title)
                        .child(S.document().documentId(`page-${slug}`).schemaType("page").title(title)),
                    ),
                  ),
              ),
            S.divider(),
            S.documentTypeListItem("post").title("Artigos"),
            S.documentTypeListItem("category").title("Categorias"),
            S.documentTypeListItem("project").title("Casos"),
            S.documentTypeListItem("archivedProject").title("Arquivo de projetos"),
            S.documentTypeListItem("service").title("Serviços"),
            S.documentTypeListItem("newsItem").title("Newsroom"),
            S.divider(),
            S.documentTypeListItem("client").title("Clientes"),
            S.documentTypeListItem("teamMember").title("Equipa"),
            S.documentTypeListItem("milestone").title("Marcos"),
            S.documentTypeListItem("logoGallery").title("Galerias de logos"),
          ]),
    }),
    visionTool({ defaultApiVersion: apiVersion }),
  ],
  schema: { types: schemaTypes },
});
