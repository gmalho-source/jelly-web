import { revalidatePath, revalidateTag } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";
import { CMS_TAG } from "@/lib/cms";

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
}

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
