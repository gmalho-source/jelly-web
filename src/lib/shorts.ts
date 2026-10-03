import type { ArchivedProject, Block } from "@/content/types";
import { fonteDeVideo } from "./video";

/**
 * Os Shorts colados como `youtu.be/…`.
 *
 * Um Short desenha-se na vertical, e o endereço é a única coisa que o diz: o
 * `youtube.com/shorts/ID` diz, o `youtu.be/ID` que o botão «partilhar» dá não
 * diz nada. Para não pedir a quem escreve que se lembre de qual colar,
 * pergunta-se ao YouTube: `youtube.com/shorts/ID` responde 200 a um Short e
 * redireciona (303) um vídeo normal. Sendo Short, o endereço passa à forma de
 * Short, e o resto do site já sabe o que fazer.
 *
 * Corre onde se lê o arquivo, que fica guardado até o painel mudar: é uma
 * pergunta por vídeo por publicação, não por visita. Se o YouTube não
 * responder, o endereço fica como estava — um Short deitado é melhor do que
 * uma página que não se desenha.
 */
const ESPERA_MS = 3000;

async function eShort(id: string): Promise<boolean> {
  try {
    const resposta = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    return resposta.status === 200;
  } catch {
    return false;
  }
}

/** Os ids do YouTube deitados (pelo endereço) que aparecem em blocos de vídeo. */
function idsPorVer(blocos: Block[], ids: Set<string>) {
  for (const bloco of blocos) {
    if (bloco.type === "columns") bloco.columns.forEach((coluna) => idsPorVer(coluna, ids));
    if (bloco.type !== "embed") continue;
    const fonte = fonteDeVideo(bloco.url);
    if (fonte?.tipo === "youtube" && !fonte.vertical) ids.add(fonte.id);
  }
}

function comShorts(blocos: Block[], shorts: Set<string>): Block[] {
  return blocos.map((bloco) => {
    if (bloco.type === "columns") return { ...bloco, columns: bloco.columns.map((coluna) => comShorts(coluna, shorts)) };
    if (bloco.type !== "embed") return bloco;
    const fonte = fonteDeVideo(bloco.url);
    if (fonte?.tipo !== "youtube" || fonte.vertical || !shorts.has(fonte.id)) return bloco;
    return { ...bloco, url: `https://www.youtube.com/shorts/${fonte.id}` };
  });
}

export async function marcaShorts(projetos: ArchivedProject[]): Promise<ArchivedProject[]> {
  const ids = new Set<string>();
  for (const projeto of projetos) {
    idsPorVer(projeto.story, ids);
    idsPorVer(projeto.storyEn ?? [], ids);
  }
  if (!ids.size) return projetos;

  const respostas = await Promise.all([...ids].map(async (id) => [id, await eShort(id)] as const));
  const shorts = new Set(respostas.filter(([, sim]) => sim).map(([id]) => id));
  if (!shorts.size) return projetos;

  return projetos.map((projeto) => ({
    ...projeto,
    story: comShorts(projeto.story, shorts),
    ...(projeto.storyEn ? { storyEn: comShorts(projeto.storyEn, shorts) } : {}),
  }));
}
