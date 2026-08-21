// Diz à CLI do Sanity a que projeto pertence esta pasta, para `sanity dev` e
// `sanity deploy` correrem sem configuração na máquina de quem escreve.
import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: { projectId: "ov3ljxah", dataset: "production" },
  // O endereço do Studio publicado. Fica escrito para o `deploy` não perguntar
  // e para não haver duas pessoas a publicar em sítios diferentes.
  // `jelly.sanity.studio` já pertence a outro projeto — o espaço de nomes é
  // global a todo o Sanity.
  studioHost: "jelly-web",
});
