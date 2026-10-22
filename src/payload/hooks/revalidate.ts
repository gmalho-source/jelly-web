import { revalidatePath, revalidateTag } from "next/cache";
import { after } from "next/server";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { CMS_TAG } from "@/lib/cms-tag";

/**
 * Publicar no painel tem de mudar o site à vista, não no próximo deploy. O
 * Payload corre no mesmo processo que o Next, por isso basta pedir a
 * revalidação dos caminhos afetados.
 *
 * O caminho que o cache conhece é o interno, com a língua no início: o site
 * serve `/sobre`, mas a página é `/[locale]/sobre` e o middleware reescreve
 * para `/pt/sobre`. Pedir a revalidação de `/sobre` não acertava em nada — foi
 * por isso que uma fotografia carregada no painel não aparecia no site. Pede-se
 * nas duas línguas, e também o caminho sem prefixo por segurança.
 */
function bothTrees(paths: string[]): string[] {
  return paths.flatMap((path) => {
    const clean = path === "/" ? "" : path;
    return [`/pt${clean}`, `/en${clean}`, path];
  });
}

type Doc = Record<string, unknown>;

/*
 * As páginas que se refazem logo a seguir a uma gravação, sem esperar por uma
 * visita.
 *
 * A limpeza é imediata (`expire: 0`, ver `purge`), e por isso a primeira visita
 * depois de gravar esperava que a página fosse desenhada de raiz: arrancar a
 * função, acordar a base de dados, ir buscar os artigos todos. Vários segundos,
 * e uma ferramenta de monitorização com o tempo limite curto contava-os como o
 * site em baixo. Servir a versão antiga enquanto se refaz (`"max"`) não serve:
 * a página era refeita com os dados também antigos e ficava assim.
 *
 * Em vez disso, o próprio site pede estas páginas depois de responder ao
 * painel, poucas de cada vez. Quem espera é este pedido, e não quem chega a
 * seguir. As outras páginas refazem-se na primeira visita, como antes. Só em
 * produção: num preview, pedir www.jelly.pt aqueceria outro deploy.
 */
const PRINCIPAIS = [
  "/",
  "/en",
  "/servicos/marketing",
  "/servicos/tecnologia",
  "/servicos/inteligencia-artificial",
  "/servicos/branding",
  "/servicos/marketing/paid-media",
  "/servicos/marketing/video-audiovisual",
  "/blog",
  "/contactos",
];
const AO_MESMO_TEMPO = 3;
// O mesmo de `PRODUCTION_URL` em lib/seo.ts, escrito aqui para os scripts que
// carregam o Payload fora do Next não arrastarem a navegação do next-intl.
const PRODUCAO = "https://www.jelly.pt";

function aquece(paths: string[]) {
  if (process.env.VERCEL_ENV !== "production") return;
  // Os caminhos dos hooks são os portugueses, que são também os públicos.
  const fila = [...new Set([...PRINCIPAIS, ...paths.filter((path) => path.startsWith("/") && !path.includes("["))])];
  try {
    after(async () => {
      const um = async () => {
        for (let path = fila.shift(); path; path = fila.shift()) {
          await fetch(`${PRODUCAO}${path}`, { headers: { "x-jelly-aquecer": "1" }, signal: AbortSignal.timeout(30_000) }).catch(() => {});
        }
      };
      await Promise.all(Array.from({ length: AO_MESMO_TEMPO }, um));
    });
  } catch {
    // Fora de um pedido do Next (scripts) não há `after`: nada a aquecer.
  }
}

/**
 * O Payload também corre fora do Next — nos scripts de migração, por exemplo —
 * e aí não há cache para revalidar. Sem esta guarda, importar conteúdo pela
 * linha de comandos falhava no primeiro documento.
 */
function purge(paths: string[]) {
  try {
    // As leituras do site estão guardadas por etiqueta, uma vez por deploy em
    // vez de uma vez por página. Sem limpar a etiqueta, revalidar o caminho
    // voltava a desenhar a página com o conteúdo antigo.
    // `expire: 0` larga logo: com a semântica de "stale-while-revalidate" a
    // página voltava a ser desenhada com o conteúdo antigo.
    revalidateTag(CMS_TAG, { expire: 0 });
  } catch {
    return;
  }
  for (const path of bothTrees(paths)) {
    try {
      revalidatePath(path);
    } catch {
      return;
    }
  }
  aquece(paths);
}

/**
 * Para o que muda em muitos sítios ao mesmo tempo: um autor, uma categoria.
 *
 * Não se sabe que artigos é que um autor assinou sem ir à base, e passar
 * `/pt/blog/[slug]` ao Next é misturar uma língua literal com um segmento
 * dinâmico — pode não acertar em rota nenhuma. Isto larga a árvore inteira de
 * cada língua, que é exactamente o que a purga manual do site faz e o que se
 * sabe que funciona aqui.
 *
 * É um martelo, e é de propósito: um autor muda uma vez por ano e um artigo
 * servido com a assinatura errada é pior do que um cache que se refaz.
 */
function purgeTudo() {
  try {
    revalidateTag(CMS_TAG, { expire: 0 });
    revalidatePath("/", "layout");
    revalidatePath("/en", "layout");
  } catch {
    return;
  }
  aquece([]);
}

export const revalidateEverythingOnChange: CollectionAfterChangeHook = ({ doc }) => {
  purgeTudo();
  return doc;
};

export const revalidateEverythingOnDelete: CollectionAfterDeleteHook = ({ doc }) => {
  purgeTudo();
  return doc;
};

export function revalidateOnChange(paths: (doc: Doc) => string[]): CollectionAfterChangeHook {
  return ({ doc }) => {
    purge(paths(doc as Doc));
    return doc;
  };
}

export function revalidateOnDelete(paths: (doc: Doc) => string[]): CollectionAfterDeleteHook {
  return ({ doc }) => {
    purge(paths(doc as Doc));
    return doc;
  };
}
