#!/usr/bin/env node
/**
 * Enche a página do serviço de inteligência artificial com o conteúdo da página
 * do site antigo — o que lá está escrito, na voz deste site.
 *
 * O que muda em relação ao original: o tratamento. A página antiga trata por
 * «você», e todo este site trata por «tu»; mudar a voz numa página só faria a
 * casa falar de duas maneiras. Fica também de fora o retrato «AI specialist at
 * Jelly» — é uma pessoa que não é da casa, numa página sobre confiar em quem
 * faz IA — e o plano de escritório com sobreposições de rede, que é imagem de
 * stock e não se dá com o resto do site.
 *
 * O vídeo de topo é o mesmo, encolhido de 6,1 MB para 407 KB pelo
 * `npm run video:prep`.
 *
 *   DATABASE_URL=… PAYLOAD_SECRET=… node scripts/servico-ia.mjs --dry-run
 */
import fs from "node:fs";
import path from "node:path";
import { getPayload } from "payload";
import config from "../payload.config.ts";
import { purgeSite } from "./purge-site.mjs";

const seco = process.argv.includes("--dry-run");
const cartaz = process.argv.find((a) => a.startsWith("--cartaz="))?.split("=")[1];

const VIDEO = "https://vndty5nncbevu59o.public.blob.vercel-storage.com/video/ia-topo.mp4";

const conteudo = {
  heroTitle: {
    pt: "Ajudamos empresas a adotar IA com impacto real no negócio.",
    en: "We help companies adopt AI with real impact on the business.",
  },
  heroVideo: VIDEO,
  statement: {
    first: { pt: "A IA vai encontrar o teu negócio.", en: "AI is going to find your business." },
    second: {
      pt: "A questão é se ele está preparado para ser encontrado.",
      en: "The question is whether it is ready to be found.",
    },
  },
  areas: [
    {
      title: {
        pt: "Consultoria estratégica em IA aplicada ao negócio",
        en: "Strategy consulting on AI applied to the business",
      },
      body: {
        pt: "Transformar dados em decisões: prever tendências, identificar oportunidades e sustentar cada escolha em evidência, não em opinião.",
        en: "Turning data into decisions: forecasting trends, spotting opportunities, and backing every choice with evidence rather than opinion.",
      },
    },
    {
      title: {
        pt: "Implementação de agentes e copilotos internos",
        en: "Agents and internal copilots, shipped",
      },
      body: {
        pt: "Tarefas repetitivas fora, plataformas ligadas entre si, e fluxos que correm sozinhos — o tempo que sobra volta para a equipa.",
        en: "Repetitive work out, platforms wired together, and flows that run on their own — the time saved goes back to the team.",
      },
    },
    {
      title: {
        pt: "Sites e conteúdos preparados para agentes de pesquisa",
        en: "Sites and content ready for search agents",
      },
      body: {
        pt: "Escritos para serem compreendidos e recomendados por quem já não percorre dez links azuis: os agentes de pesquisa.",
        en: "Written to be understood and recommended by the readers who no longer scan ten blue links: search agents.",
      },
    },
    {
      title: { pt: "Marketing e vendas", en: "Marketing and sales" },
      body: {
        pt: "Conteúdo personalizado, campanhas afinadas e previsão de procura: automação e segmentação onde mudam o número, não onde dão para demonstrar.",
        en: "Personalised content, tuned campaigns and demand forecasting: automation and segmentation where they move the number, not where they demo well.",
      },
    },
  ],
  essayTitle: { pt: "Não há hype. Há propósito.", en: "No hype. Purpose." },
  essay: [
    {
      body: {
        pt: "A integração da inteligência artificial deve começar onde o impacto é mais claro.",
        en: "Bringing artificial intelligence in should start where the impact is clearest.",
      },
    },
    {
      body: {
        pt: "Ajudamos as empresas a identificar essas áreas e a transformar processos complexos em ganhos reais de performance, tempo e margem.",
        en: "We help companies find those areas and turn complex processes into real gains in performance, time and margin.",
      },
    },
    {
      body: {
        pt: "Cada projeto começa por uma análise das oportunidades de adoção: onde faz sentido, e onde traz retorno. As estratégias são híbridas — a tecnologia serve o pensamento, e não o contrário.",
        en: "Every project starts with a read of where adoption makes sense, and where it pays back. The strategies are hybrid: technology serves the thinking, not the other way round.",
      },
    },
  ],
  closing: {
    question: {
      pt: "Queres perceber onde a IA pode gerar impacto real no teu negócio?",
      en: "Want to know where AI can make a real difference in your business?",
    },
    answer: { pt: "Nós ajudamos a descobrir.", en: "We help you find out." },
  },
};

const payload = await getPayload({ config });

const { docs } = await payload.find({ collection: "services", where: { slug: { equals: "inteligencia-artificial" } }, limit: 1, depth: 0 });
if (!docs.length) throw new Error("serviço não encontrado");
const servico = docs[0];

/** O primeiro fotograma do vídeo entra como imagem, para o painel o gerir. */
async function poster() {
  if (!cartaz) return servico.heroPoster ?? undefined;
  const nome = path.basename(cartaz);
  const existente = await payload.find({ collection: "media", where: { filename: { like: nome.replace(/\.\w+$/, "") } }, limit: 1, depth: 0 });
  if (existente.docs.length) return existente.docs[0].id;

  const data = fs.readFileSync(cartaz);
  const criado = await payload.create({
    collection: "media",
    data: {
      title: "Primeiro fotograma do vídeo de topo da página de IA",
      alt: "Palavras a passar num fundo preto, com a sigla AI destacada a branco no meio da linha",
    },
    file: { name: nome, data, mimetype: "image/jpeg", size: data.byteLength },
  });
  return criado.id;
}

const data = { ...conteudo, heroPoster: await poster() };

if (seco) {
  console.log(JSON.stringify(data, null, 1).slice(0, 1200));
  console.log("\n(ensaio, nada gravado)");
  process.exit(0);
}

await payload.update({ collection: "services", id: servico.id, data });
console.log("página de IA preenchida");
await purgeSite();
process.exit(0);
