import type { Dados, Pergunta, Valor } from "./tipos";

/**
 * As regras de um inquérito, as mesmas no browser e no servidor: que
 * perguntas aparecem, quando uma está respondida, o que é um valor válido e
 * como se lê uma resposta em texto.
 *
 * O browser aplica-as para quem responde não ter de esperar pelo servidor; o
 * servidor aplica-as outra vez porque um pedido pode chegar sem o browser.
 */

/** Os limites de uma escala. O NPS é sempre de 0 a 10. */
export function limites(pergunta: Pergunta): [number, number] {
  if (pergunta.tipo === "nps") return [0, 10];
  const min = Number.isFinite(pergunta.escalaMin) ? Number(pergunta.escalaMin) : 0;
  const max = Number.isFinite(pergunta.escalaMax) ? Number(pergunta.escalaMax) : 10;
  return [Math.min(min, max), Math.max(min, max)];
}

/** Se a pergunta aparece, dadas as respostas até aqui. */
export function aparece(pergunta: Pergunta, valores: Record<string, Valor>): boolean {
  if (!pergunta.mostrarSe) return true;
  const valor = valores[pergunta.mostrarSe];
  const esperado = pergunta.mostrarValor ?? "";
  if (valor === undefined || valor === null) return false;
  if (typeof valor === "boolean") return (valor ? "sim" : "nao") === esperado;
  if (typeof valor === "object" && "opcoes" in valor && Array.isArray(valor.opcoes)) return valor.opcoes.includes(esperado);
  return String(valor) === esperado;
}

/**
 * As perguntas que esta pessoa vê, por ordem.
 *
 * Uma pergunta cuja condição depende de outra que não aparece também não
 * aparece: a pergunta escondida não tem resposta, e a condição falha sozinha.
 * As que o link pessoal preenche ficam de fora — já se sabe a resposta.
 */
export function visiveis(perguntas: Pergunta[], valores: Record<string, Valor>, preenchidas: Set<string> = new Set()): Pergunta[] {
  return perguntas.filter((pergunta) => !preenchidas.has(pergunta.chave) && aparece(pergunta, valores));
}

/** Se há resposta, seja ela qual for. */
export function respondida(pergunta: Pergunta, valor: Valor | undefined): boolean {
  if (valor === undefined || valor === null) return false;
  switch (pergunta.tipo) {
    case "escolha": {
      const escolha = valor as { opcoes?: string[]; outra?: string };
      return (escolha.opcoes?.length ?? 0) > 0 || Boolean(escolha.outra?.trim());
    }
    case "escala":
    case "nps":
      return typeof valor === "number";
    case "sim-nao":
      return typeof valor === "boolean";
    case "texto-curto":
    case "texto-longo":
      return typeof valor === "string" && valor.trim().length > 0;
    case "grelha":
    case "campos":
      return typeof valor === "object" && Object.values(valor as Record<string, string>).some((parte) => String(parte ?? "").trim());
  }
}

const AVISOS = {
  pt: {
    obrigatoria: "Esta pergunta precisa de resposta.",
    linhas: "Responda a todas as linhas.",
    maximo: (n: number) => `Escolha no máximo ${n}.`,
  },
  en: {
    obrigatoria: "This question needs an answer.",
    linhas: "Please answer every row.",
    maximo: (n: number) => `Choose up to ${n}.`,
  },
};

/** O que impede de avançar, ou nada. */
export function erroDe(pergunta: Pergunta, valor: Valor | undefined, lingua: "pt" | "en" = "pt"): string | null {
  const avisos = AVISOS[lingua];
  if (pergunta.tipo === "escolha" && pergunta.varias && pergunta.maximo && valor && typeof valor === "object" && "opcoes" in valor) {
    const total = valor.opcoes.length + (valor.outra?.trim() ? 1 : 0);
    if (total > pergunta.maximo) return avisos.maximo(pergunta.maximo);
  }
  if (!pergunta.obrigatoria) return null;
  if (!respondida(pergunta, valor)) return avisos.obrigatoria;
  // Numa grelha obrigatória, cada linha conta.
  if (pergunta.tipo === "grelha") {
    const linhas = pergunta.linhas ?? [];
    const dado = (valor ?? {}) as Record<string, string>;
    if (linhas.some((linha) => !dado[linha.chave])) return avisos.linhas;
  }
  return null;
}

const corta = (valor: unknown, limite: number) => String(valor ?? "").replace(/\u0000/g, "").trim().slice(0, limite);

/**
 * O valor que chegou de fora, arrumado à medida da pergunta — ou nada, se não
 * servir. Uma opção que não existe, um número fora da escala, um texto do
 * tamanho de um livro: nada disso entra.
 */
export function limpa(pergunta: Pergunta, bruto: unknown): Valor | undefined {
  if (bruto === undefined || bruto === null) return undefined;
  switch (pergunta.tipo) {
    case "escolha": {
      if (typeof bruto !== "object") return undefined;
      const { opcoes, outra } = bruto as { opcoes?: unknown; outra?: unknown };
      const validas = new Set((pergunta.opcoes ?? []).map((opcao) => opcao.chave));
      const escolhidas = [...new Set(Array.isArray(opcoes) ? opcoes.map(String).filter((chave) => validas.has(chave)) : [])];
      const final = pergunta.varias ? escolhidas : escolhidas.slice(0, 1);
      const texto = pergunta.outra ? corta(outra, 300) : "";
      if (!final.length && !texto) return undefined;
      return texto ? { opcoes: pergunta.varias ? final : [], outra: texto } : { opcoes: final };
    }
    case "escala":
    case "nps": {
      const numero = Number(bruto);
      const [min, max] = limites(pergunta);
      return Number.isInteger(numero) && numero >= min && numero <= max ? numero : undefined;
    }
    case "sim-nao":
      return typeof bruto === "boolean" ? bruto : undefined;
    case "texto-curto":
      return corta(bruto, 300) || undefined;
    case "texto-longo":
      return corta(bruto, 5000) || undefined;
    case "grelha": {
      if (typeof bruto !== "object") return undefined;
      const linhas = new Set((pergunta.linhas ?? []).map((linha) => linha.chave));
      const opcoes = new Set((pergunta.opcoes ?? []).map((opcao) => opcao.chave));
      const saida: Record<string, string> = {};
      for (const [linha, opcao] of Object.entries(bruto as Record<string, unknown>)) {
        if (linhas.has(linha) && opcoes.has(String(opcao))) saida[linha] = String(opcao);
      }
      return Object.keys(saida).length ? saida : undefined;
    }
    case "campos": {
      if (typeof bruto !== "object") return undefined;
      const linhas = new Set((pergunta.linhas ?? []).map((linha) => linha.chave));
      const saida: Record<string, string> = {};
      for (const [linha, texto] of Object.entries(bruto as Record<string, unknown>)) {
        const limpo = corta(texto, 200);
        if (linhas.has(linha) && limpo) saida[linha] = limpo;
      }
      return Object.keys(saida).length ? saida : undefined;
    }
  }
}

/**
 * Os dados de uma resposta, inteiros e arrumados: só perguntas que existem e
 * que aparecem, com os limites das escalas e os textos do momento.
 */
export function dadosLimpos(perguntas: Pergunta[], brutos: Record<string, unknown>): Dados {
  const valores: Record<string, Valor> = {};
  for (const pergunta of perguntas) {
    const valor = limpa(pergunta, brutos[pergunta.chave]);
    if (valor !== undefined) valores[pergunta.chave] = valor;
  }
  // As que ficaram escondidas pelas respostas dadas saem: uma resposta a uma
  // pergunta que já não aparece é um resto de quem voltou atrás e mudou.
  for (const pergunta of perguntas) if (!aparece(pergunta, valores)) delete valores[pergunta.chave];
  return { valores, escalas: escalasDe(perguntas, valores), rotulos: rotulosDe(perguntas, valores) };
}

export function escalasDe(perguntas: Pergunta[], valores: Record<string, Valor>): Record<string, [number, number]> {
  const escalas: Record<string, [number, number]> = {};
  for (const pergunta of perguntas) {
    if ((pergunta.tipo === "escala" || pergunta.tipo === "nps") && valores[pergunta.chave] !== undefined) escalas[pergunta.chave] = limites(pergunta);
  }
  return escalas;
}

/** O texto das perguntas, opções e linhas que a resposta usa. */
export function rotulosDe(perguntas: Pergunta[], valores: Record<string, Valor>): Record<string, string> {
  const rotulos: Record<string, string> = {};
  for (const pergunta of perguntas) {
    if (valores[pergunta.chave] === undefined) continue;
    rotulos[pergunta.chave] = pergunta.titulo;
    for (const opcao of pergunta.opcoes ?? []) rotulos[opcao.chave] = opcao.rotulo;
    for (const linha of pergunta.linhas ?? []) rotulos[linha.chave] = linha.rotulo;
  }
  return rotulos;
}

/** O texto de uma opção, de uma linha ou de uma pergunta, pela chave. */
export function rotulo(chave: string, pergunta: Pergunta | undefined, rotulos?: Record<string, string>): string {
  const viva = pergunta?.opcoes?.find((opcao) => opcao.chave === chave) ?? pergunta?.linhas?.find((linha) => linha.chave === chave);
  return viva?.rotulo ?? rotulos?.[chave] ?? chave;
}

/** Uma resposta em texto corrido, para a tabela, o CSV e os avisos. */
export function emTexto(pergunta: Pergunta, valor: Valor | undefined, dados?: Pick<Dados, "escalas" | "rotulos">): string {
  if (valor === undefined || valor === null) return "";
  switch (pergunta.tipo) {
    case "escolha": {
      const escolha = valor as { opcoes?: string[]; outra?: string };
      const partes = (escolha.opcoes ?? []).map((chave) => rotulo(chave, pergunta, dados?.rotulos));
      if (escolha.outra) partes.push(escolha.outra);
      return partes.join("; ");
    }
    case "escala":
    case "nps": {
      const escala = dados?.escalas?.[pergunta.chave];
      const [min, max] = limites(pergunta);
      // Uma resposta dada numa escala que entretanto mudou leva a escala dela.
      return escala && (escala[0] !== min || escala[1] !== max) ? `${valor} (de ${escala[0]} a ${escala[1]})` : String(valor);
    }
    case "sim-nao":
      return valor ? "Sim" : "Não";
    case "texto-curto":
    case "texto-longo":
      return String(valor);
    case "grelha":
    case "campos": {
      const mapa = valor as Record<string, string>;
      // Pela ordem das linhas do inquérito, e não pela ordem em que foram respondidas.
      const ordem = (pergunta.linhas ?? []).map((linha) => linha.chave);
      const posicao = (chave: string) => (ordem.includes(chave) ? ordem.indexOf(chave) : ordem.length);
      return Object.entries(mapa)
        .sort(([a], [b]) => posicao(a) - posicao(b))
        .map(([linha, resposta]) =>
          `${rotulo(linha, pergunta, dados?.rotulos)}: ${pergunta.tipo === "grelha" ? rotulo(resposta, pergunta, dados?.rotulos) : resposta}`,
        )
        .join("; ");
    }
  }
}

/**
 * O texto sem a marcação que veio do Typeform: negrito com asteriscos
 * («Ponto *Forte*», «**{{field:…}}**») e itálico com sublinhados
 * («Geração de _leads_», «marca_._»).
 */
export const semMarcas = (texto: string) =>
  texto
    .replace(/\*+/g, "")
    .replace(/_([^_\n]*)_/g, "$1")
    .replace(/[ \t]+([.,!?;:])/g, "$1");

/**
 * As respostas anteriores dentro do texto de uma pergunta.
 *
 * O Typeform deixa escrever «Obrigado {{field:…}}. Qual é o seu e-mail?», e
 * no lugar da referência entra o que a pessoa respondeu nessa pergunta. As
 * perguntas trazidas de lá trazem as referências, e é aqui que se trocam. Uma
 * referência ainda sem resposta desaparece, e o espaço que sobra com ela.
 */
const REFERENCIA = /\{\{\s*(field|hidden|var):([^}\s]+)\s*\}\}/g;

export function comRespostas(texto: string, perguntas: Pergunta[], valores: Record<string, Valor>, dados?: Pick<Dados, "escalas" | "rotulos">): string {
  if (!texto.includes("{{")) return texto;
  return texto
    .replace(REFERENCIA, (_, tipo: string, chave: string) => {
      if (tipo !== "field") return "";
      const pergunta = perguntas.find((p) => p.chave === chave);
      return pergunta ? emTexto(pergunta, valores[chave], dados) : "";
    })
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([.,!?;:])/g, "$1")
    .trim();
}

/** No painel, a referência diz de que pergunta vem: «Obrigado [resposta 1]». */
export function paraPainel(texto: string, perguntas: Pergunta[]): string {
  if (!texto.includes("{{")) return texto;
  return texto.replace(REFERENCIA, (_, tipo: string, chave: string) => {
    const indice = tipo === "field" ? perguntas.findIndex((p) => p.chave === chave) : -1;
    return indice >= 0 ? `[resposta ${indice + 1}]` : "[…]";
  });
}

/** As perguntas com as referências escritas para o painel: tabela, resultados, CSV. */
export function legiveis(perguntas: Pergunta[]): Pergunta[] {
  return perguntas.map((pergunta) => ({
    ...pergunta,
    titulo: paraPainel(pergunta.titulo, perguntas),
    descricao: pergunta.descricao ? paraPainel(pergunta.descricao, perguntas) : pergunta.descricao,
  }));
}

/**
 * A empresa e o nome de quem respondeu, quando as respostas os dizem: pelas
 * perguntas marcadas para o link pessoal, ou pelos campos chamados Empresa e
 * Nome. Servem para a resposta ter um título no painel.
 */
export function identidade(perguntas: Pergunta[], valores: Record<string, Valor>): { empresa: string; nome: string } {
  let empresa = "";
  let nome = "";
  for (const pergunta of perguntas) {
    const valor = valores[pergunta.chave];
    if (valor === undefined) continue;
    if (typeof valor === "string") {
      if (pergunta.preencher === "empresa" && !empresa) empresa = valor;
      if (pergunta.preencher === "nome" && !nome) nome = valor;
    }
    if (pergunta.tipo === "campos" && typeof valor === "object") {
      for (const linha of pergunta.linhas ?? []) {
        const texto = (valor as Record<string, string>)[linha.chave];
        if (!texto) continue;
        if (!empresa && /empresa|company/i.test(linha.rotulo)) empresa = texto;
        else if (!nome && /^(o seu )?nome|^name|your name/i.test(linha.rotulo)) nome = texto;
      }
    }
  }
  return { empresa: empresa.slice(0, 160), nome: nome.slice(0, 160) };
}
