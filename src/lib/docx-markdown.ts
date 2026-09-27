/**
 * O HTML que o `mammoth` tira de um .docx → o Markdown que a importação já lê.
 *
 * Porque Markdown, e não uma segunda conversão: o caminho do Markdown para o
 * editor já existe, já trata as imagens e já foi conferido contra o próprio
 * motor do editor (`npm run md:check`). Um Word passa a ser mais uma maneira de
 * chegar a esse caminho, e o artigo sai igual venha de onde vier.
 *
 * O HTML do `mammoth` é pequeno e previsível — títulos, parágrafos, negrito,
 * itálico, ligações, listas, imagens e tabelas — e é só isso que aqui se
 * traduz. O que não tem lugar no editor dos artigos (tabelas) passa a
 * parágrafos, para o texto não se perder.
 *
 * Trabalha sobre nós do DOM e não sobre texto: corre no browser, onde o
 * documento é lido, e num guião com um DOM de ensaio.
 */

/**
 * O que entra no Markdown como texto tem de ficar texto: sem virar formatação.
 *
 * Só se escapam os três que o conversor do editor sabe desfazer — `*`, `_` e
 * `` ` ``. Qualquer outra barra (antes de «#», «-», «[», «1.») ficava no
 * artigo à vista, e isso viu-se no ensaio. Um traço ou um «1.» escritos à mão
 * no início de uma linha passam por isso a lista, que é o que quem os escreveu
 * queria dizer.
 */
function escapa(texto: string) {
  return texto.replace(/([`*_])/g, "\\$1");
}

type No = { nodeType: number; nodeName: string; textContent: string | null; childNodes: ArrayLike<No> };
type Elemento = No & {
  getAttribute(nome: string): string | null;
  getElementsByTagName(nome: string): ArrayLike<Elemento>;
};

const TEXTO = 3;
const ELEMENTO = 1;

/**
 * Negrito e itálico à volta do texto, com os espaços das pontas por fora: o
 * Word deixa muitas vezes o espaço dentro do negrito («**palavra **seguinte»),
 * e em Markdown isso não fecha a marca.
 */
function marca(texto: string, sinal: string) {
  const partes = texto.match(/^(\s*)([\s\S]*?)(\s*)$/)!;
  return partes[2] ? `${partes[1]}${sinal}${partes[2]}${sinal}${partes[3]}` : texto;
}

/** O conteúdo de uma linha: texto, negrito, itálico, ligações, quebras. */
function emLinha(no: No): string {
  if (no.nodeType === TEXTO) return escapa((no.textContent ?? "").replace(/\s+/g, " "));
  if (no.nodeType !== ELEMENTO) return "";
  const el = no as Elemento;
  const dentro = () => Array.from(el.childNodes).map(emLinha).join("");
  switch (el.nodeName.toLowerCase()) {
    case "strong":
    case "b":
      return marca(dentro(), "**");
    case "em":
    case "i":
      // Com asterisco e não com «_»: o sublinhado não abre itálico a meio de
      // uma palavra, e o asterisco abre.
      return marca(dentro(), "*");
    case "a": {
      const href = el.getAttribute("href") ?? "";
      const t = dentro();
      // As âncoras internas do Word (índices, notas) não levam a lado nenhum no site.
      return href && !href.startsWith("#") ? `[${t}](${href})` : t;
    }
    case "br":
      return "  \n";
    case "img":
      // Imagem no meio de uma frase: sai para um parágrafo seu, como o
      // importador de Markdown quer. Sem endereço — a que não subiu — sai do
      // texto, e o aviso vai no resumo.
      return el.getAttribute("src") ? `\n\n${imagem(el)}\n\n` : "";
    default:
      return dentro();
  }
}

function imagem(el: Elemento) {
  const alt = (el.getAttribute("alt") ?? "").replace(/[[\]\n]/g, " ").trim();
  return `![${alt}](${el.getAttribute("src") ?? ""})`;
}

/** Uma lista, com as de dentro recuadas. */
function lista(el: Elemento, nivel: number): string {
  const ordenada = el.nodeName.toLowerCase() === "ol";
  let n = 0;
  return Array.from(el.childNodes)
    .filter((filho) => filho.nodeType === ELEMENTO && filho.nodeName.toLowerCase() === "li")
    .map((item) => {
      n += 1;
      const marca = ordenada ? `${n}.` : "-";
      const recuo = "   ".repeat(nivel);
      const texto = Array.from(item.childNodes)
        .filter((filho) => !["ul", "ol"].includes(filho.nodeName.toLowerCase()))
        .map(emLinha)
        .join("")
        .trim();
      const dentro = Array.from(item.childNodes)
        .filter((filho) => ["ul", "ol"].includes(filho.nodeName.toLowerCase()))
        .map((sub) => lista(sub as Elemento, nivel + 1))
        .join("\n");
      return `${recuo}${marca} ${texto}${dentro ? `\n${dentro}` : ""}`;
    })
    .join("\n");
}

/** Um bloco: título, parágrafo, lista, tabela. */
function bloco(no: No): string {
  if (no.nodeType === TEXTO) return (no.textContent ?? "").trim() ? emLinha(no).trim() : "";
  if (no.nodeType !== ELEMENTO) return "";
  const el = no as Elemento;
  const nome = el.nodeName.toLowerCase();
  // Dois pedaços de texto seguidos deixam às vezes dois espaços; as quebras de
  // linha («  \n») é que os levam de propósito.
  const linha = () =>
    Array.from(el.childNodes)
      .map(emLinha)
      .join("")
      .split("  \n")
      .map((parte) => parte.replace(/ {2,}/g, " "))
      .join("  \n")
      .trim();

  if (/^h[1-6]$/.test(nome)) {
    const texto = linha();
    if (!texto) return "";
    // Os artigos têm dois níveis de título: o Título 1 do Word é o grande, e
    // daí para baixo é o pequeno. O «#» fica para o título do próprio
    // documento, que é tratado à parte.
    const nivel = Math.min(Number(nome[1]) + 1, 3);
    return `${"#".repeat(nivel)} ${texto}`;
  }
  if (nome === "ul" || nome === "ol") return lista(el, 0);
  if (nome === "table") {
    // Sem tabelas no editor: cada linha da tabela é um parágrafo, com as
    // células separadas por « · ».
    return Array.from(el.getElementsByTagName("tr"))
      .map((tr) =>
        Array.from(tr.getElementsByTagName("td"))
          .map((td) => Array.from(td.childNodes).map(emLinha).join(" ").replace(/\s+/g, " ").trim())
          .filter(Boolean)
          .join(" · "),
      )
      .filter(Boolean)
      .join("\n\n");
  }
  if (nome === "p" || nome === "div") return linha();
  return Array.from(el.childNodes).map(bloco).filter(Boolean).join("\n\n");
}

/**
 * O documento inteiro. O primeiro parágrafo com o estilo «Título» do Word vem
 * como `<h1 class="titulo">` (ver `MAPA_DE_ESTILOS`, mais abaixo) e sai do
 * corpo: vai para o cabeçalho do Markdown, que o importador mostra sem o
 * escrever em campo nenhum — como faz com o `title:` de um .md.
 */
export function htmlParaMarkdown(corpo: No & { querySelector?(s: string): Elemento | null }): string {
  let titulo = "";
  const tituloEl = corpo.querySelector?.("h1.titulo");
  if (tituloEl) {
    titulo = (tituloEl.textContent ?? "").replace(/\s+/g, " ").trim();
    (tituloEl as unknown as { remove(): void }).remove();
  }
  const texto = Array.from(corpo.childNodes).map(bloco).filter(Boolean).join("\n\n");
  const cabecalho = titulo ? `---\ntitle: ${JSON.stringify(titulo)}\n---\n\n` : "";
  return `${cabecalho}${texto.replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

/**
 * O mapa de estilos do Word para o `mammoth`. Os nomes em inglês são os que o
 * Word grava por dentro em qualquer língua, e os portugueses cobrem os
 * documentos com estilos criados à mão. O «Título» do documento vira
 * `h1.titulo`, que `htmlParaMarkdown` tira do corpo.
 */
export const MAPA_DE_ESTILOS = [
  "p[style-name='Title'] => h1.titulo:fresh",
  "p[style-name='Título'] => h1.titulo:fresh",
  "p[style-name='Subtitle'] => p:fresh",
  "p[style-name='Subtítulo'] => p:fresh",
  "p[style-name='Título 1'] => h1:fresh",
  "p[style-name='Título 2'] => h2:fresh",
  "p[style-name='Título 3'] => h3:fresh",
];
