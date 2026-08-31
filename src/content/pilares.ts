import type { Localized } from "./types";
import { agentesLeads } from "./agentes-leads";

/**
 * As páginas pilar, e o serviço debaixo do qual cada uma vive.
 *
 * Uma página pilar é uma página longa sobre um tema — o texto todo, as
 * perguntas todas — que existe para ser encontrada e citada. Não é um serviço:
 * é um assunto dentro de um serviço. Por isso não entra no menu nem na lista de
 * serviços; entra por uma chamada na página do serviço a que pertence.
 *
 * Este registo é o que liga as duas pontas. A página do serviço lê-o para saber
 * que chamadas mostrar, e o mapa do site lê-o para as incluir. Uma pilar nova é
 * uma entrada aqui e uma rota — não é código espalhado por três ficheiros com
 * um `if` pelo meio.
 */
export type Pilar = {
  /** O slug português do serviço a que pertence. */
  servico: string;
  /** A rota, tal como o next-intl a conhece. */
  rota: "/pre-qualificacao-leads-agentes-ia";
  eyebrow: Localized;
  titulo: Localized;
  resumo: Localized;
  cta: Localized;
};

export const PILARES: Pilar[] = [
  {
    servico: "inteligencia-artificial",
    rota: "/pre-qualificacao-leads-agentes-ia",
    eyebrow: { pt: "Em detalhe", en: "In depth" },
    titulo: agentesLeads.titulo,
    resumo: agentesLeads.abertura.titulo,
    cta: { pt: "Ler o guia", en: "Read the guide" },
  },
];

/** As pilares de um serviço, pelo slug português. */
export const pilaresDoServico = (slug: string) => PILARES.filter((pilar) => pilar.servico === slug);
