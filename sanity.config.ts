// Studio do Sanity. Corre à parte do site: `npx sanity dev` em local,
// `npx sanity deploy` para o alojar em jelly.sanity.studio.
// Precisa de `npm i -D sanity @sanity/vision` — ficam fora do build do site.
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schemaTypes } from "./sanity/schemas";

export default defineConfig({
  name: "jelly",
  title: "Jelly",
  projectId,
  dataset,
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
});
