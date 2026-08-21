import { revalidatePath } from "next/cache";
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from "payload";

/**
 * Publicar no painel tem de mudar o site à vista, não no próximo deploy. O
 * Payload corre no mesmo processo que o Next, por isso basta pedir a
 * revalidação dos caminhos afetados — nas duas árvores de língua, com o PT na
 * raiz e o EN prefixado.
 */
function bothTrees(paths: string[]): string[] {
  return paths.flatMap((path) => [path, path === "/" ? "/en" : `/en${path}`]);
}

type Doc = Record<string, unknown>;

/**
 * O Payload também corre fora do Next — nos scripts de migração, por exemplo —
 * e aí não há cache para revalidar. Sem esta guarda, importar conteúdo pela
 * linha de comandos falhava no primeiro documento.
 */
function purge(paths: string[]) {
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
