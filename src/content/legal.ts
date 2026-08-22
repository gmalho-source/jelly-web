import migrado from "@/content/generated/legal.json";

import type { Block } from "@/content/types";

type Migrado = Record<string, { titulo: string; atualizado: string; blocos: Block[] }>;
const antigo = migrado as Migrado;

export type LegalPage = {
  slug: string;
  title: { pt: string; en: string };
  lead: { pt: string; en: string };
  /** Data da última revisão, mostrada ao leitor: uma política sem data não vale nada. */
  updated: string;
  blocks: { pt: Block[]; en: Block[] };
  /**
   * Endereço da política na Iubenda, um por língua. Quando existe, é ela que a
   * página mostra: o texto é gerado e mantido lá, e ter duas versões da mesma
   * política — uma nossa e uma deles — era pedir para elas discordarem uma da
   * outra. As duas línguas têm políticas separadas lá, com ids diferentes.
   */
  iubenda?: { pt: string; en: string };
};

/** Nota que abre as páginas cujo texto só existe em português. */
const soPortugues: Block[] = [
  {
    type: "p",
    text: "This policy refers to Portuguese law and is published in Portuguese only. The Portuguese text below prevails; write to hello@jelly.pt if you need help reading it.",
  },
];

/**
 * As páginas legais. O texto da RAL e da política de utilização responsável vem
 * do site antigo sem uma palavra mudada — tem valor jurídico e não é matéria
 * para reescrever. A privacidade e os cookies vêm da Iubenda, que é onde a casa
 * as mantém: a página traz o texto de lá em vez de guardar uma segunda versão
 * aqui.
 */
export const legalPages: LegalPage[] = [
  {
    slug: "politica-de-privacidade",
    title: { pt: "Política de Privacidade", en: "Privacy Policy" },
    lead: {
      pt: "Que dados este site recolhe, para quê, quem os trata e como os pode apagar.",
      en: "What this site collects, what for, who processes it and how to have it deleted.",
    },
    updated: "2026-08-22",
    iubenda: {
      pt: "https://www.iubenda.com/privacy-policy/36055654",
      en: "https://www.iubenda.com/privacy-policy/25966282",
    },
    blocks: { pt: [], en: [] },
  },
  {
    slug: "politica-de-cookies",
    title: { pt: "Política de Cookies", en: "Cookie Policy" },
    lead: {
      pt: "Que cookies este site usa, para quê, e como os pode recusar.",
      en: "Which cookies this site uses, what for, and how to refuse them.",
    },
    updated: "2026-08-22",
    iubenda: {
      pt: "https://www.iubenda.com/privacy-policy/36055654/cookie-policy",
      en: "https://www.iubenda.com/privacy-policy/25966282/cookie-policy",
    },
    blocks: { pt: [], en: [] },
  },
  {
    slug: "resolucao-de-litigios",
    title: {
      pt: antigo["entidades-resolucao-alternativa-litigios"]?.titulo ?? "Resolução Alternativa de Litígios",
      en: "Alternative Dispute Resolution",
    },
    lead: {
      pt: "A informação ao consumidor exigida pela Lei 144/2015, e o Livro de Reclamações.",
      en: "Consumer information required by Portuguese Law 144/2015, and the complaints book.",
    },
    updated: antigo["entidades-resolucao-alternativa-litigios"]?.atualizado ?? "2020-03-10",
    blocks: {
      pt: [
        ...(antigo["entidades-resolucao-alternativa-litigios"]?.blocos ?? []),
        { type: "h2", text: "Livro de Reclamações" },
        {
          type: "p",
          text: "Pode apresentar uma reclamação no Livro de Reclamações eletrónico, em livroreclamacoes.pt.",
        },
        { type: "link", label: "Abrir o Livro de Reclamações", href: "https://www.livroreclamacoes.pt/inicio" },
      ],
      en: [
        ...soPortugues,
        ...(antigo["entidades-resolucao-alternativa-litigios"]?.blocos ?? []),
        { type: "h2", text: "Complaints book" },
        {
          type: "p",
          text: "You may file a complaint in the Portuguese electronic complaints book at livroreclamacoes.pt.",
        },
        { type: "link", label: "Open the complaints book", href: "https://www.livroreclamacoes.pt/inicio" },
      ],
    },
  },
  {
    slug: "utilizacao-responsavel",
    title: {
      pt: "Política de Utilização Responsável",
      en: "Acceptable Use Policy",
    },
    lead: {
      pt: "As regras dos serviços de alojamento: o que é permitido, o que não é, e o que acontece quando não é.",
      en: "The rules for hosting services: what is allowed, what is not, and what happens when it is not.",
    },
    updated: antigo["politica-de-utilizacao-responsavel-pur"]?.atualizado ?? "2022-02-06",
    blocks: {
      pt: antigo["politica-de-utilizacao-responsavel-pur"]?.blocos ?? [],
      en: [...soPortugues, ...(antigo["politica-de-utilizacao-responsavel-pur"]?.blocos ?? [])],
    },
  },
  {
    slug: "termos-e-condicoes",
    title: { pt: "Termos e Condições", en: "Terms and Conditions" },
    lead: {
      pt: "As condições de uso deste site. Os trabalhos contratados regem-se pela proposta assinada, não por esta página.",
      en: "The terms for using this site. Commissioned work is governed by the signed proposal, not by this page.",
    },
    updated: "2026-08-22",
    blocks: {
      pt: [
        { type: "h2", text: "Este site" },
        {
          type: "p",
          text: "Este site é editado pela JELLY – Digital Agency, Unip. Lda., com sede em Sintra, Portugal. Os textos, as imagens e o código são nossos ou de quem nos autorizou a usá-los; as marcas dos clientes pertencem aos clientes e aparecem aqui como referência de trabalho feito.",
        },
        { type: "h2", text: "O que aqui está escrito" },
        {
          type: "p",
          text: "Escrevemos com cuidado, mas nada nesta página é uma proposta comercial nem um compromisso de resultado. Os números dos casos são os que os clientes validaram; os que não estão validados não aparecem.",
        },
        { type: "h2", text: "Trabalhos contratados" },
        {
          type: "p",
          text: "Cada trabalho rege-se pela proposta assinada entre as partes, que define âmbito, prazos, preço e propriedade do que é entregue. Em caso de divergência entre esta página e essa proposta, vale a proposta.",
        },
        { type: "h2", text: "Ligações para fora" },
        {
          type: "p",
          text: "Quando ligamos para sites de terceiros, não respondemos pelo que lá está nem pelo que eles fazem com os seus dados.",
        },
        { type: "h2", text: "Lei aplicável" },
        {
          type: "p",
          text: "Aplica-se a lei portuguesa. Para litígios de consumo, a página de Resolução Alternativa de Litígios indica as entidades disponíveis e o Livro de Reclamações.",
        },
      ],
      en: [
        { type: "h2", text: "This site" },
        {
          type: "p",
          text: "This site is published by JELLY – Digital Agency, Unip. Lda., based in Sintra, Portugal. The text, images and code are ours or used with permission; client trademarks belong to the clients and appear here as a record of work done.",
        },
        { type: "h2", text: "What is written here" },
        {
          type: "p",
          text: "We write carefully, but nothing on this site is a commercial offer or a promise of results. Case numbers are the ones clients validated; the ones they did not validate are not shown.",
        },
        { type: "h2", text: "Commissioned work" },
        {
          type: "p",
          text: "Each engagement is governed by the proposal signed by both parties, which sets scope, deadlines, price and ownership of the deliverables. Where this page and that proposal disagree, the proposal prevails.",
        },
        { type: "h2", text: "Outbound links" },
        {
          type: "p",
          text: "When we link to third-party sites, we are not responsible for what is there or for what they do with your data.",
        },
        { type: "h2", text: "Governing law" },
        {
          type: "p",
          text: "Portuguese law applies. For consumer disputes, the Alternative Dispute Resolution page lists the available bodies and the complaints book.",
        },
      ],
    },
  },
];

export const legalSlugs = legalPages.map((page) => page.slug);

export function getLegalPage(slug: string) {
  return legalPages.find((page) => page.slug === slug);
}
