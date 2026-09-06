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

export type PaginaDeServico<Area extends string = string> = {
  /** Endereço em cada língua. */
  slug: { pt: string; en: string };
  area: Area;
  /**
   * Um vídeo para o topo, quando o serviço tem imagem própria. Sem ele a página
   * abre em tinta, como as irmãs; com ele abre em cheio, como a página-mãe.
   */
  topo?: { video: string; poster: { src: string; width: number; height: number } };
  nome: Localized;
  titulo: Localized;
  claim: Localized;
  descricao: Localized;
  abertura: { titulo: Localized; problema: Localized[]; abordagem: Localized[] };
  fazemos: { titulo: Localized; itens: Passo[] };
  formatos?: { titulo: Localized; nota: Localized; itens: Formato[] };
  passos: { titulo: Localized; itens: Passo[] };
  faq: Pergunta[];
  fecho: { titulo: Localized; texto: Localized };
};

/** Um serviço pelo seu endereço, em qualquer das duas línguas. */
export function servicoPorSlug<S extends PaginaDeServico>(lista: S[], slug: string): S | undefined {
  return lista.find((s) => s.slug.pt === slug || s.slug.en === slug);
}

/** Os outros serviços da mesma área. */
export function irmaosDe<S extends PaginaDeServico>(lista: S[], servico: S): S[] {
  return lista.filter((s) => s.area === servico.area && s.slug.pt !== servico.slug.pt);
}
