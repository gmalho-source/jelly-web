import { convertMarkdownToLexical, editorConfigFactory } from "@payloadcms/richtext-lexical";
import { extensaoDe, mimeFor } from "@/lib/mime";

/**
 * Markdown → a árvore do editor, com as imagens já na biblioteca.
 *
 * O texto é o conversor do Payload que trata dele. As imagens é que dão o
 * trabalho: um `![](url)` não é um nó de imagem enquanto o ficheiro não estiver
 * na biblioteca, com tipo e medidas certos.
 *
 * Por isso a ordem é esta — primeiro as imagens saem do texto e entram na
 * biblioteca, deixando uma marca no lugar; depois o texto converte-se; e só no
 * fim as marcas voltam a ser imagens, agora a apontar para ficheiros que
 * existem. Converter primeiro e emendar depois não dava: o conversor não sabe o
 * que fazer com uma imagem e deixava-a cair.
 *
 * Quem guarda os ficheiros entra por parâmetro, e não por importação: assim isto
 * corre num guião com um duplo, e a árvore pode ser conferida sem browser e sem
 * base de dados. Foi um nó do Lexical escrito à mão que já partiu 179 artigos
 * uma vez.
 */

const MARCA = (indice: number) => `JELLYIMG${indice}JELLYIMG`;

export type Imagem = { indice: number; alt: string; origem: string; mediaId?: number | string; erro?: string };
export type Guarda = (ficheiro: { nome: string; bytes: Buffer; tipo: string; alt: string }) => Promise<number | string>;

/** O bloco de metadados no topo, se existir, e o texto sem ele. */
export function separaCabecalho(markdown: string) {
  const combina = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!combina) return { meta: {} as Record<string, string>, corpo: markdown };

  const meta: Record<string, string> = {};
  for (const linha of combina[1]!.split(/\r?\n/)) {
    const par = linha.match(/^([A-Za-z_-]+)\s*:\s*(.*)$/);
    if (par) meta[par[1]!.toLowerCase()] = par[2]!.trim().replace(/^["']|["']$/g, "");
  }
  return { meta, corpo: markdown.slice(combina[0]!.length) };
}

/**
 * Troca cada imagem por uma marca sozinha no seu parágrafo.
 *
 * Sozinha de propósito: um nó de upload do Lexical não vive dentro de um
 * parágrafo, e uma imagem no meio de uma frase teria de ficar em linha. Assim
 * fica onde estava, como bloco.
 */
export function tiraImagens(markdown: string) {
  const imagens: Imagem[] = [];
  const corpo = markdown.replace(
    /!\[([^\]]*)\]\(\s*(<[^>]+>|[^)\s]+)(?:\s+"[^"]*")?\s*\)/g,
    (_todo, alt: string, origem: string) => {
      const indice = imagens.length;
      imagens.push({ indice, alt: alt.trim(), origem: origem.replace(/^<|>$/g, "") });
      return `\n\n${MARCA(indice)}\n\n`;
    },
  );
  return { corpo, imagens };
}

/** Um identificador de nó: 24 dígitos hexadecimais, como os do editor. */
const idDeNo = () =>
  [...crypto.getRandomValues(new Uint8Array(12))].map((b) => b.toString(16).padStart(2, "0")).join("");

/**
 * Um nó de upload com tudo o que o Lexical exige.
 *
 * Que é mais do que parece: sem `fields`, sem `id` ou sem `format` o editor
 * rebenta ao abrir o artigo, e a mensagem que dá não fala de nenhum deles.
 */
export const noDeImagem = (mediaId: number | string) => ({
  type: "upload",
  version: 3,
  id: idDeNo(),
  relationTo: "media",
  value: mediaId,
  fields: {},
  format: "",
});

/** Percorre a árvore e troca os parágrafos-marca por imagens. */
export function poeImagens(no: unknown, imagens: Imagem[]): unknown {
  if (!no || typeof no !== "object") return no;
  const atual = no as Record<string, unknown>;
  const filhos = atual.children;

  if (Array.isArray(filhos)) {
    atual.children = filhos.flatMap((filho) => {
      const bloco = filho as Record<string, unknown>;
      if (bloco?.type === "paragraph" && Array.isArray(bloco.children)) {
        const texto = bloco.children
          .map((parte) => (parte as { text?: string })?.text ?? "")
          .join("")
          .trim();
        const combina = texto.match(/^JELLYIMG(\d+)JELLYIMG$/);
        if (combina) {
          const imagem = imagens.find((i) => i.indice === Number(combina[1]));
          // Sem ficheiro na biblioteca não se escreve um nó a apontar para o
          // nada: o parágrafo desaparece e o aviso vai no resumo.
          return imagem?.mediaId ? [noDeImagem(imagem.mediaId)] : [];
        }
      }
      return [poeImagens(filho, imagens)];
    });
  }

  return atual;
}

/**
 * O conversor das tabelas guarda o texto de cada célula com os espaços que o
 * rodeavam entre os «|» — « 18% » em vez de «18%». No site não se vê, mas fica
 * no editor e em tudo o que lê o texto. Tiram-se aqui.
 */
function aparaCelulas(no: unknown, naCelula = false): void {
  if (!no || typeof no !== "object") return;
  const atual = no as { type?: string; children?: { text?: unknown }[] };
  const dentro = naCelula || atual.type === "tablecell";
  const filhos = atual.children;
  if (!Array.isArray(filhos)) return;
  if (dentro && atual.type === "paragraph") {
    const textos = filhos.filter((filho) => typeof filho.text === "string") as { text: string }[];
    if (textos.length) {
      textos[0]!.text = textos[0]!.text.trimStart();
      textos[textos.length - 1]!.text = textos[textos.length - 1]!.text.trimEnd();
    }
    return;
  }
  for (const filho of filhos) aparaCelulas(filho, dentro);
}

/** Busca uma imagem e entrega-a a quem a guarda. */
export async function trazImagem(imagem: Imagem, guarda: Guarda, nomeBase: string) {
  // Já está na biblioteca: um Word lido no browser sobe as imagens antes de
  // mandar o texto (ver `payload/components/docx.ts`), e o que chega é o número.
  const naBiblioteca = imagem.origem.match(/^media:(\d+)$/);
  if (naBiblioteca) return Number(naBiblioteca[1]);

  if (imagem.origem.startsWith("data:")) {
    const partes = imagem.origem.match(/^data:([^;,]+)[^,]*,(.*)$/);
    if (!partes) throw new Error("data: ilegível");
    const tipo = partes[1]!;
    const bytes = Buffer.from(partes[2]!, "base64");
    return guarda({
      nome: `${nomeBase || "markdown"}-${imagem.indice}.${extensaoDe(tipo)}`,
      bytes,
      tipo,
      alt: imagem.alt || nomeBase || "Imagem do artigo",
    });
  }

  if (!/^https?:\/\//i.test(imagem.origem)) {
    // Um caminho relativo não se resolve: o Markdown veio sem a pasta ao lado, e
    // adivinhar de onde vinha era inventar.
    throw new Error("caminho relativo — a imagem tem de ser carregada à mão");
  }

  const resposta = await fetch(imagem.origem);
  if (!resposta.ok) throw new Error(`o endereço respondeu ${resposta.status}`);
  const bytes = Buffer.from(await resposta.arrayBuffer());
  const nome = decodeURIComponent(new URL(imagem.origem).pathname.split("/").pop() || `imagem-${imagem.indice}.jpg`);
  const tipo = resposta.headers.get("content-type")?.split(";")[0] || mimeFor(nome);
  return guarda({ nome, bytes, tipo, alt: imagem.alt || nome });
}

type Configuracao = Parameters<typeof editorConfigFactory.default>[0]["config"];
type Campo = { type?: string; name?: string; fields?: Campo[]; tabs?: Campo[] };

/**
 * O editor do corpo dos artigos, e não o de base: é lá que estão as tabelas, as
 * imagens com posição e o vídeo. Com o de base, uma tabela do Markdown ficava
 * em linhas de texto com traços verticais.
 *
 * Tirado da configuração já resolvida — o campo `body` dos artigos — e não da
 * coleção importada, pelo mesmo círculo que o endpoint evita (ver
 * `markdown-import.ts`). Se o campo não aparecer, serve o de base.
 */
export async function editorDoArtigo(config: unknown) {
  const configuracao = config as Configuracao;
  const procura = (campos: Campo[] = []): Campo | undefined => {
    for (const campo of campos) {
      if (campo.type === "richText" && campo.name === "body") return campo;
      const dentro = procura(campo.fields) ?? procura(campo.tabs);
      if (dentro) return dentro;
    }
    return undefined;
  };
  const artigos = configuracao.collections?.find((colecao) => colecao.slug === "posts");
  const corpo = procura(artigos?.fields as Campo[] | undefined);
  return corpo
    ? editorConfigFactory.fromField({ field: corpo as Parameters<typeof editorConfigFactory.fromField>[0]["field"] })
    : editorConfigFactory.default({ config: configuracao });
}

export type Importado = {
  body: unknown;
  meta: { titulo?: string; resumo?: string; data?: string };
  /** O cabeçalho `---` tal como veio, com as chaves em minúsculas. */
  cabecalho: Record<string, string>;
  imagens: { entraram: number; falharam: { origem: string; erro?: string }[] };
};

export async function markdownParaLexical(
  markdown: string,
  guarda: Guarda,
  opcoes: { nome?: string; config: unknown } ,
): Promise<Importado> {
  const { meta, corpo: semCabecalho } = separaCabecalho(markdown);
  const { corpo: comMarcas, imagens } = tiraImagens(semCabecalho);

  // Uma imagem que falhe não leva o artigo com ela: fica no resumo, para quem
  // importou saber o que tem de acrescentar à mão.
  for (const imagem of imagens) {
    try {
      imagem.mediaId = await trazImagem(imagem, guarda, (opcoes.nome ?? "").replace(/\.[^.]+$/, ""));
    } catch (erro) {
      imagem.erro = erro instanceof Error ? erro.message : "não entrou";
    }
  }

  const editorConfig = await editorDoArtigo(opcoes.config);
  const arvore = convertMarkdownToLexical({ editorConfig, markdown: comMarcas });
  poeImagens(arvore.root, imagens);
  aparaCelulas(arvore.root);

  return {
    body: arvore,
    cabecalho: meta,
    meta: {
      ...(meta.title ? { titulo: meta.title } : {}),
      ...(meta.description || meta.excerpt ? { resumo: meta.description ?? meta.excerpt } : {}),
      ...(meta.date ? { data: meta.date } : {}),
    },
    imagens: {
      entraram: imagens.filter((i) => i.mediaId).length,
      falharam: imagens.filter((i) => i.erro).map((i) => ({ origem: i.origem, erro: i.erro })),
    },
  };
}
