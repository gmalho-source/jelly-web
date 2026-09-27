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
 * traduz.
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

const filhos = (el: No, nomes: string[]) =>
  Array.from(el.childNodes).filter(
    (filho): filho is Elemento => filho.nodeType === ELEMENTO && nomes.includes(filho.nodeName.toLowerCase()),
  );

/**
 * Uma tabela do Word em Markdown de tabela (`| a | b |`), que o editor lê como
 * tabela.
 *
 * O cabeçalho é a primeira linha quando o Word a marca como tal («Repetir como
 * linha de cabeçalho», que o `mammoth` entrega em `<th>`) ou quando está toda a
 * negrito, que é como quase toda a gente faz um cabeçalho à mão.
 *
 * O editor não funde células. Uma célula que ocupa duas colunas fica na
 * primeira e deixa a outra vazia, e o mesmo para as linhas: assim as colunas
 * não escorregam, e o texto fica onde estava. Uma imagem dentro de uma célula
 * não cabe numa linha de Markdown — sai para depois da tabela. Um «|» no texto
 * partia a célula, e troca-se pelo traço vertical de aspeto igual.
 */
function tabela(el: Elemento): string {
  const linhas = filhos(el, ["tr", "thead", "tbody", "tfoot"]).flatMap((filho) =>
    filho.nodeName.toLowerCase() === "tr" ? [filho] : filhos(filho, ["tr"]),
  );
  const imagens: string[] = [];
  const grelha: { texto: string; th: boolean; negrito: boolean }[][] = [];
  // As colunas ainda ocupadas por uma célula de uma linha de cima.
  const ocupadas: number[] = [];

  linhas.forEach((tr, r) => {
    const linha: (typeof grelha)[number] = (grelha[r] ??= []);
    let coluna = 0;
    const salta = () => {
      while ((ocupadas[coluna] ?? 0) > r) {
        linha[coluna] = { texto: "", th: false, negrito: false };
        coluna += 1;
      }
    };
    for (const celula of filhos(tr, ["td", "th"])) {
      salta();
      const partes = Array.from(celula.childNodes).map(emLinha).join(" ");
      const texto = partes
        .replace(/!\[[^\]]*\]\([^)]*\)/g, (imagem) => {
          imagens.push(imagem);
          return " ";
        })
        .replace(/\|/g, "∣")
        .replace(/\s+/g, " ")
        .trim();
      const negrito = /^\*\*[^*]+\*\*$/.test(texto);
      const colunas = Math.max(1, Number(celula.getAttribute("colspan")) || 1);
      const filas = Math.max(1, Number(celula.getAttribute("rowspan")) || 1);
      for (let i = 0; i < colunas; i += 1) {
        linha[coluna] = i ? { texto: "", th: false, negrito: false } : { texto, th: celula.nodeName.toLowerCase() === "th", negrito };
        if (filas > 1) ocupadas[coluna] = r + filas;
        coluna += 1;
      }
    }
    salta();
  });

  const largura = Math.max(0, ...grelha.map((linha) => linha.length));
  if (!largura || !grelha.some((linha) => linha.some((c) => c?.texto))) return imagens.join("\n\n");

  const primeira = grelha[0]!;
  const comTexto = primeira.filter((c) => c?.texto);
  const temCabecalho =
    grelha.length > 1 && comTexto.length > 0 && comTexto.every((c) => c.th || c.negrito);

  const escreve = (linha: (typeof grelha)[number], cabecalho: boolean) =>
    "| " +
    Array.from({ length: largura }, (_, c) => {
      const texto = linha[c]?.texto ?? "";
      // O cabeçalho já é negrito no site: a marca do Word não se repete.
      return cabecalho ? texto.replace(/^\*\*([^*]+)\*\*$/, "$1") : texto;
    }).join(" | ") +
    " |";

  const markdown = grelha.map((linha, r) => {
    const escrita = escreve(linha, temCabecalho && r === 0);
    return temCabecalho && r === 0 ? `${escrita}\n| ${Array(largura).fill("---").join(" | ")} |` : escrita;
  });
  return [markdown.join("\n"), ...imagens].join("\n\n");
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
  if (nome === "table") return tabela(el);
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
