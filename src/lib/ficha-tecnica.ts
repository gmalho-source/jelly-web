/**
 * A ficha técnica de um artigo: o que o documento diz sobre si próprio.
 *
 * Num Word é uma tabela de duas colunas no fim, debaixo de um título «Ficha
 * técnica» — campo à esquerda, valor à direita, e a imagem de capa colada na
 * célula «Capa». Num Markdown é o cabeçalho `---` do topo, com as mesmas
 * chaves em inglês ou em português. As duas dão a mesma `Ficha`, e é o
 * servidor que a transforma em campos (ver `endpoints/markdown-import.ts`).
 *
 * Tabela e não linhas «Campo: valor» porque o Word não desfaz uma tabela com
 * uma quebra de linha a mais; mas as linhas também se leem, para quem as
 * escrever assim.
 *
 * Um valor entre parênteses rectos — «[Nome do autor]» — é o que vem no modelo
 * por preencher, e conta como vazio: um modelo esquecido não cria um autor
 * chamado «[Nome do autor]».
 */

export type Ficha = {
  titulo?: string;
  slug?: string;
  data?: string;
  autor?: string;
  categoria?: string;
  etiquetas?: string[];
  resumo?: string;
  /** De onde vem a capa: `media:ID` (Word, já na biblioteca) ou um endereço. */
  capa?: string;
};

export type CampoDaFicha = keyof Ficha;

/** Para comparar nomes: sem maiúsculas, sem acentos, sem pontuação nas pontas. */
export function chave(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^[\s:.\-–—*]+|[\s:.\-–—*]+$/g, "");
}

const NOMES: Record<string, CampoDaFicha> = {
  titulo: "titulo",
  title: "titulo",
  slug: "slug",
  endereco: "slug",
  data: "data",
  date: "data",
  "data de publicacao": "data",
  autor: "autor",
  autora: "autor",
  author: "autor",
  categoria: "categoria",
  category: "categoria",
  etiquetas: "etiquetas",
  etiqueta: "etiquetas",
  tags: "etiquetas",
  capa: "capa",
  "imagem de capa": "capa",
  cover: "capa",
  image: "capa",
  resumo: "resumo",
  excerpt: "resumo",
  description: "resumo",
  descricao: "resumo",
};

export const campoDe = (nome: string): CampoDaFicha | undefined => NOMES[chave(nome)];

const porPreencher = (valor: string) => /^\[.*\]$/s.test(valor.trim());

/** Um par campo → valor para dentro da ficha, com as regras de cada campo. */
function poe(ficha: Ficha, nome: string, valor: string) {
  const campo = campoDe(nome);
  const limpo = valor.replace(/[ \t]+/g, " ").trim();
  if (!campo || !limpo || porPreencher(limpo)) return;
  if (campo === "etiquetas") {
    const lista = limpo
      .replace(/^\[|\]$/g, "")
      .split(/[,;\n]/)
      .map((etiqueta) => etiqueta.replace(/^["'#\s]+|["'\s]+$/g, "").trim())
      .filter((etiqueta) => etiqueta && !porPreencher(etiqueta));
    if (lista.length) ficha.etiquetas = [...new Set(lista)];
    return;
  }
  ficha[campo] = campo === "capa" ? limpo : limpo.replace(/\s*\n\s*/g, " ");
}

/** O cabeçalho `---` de um Markdown, com as chaves já em minúsculas. */
export function fichaDoCabecalho(meta: Record<string, string>): Ficha {
  const ficha: Ficha = {};
  for (const [nome, valor] of Object.entries(meta)) poe(ficha, nome, valor);
  return ficha;
}

/** A segunda ganha à primeira, campo a campo. */
export function juntaFichas(base: Ficha, porCima: Ficha): Ficha {
  return { ...base, ...Object.fromEntries(Object.entries(porCima).filter(([, valor]) => valor !== undefined)) };
}

const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

/**
 * Uma data escrita por uma pessoa → `AAAA-MM-DD`. Aceita 28/09/2026,
 * 28-09-2026, 28.09.2026, 2026-09-28 e «28 de setembro de 2026».
 */
export function lerData(texto: string): string | undefined {
  const t = chave(texto);
  let dia: number, mes: number, ano: number;
  let partes = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (partes) [ano, mes, dia] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  else if ((partes = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)))
    [dia, mes, ano] = [Number(partes[1]), Number(partes[2]), Number(partes[3])];
  else if ((partes = t.match(/^(\d{1,2})\s+(?:de\s+)?([a-z]+)\s+(?:de\s+)?(\d{4})$/))) {
    const nome = partes[2]!;
    const indice = [MESES, MONTHS].map((lista) => lista.findIndex((m) => m.startsWith(nome.slice(0, 3)))).find((i) => i >= 0);
    if (indice === undefined) return undefined;
    [dia, mes, ano] = [Number(partes[1]), indice + 1, Number(partes[3])];
  } else return undefined;
  const data = new Date(Date.UTC(ano, mes - 1, dia));
  if (data.getUTCMonth() !== mes - 1 || data.getUTCDate() !== dia || ano < 2000 || ano > 2100) return undefined;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// ── A ficha dentro de um Word (DOM) ─────────────────────────────────────────

type No = { nodeType: number; nodeName: string; textContent: string | null; childNodes: ArrayLike<No> };
type Elemento = No & {
  getAttribute(nome: string): string | null;
  getElementsByTagName(nome: string): ArrayLike<Elemento>;
  remove(): void;
};

const ELEMENTO = 1;
const elementos = (no: No, nomes?: string[]) =>
  Array.from(no.childNodes).filter(
    (filho): filho is Elemento =>
      filho.nodeType === ELEMENTO && (!nomes || nomes.includes(filho.nodeName.toLowerCase())),
  );

/** O texto de uma célula, um parágrafo por linha. */
function textoDaCelula(celula: Elemento) {
  const paragrafos = elementos(celula, ["p", "ul", "ol"]);
  const partes = paragrafos.length
    ? paragrafos.flatMap((p) => (["ul", "ol"].includes(p.nodeName.toLowerCase()) ? elementos(p, ["li"]) : [p]))
    : [celula];
  return partes.map((parte) => (parte.textContent ?? "").trim()).filter(Boolean).join("\n");
}

/**
 * Procura a ficha no corpo de um Word já em HTML, lê-a e tira-a do documento:
 * o título «Ficha técnica», a tabela a seguir (ou as linhas «Campo: valor») e
 * os parágrafos vazios pelo meio. Sem ficha, devolve `null` e não mexe em nada.
 */
export function tiraFicha(corpo: No): Ficha | null {
  const blocos = elementos(corpo);
  const inicio = blocos.findIndex((bloco) => /^ficha tecnica$/.test(chave(bloco.textContent ?? "")));
  if (inicio < 0) return null;

  const ficha: Ficha = {};
  const lidos: Elemento[] = [blocos[inicio]!];
  for (const bloco of blocos.slice(inicio + 1)) {
    const nome = bloco.nodeName.toLowerCase();
    const texto = (bloco.textContent ?? "").trim();
    if (nome === "table") {
      const linhas = elementos(bloco, ["tr", "thead", "tbody"]).flatMap((filho) =>
        filho.nodeName.toLowerCase() === "tr" ? [filho] : elementos(filho, ["tr"]),
      );
      for (const linha of linhas) {
        const [campo, valor] = elementos(linha, ["td", "th"]);
        if (!campo || !valor) continue;
        const qual = campoDe(textoDaCelula(campo));
        if (qual === "capa") {
          const imagem = Array.from(valor.getElementsByTagName("img"))
            .map((img) => img.getAttribute("src") ?? "")
            .find(Boolean);
          if (imagem) ficha.capa = imagem;
          else poe(ficha, "capa", textoDaCelula(valor));
        } else {
          poe(ficha, textoDaCelula(campo), textoDaCelula(valor));
        }
      }
      lidos.push(bloco);
      break;
    }
    const par = texto.match(/^([^:]{2,30}):\s*(.*)$/s);
    if (par && campoDe(par[1]!)) {
      poe(ficha, par[1]!, par[2]!);
      lidos.push(bloco);
    } else if (!texto && !bloco.getElementsByTagName("img").length) {
      lidos.push(bloco);
    } else {
      break;
    }
  }
  for (const bloco of lidos) bloco.remove();
  return ficha;
}
