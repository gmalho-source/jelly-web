// Corre antes de cada compilação (npm `prebuild`). Está aqui e não em scripts/
// porque scripts/ fica fora do deploy (.vercelignore). O importMap do painel é
// gerado à mão (`npm run payload:importmap`) e é diferente conforme haja ou não
// BLOB_READ_WRITE_TOKEN: sem ele, o componente do envio direto para o Blob
// desaparece — e um painel sem ele não arranca, fica em branco. Aconteceu em
// produção (outubro de 2026). Melhor uma compilação que falha do que um painel
// em branco.
import { readFileSync } from "node:fs";

const ficheiro = "src/app/(payload)/admin/importMap.js";
const mapa = readFileSync(ficheiro, "utf8");
const precisa = ["@payloadcms/storage-vercel-blob/client#VercelBlobClientUploadHandler"];
const faltam = precisa.filter((chave) => !mapa.includes(`"${chave}"`));
if (faltam.length) {
  console.error(`\n✖ ${ficheiro} não tem: ${faltam.join(", ")}`);
  console.error("  Gera-o outra vez com o token do Blob no ambiente: BLOB_READ_WRITE_TOKEN=… npm run payload:importmap\n");
  process.exit(1);
}
console.log("importMap do painel: completo.");
