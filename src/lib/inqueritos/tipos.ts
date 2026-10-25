/**
 * A forma de um inquérito e das respostas, partilhada pela página de
 * preenchimento (no browser), pelas rotas que gravam e pelo painel.
 *
 * Cada pergunta, opção e linha tem uma `chave` que não muda: é por ela que as
 * respostas se ligam às perguntas. O texto pode ser corrigido no painel sem
 * mexer no que já foi respondido. As perguntas que vieram do Typeform ficam
 * com a referência de lá como chave — é assim que as respostas importadas
 * encontram a pergunta certa.
 */

export const TIPOS = [
  { value: "escolha", label: "Escolha (uma ou várias)" },
  { value: "escala", label: "Escala" },
  { value: "nps", label: "NPS (0 a 10)" },
  { value: "sim-nao", label: "Sim ou não" },
  { value: "texto-curto", label: "Texto curto" },
  { value: "texto-longo", label: "Texto longo" },
  { value: "grelha", label: "Grelha (várias linhas, as mesmas opções)" },
  { value: "campos", label: "Campos curtos (nome, cargo, empresa…)" },
] as const;

export type Tipo = (typeof TIPOS)[number]["value"];

/** O que o link pessoal sabe e pode preencher por quem responde. */
export const PREENCHIMENTOS = [
  { value: "empresa", label: "Empresa do link pessoal" },
  { value: "nome", label: "Nome do link pessoal" },
] as const;
export type Preenchimento = (typeof PREENCHIMENTOS)[number]["value"];

export type Opcao = { chave: string; rotulo: string; imagem?: string | null };
export type Linha = { chave: string; rotulo: string };

export type Pergunta = {
  chave: string;
  tipo: Tipo;
  titulo: string;
  descricao?: string | null;
  obrigatoria?: boolean | null;
  /** Escolha: pode escolher várias, até quantas, e se há «Outra». */
  varias?: boolean | null;
  maximo?: number | null;
  outra?: boolean | null;
  opcoes?: Opcao[];
  /** Grelha: as linhas. Campos: os campos. */
  linhas?: Linha[];
  /** Escala e NPS. */
  escalaMin?: number | null;
  escalaMax?: number | null;
  rotuloMin?: string | null;
  rotuloMeio?: string | null;
  rotuloMax?: string | null;
  /** Só aparece se a pergunta `mostrarSe` tiver a resposta `mostrarValor`. */
  mostrarSe?: string | null;
  mostrarValor?: string | null;
  preencher?: Preenchimento | null;
};

/** O inquérito como a página de preenchimento o recebe. */
export type Formulario = {
  id: number | string;
  titulo: string;
  lingua: "pt" | "en";
  abertura?: { titulo?: string | null; texto?: string | null } | null;
  fecho?: { titulo?: string | null; texto?: string | null } | null;
  perguntas: Pergunta[];
};

/**
 * O valor de uma resposta, por tipo:
 *   escolha       { opcoes: [chave…], outra?: texto }
 *   escala, nps   número
 *   sim-nao       true | false
 *   texto-*       texto
 *   grelha        { [chave da linha]: chave da opção }
 *   campos        { [chave do campo]: texto }
 */
export type Valor =
  | { opcoes: string[]; outra?: string }
  | number
  | boolean
  | string
  | Record<string, string>;

/**
 * O que fica gravado numa resposta.
 *
 * `escalas` guarda os limites da escala no momento em que se respondeu: a
 * clareza e a proposta eram de 0 a 9 no Typeform e passaram a 0 a 10, e uma
 * média que misturasse as duas não dizia nada. `rotulos` guarda o texto das
 * perguntas e opções usadas, para uma resposta antiga continuar legível se
 * uma opção for apagada.
 */
export type Dados = {
  valores: Record<string, Valor>;
  escalas?: Record<string, [number, number]>;
  rotulos?: Record<string, string>;
};

export const ORIGENS = [
  { value: "geral", label: "Link geral" },
  { value: "pessoal", label: "Link pessoal" },
  { value: "equipa", label: "Equipa" },
  { value: "typeform", label: "Typeform" },
] as const;
export type Origem = (typeof ORIGENS)[number]["value"];
