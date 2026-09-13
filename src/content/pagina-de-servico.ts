import type { routing } from "@/i18n/routing";
import type { Localized } from "./types";

/**
 * O esqueleto de uma página de serviço dentro de uma área.
 *
 * Marketing e Tecnologia têm cada uma a sua página-mãe e, debaixo dela, uma
 * página por serviço. As páginas são todas da mesma família — abertura em duas
 * colunas, o que fazemos, os formatos quando existem, como trabalhamos,
 * perguntas, fecho — e a família lê-se pela repetição. O que muda é o texto.
 *
 * Este é o tipo que as duas famílias partilham; a área de cada uma é o
 * parâmetro. O componente `PaginaDeServico` desenha qualquer entrada disto.
 */
export type Passo = { nome: Localized; corpo: Localized };
export type Pergunta = { pergunta: Localized; resposta: Localized };
export type Formato = { nome: Localized; ideal: Localized; itens: Localized[] };

/**
 * Um fluxo contado em capítulos, com um palco fixo ao lado que se transforma
 * com o scroll. Só faz sentido quando o serviço tem um processo com princípio,
 * meio e fim que o cliente precisa de ver para acreditar — a análise de
 * carteira com a Informa D&B é o primeiro. Os rótulos são o texto que entra no
 * desenho, e por isso também têm as duas línguas.
 */
export type Fluxo = {
  desenho: "informa";
  eyebrow: Localized;
  titulo: Localized;
  nota: Localized;
  capitulos: { nome: Localized; texto: Localized }[];
  rotulos: Record<string, Localized>;
};

export type PaginaDeServico<Area extends string = string> = {
  /** Endereço em cada língua. */
  slug: { pt: string; en: string };
  area: Area;
  /**
   * Um vídeo para o topo, quando o serviço tem imagem própria. Sem ele a página
   * abre em tinta, como as irmãs; com ele abre em cheio, como a página-mãe.
   */
  topo?: {
    video: string;
    /** A mesma imagem em VP9, mais leve; o browser que a souber ler prefere-a. */
    webm?: string;
    poster: { src: string; width: number; height: number };
  };
  nome: Localized;
  titulo: Localized;
  claim: Localized;
  descricao: Localized;
  abertura: { titulo: Localized; problema: Localized[]; abordagem: Localized[] };
  fazemos: { titulo: Localized; itens: Passo[] };
  fluxo?: Fluxo;
  formatos?: { titulo: Localized; nota: Localized; itens: Formato[] };
  passos: { titulo: Localized; itens: Passo[] };
  faq: Pergunta[];
  fecho: { titulo: Localized; texto: Localized };
  /**
   * Um remate que aponta para outra página da casa.
   *
   * Há serviços que continuam noutro sítio: um site publicado continua no
   * JellyCARE. Dizê-lo só na lista do que fazemos e numa pergunta lá em baixo
   * é dizê-lo a quem já estava a ler com atenção; este bloco é para quem
   * chegou ao fim da página a decidir o passo seguinte.
   *
   * `endereco` é uma rota do `routing.ts`, e não um link solto: o `Link`
   * traduzido trata do resto.
   */
  remate?: {
    eyebrow: Localized;
    titulo: Localized;
    texto: Localized;
    cta: Localized;
    /** Uma rota sem parâmetros do `routing.ts` — as com `[slug]` precisavam de mais do que um endereço. */
    endereco: Exclude<keyof typeof routing.pathnames, `${string}[${string}`>;
  };
  /**
   * Uma nota sobre um parceiro, no fim da página. É a apresentação do
   * parceiro pelas suas palavras — a Informa D&B na Lead Generation B2B — e
   * por isso entra tal e qual, sem a voz da casa por cima.
   */
  parceiro?: { eyebrow: Localized; texto: Localized };
};

/** Um serviço pelo seu endereço, em qualquer das duas línguas. */
export function servicoPorSlug<S extends PaginaDeServico>(lista: S[], slug: string): S | undefined {
  return lista.find((s) => s.slug.pt === slug || s.slug.en === slug);
}

/** Os outros serviços da mesma área. */
export function irmaosDe<S extends PaginaDeServico>(lista: S[], servico: S): S[] {
  return lista.filter((s) => s.area === servico.area && s.slug.pt !== servico.slug.pt);
}
