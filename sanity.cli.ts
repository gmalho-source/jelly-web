// Diz à CLI do Sanity a que projeto pertence esta pasta, para `sanity dev` e
// `sanity deploy` correrem sem configuração na máquina de quem escreve.
import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: { projectId: "ov3ljxah", dataset: "production" },
});
