import type { Dados, Formulario, Opcao, Origem, Pergunta, Tipo } from "./tipos";

/**
 * Um inquérito como sai da base, passado à forma que as regras leem. Sem nada
 * do servidor: o painel usa-o no browser para mostrar uma resposta.
 */

type Imagem = { url?: string | null; sizes?: Record<string, { url?: string | null } | undefined> | null } | number | null | undefined;

type DocDaOpcao = { chave?: string | null; rotulo?: string | null; imagem?: Imagem };
type DocDaPergunta = Omit<Partial<Pergunta>, "opcoes" | "linhas"> & {
  tipo?: Tipo | null;
  opcoes?: DocDaOpcao[] | null;
  linhas?: { chave?: string | null; rotulo?: string | null }[] | null;
};

export type DocDoInquerito = {
  id: number | string;
  titulo?: string | null;
  estado?: "rascunho" | "aberto" | "fechado" | null;
  lingua?: "pt" | "en" | null;
  chave?: string | null;
  avisar?: string | null;
  typeformId?: string | null;
  abertura?: { titulo?: string | null; texto?: string | null } | null;
  fecho?: { titulo?: string | null; texto?: string | null } | null;
  perguntas?: DocDaPergunta[] | null;
};

export type DocDaResposta = {
  id: number | string;
  inquerito?: number | string | { id: number | string } | null;
  origem?: Origem | null;
  estado?: "incompleta" | "completa" | null;
  link?: number | string | { id: number | string; titulo?: string | null } | null;
  empresa?: string | null;
  nome?: string | null;
  pipedriveId?: number | null;
  dados?: Dados | null;
  iniciadaEm?: string | null;
  concluidaEm?: string | null;
  createdAt?: string;
};

/** O endereço da imagem de uma opção, no tamanho mais pequeno que sirva. */
function urlDaImagem(imagem: Imagem): string | null {
  if (!imagem || typeof imagem !== "object") return null;
  return imagem.sizes?.thumb?.url ?? imagem.url ?? null;
}

/** As perguntas como as regras as leem, sem o que o Payload junta. */
export function perguntasDe(doc: Pick<DocDoInquerito, "perguntas">): Pergunta[] {
  return (doc.perguntas ?? [])
    .filter((pergunta) => pergunta.chave && pergunta.tipo && pergunta.titulo)
    .map((pergunta) => ({
      chave: pergunta.chave as string,
      tipo: pergunta.tipo as Tipo,
      titulo: pergunta.titulo as string,
      descricao: pergunta.descricao ?? null,
      obrigatoria: Boolean(pergunta.obrigatoria),
      varias: Boolean(pergunta.varias),
      maximo: pergunta.maximo ?? null,
      outra: Boolean(pergunta.outra),
      opcoes: (pergunta.opcoes ?? [])
        .filter((opcao) => opcao.chave && opcao.rotulo)
        .map((opcao): Opcao => ({ chave: opcao.chave as string, rotulo: opcao.rotulo as string, imagem: urlDaImagem(opcao.imagem) })),
      linhas: (pergunta.linhas ?? []).filter((linha) => linha.chave && linha.rotulo).map((linha) => ({ chave: linha.chave as string, rotulo: linha.rotulo as string })),
      escalaMin: pergunta.escalaMin ?? null,
      escalaMax: pergunta.escalaMax ?? null,
      rotuloMin: pergunta.rotuloMin ?? null,
      rotuloMeio: pergunta.rotuloMeio ?? null,
      rotuloMax: pergunta.rotuloMax ?? null,
      mostrarSe: pergunta.mostrarSe || null,
      mostrarValor: pergunta.mostrarValor ?? null,
      preencher: pergunta.preencher ?? null,
    }));
}

export function formularioDe(doc: DocDoInquerito): Formulario {
  return {
    id: doc.id,
    titulo: doc.titulo ?? "",
    lingua: doc.lingua === "en" ? "en" : "pt",
    abertura: doc.abertura ?? null,
    fecho: doc.fecho ?? null,
    perguntas: perguntasDe(doc),
  };
}

