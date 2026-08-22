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
};

/** Nota que abre as páginas cujo texto só existe em português. */
const soPortugues: Block[] = [
  {
    type: "p",
    text: "This policy refers to Portuguese law and is published in Portuguese only. The Portuguese text below prevails; write to geral@jelly.pt if you need help reading it.",
  },
];

/**
 * As páginas legais. O texto da RAL e da política de utilização responsável vem
 * do site antigo sem uma palavra mudada — tem valor jurídico e não é matéria
 * para reescrever. A privacidade e os cookies são novos, porque as do site
 * antigo eram um serviço externo embutido e não havia texto para migrar: estes
 * descrevem o que este site faz de facto, e devem ser lidos por quem trata do
 * RGPD antes do lançamento.
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
    blocks: {
      pt: [
        { type: "h2", text: "Quem trata os dados" },
        {
          type: "p",
          text: "JELLY – Digital Agency, Unip. Lda., com sede em Sintra, Portugal. Para qualquer questão sobre dados pessoais, escreva para geral@jelly.pt.",
        },
        { type: "h2", text: "O que recolhemos, e porquê" },
        {
          type: "list",
          items: [
            "Formulário de contacto: nome, email, empresa e a mensagem que escreve. Servem para responder ao seu pedido, e é o único fim.",
            "Área de faturação de prestadores: o endereço de email, para lhe enviar um link de acesso e reconhecer a sua sessão.",
            "Registos do servidor: endereço IP, página pedida e hora, guardados pelo alojamento para segurança e diagnóstico.",
          ],
        },
        {
          type: "p",
          text: "Não vendemos dados, não os usamos para publicidade, e não criamos perfis de quem visita o site.",
        },
        { type: "h2", text: "Com que fundamento" },
        {
          type: "p",
          text: "Responder a um contacto que nos dirigiu é interesse legítimo e, na prática, é o que o próprio pedido pressupõe. A área de faturação existe para cumprir a relação contratual com prestadores. Os registos do servidor assentam no interesse legítimo de manter o serviço seguro.",
        },
        { type: "h2", text: "Quem mais lhes toca" },
        {
          type: "p",
          text: "Trabalhamos com fornecedores que tratam dados por nossa conta e apenas para os fins acima: Vercel (alojamento do site), Neon (base de dados, na União Europeia), Resend (envio de email) e Monday.com (gestão dos pedidos que chegam pelo formulário). Nenhum deles usa estes dados para outra coisa.",
        },
        { type: "h2", text: "Quanto tempo ficam" },
        {
          type: "p",
          text: "Os pedidos de contacto ficam enquanto a conversa fizer sentido e, no máximo, dois anos depois do último contacto. As sessões da área de faturação expiram em minutos. Os registos do servidor são apagados pelo alojamento em dias.",
        },
        { type: "h2", text: "Os seus direitos" },
        {
          type: "p",
          text: "Pode pedir para ver, corrigir, apagar ou exportar os seus dados, e opor-se ao tratamento. Basta escrever para geral@jelly.pt: respondemos no prazo de um mês. Se achar que não tratámos bem o assunto, pode reclamar junto da Comissão Nacional de Proteção de Dados (cnpd.pt).",
        },
        { type: "h2", text: "Alterações" },
        {
          type: "p",
          text: "Quando esta política mudar, muda também a data no topo desta página. Não guardamos versões anteriores em segredo: pode pedi-las.",
        },
      ],
      en: [
        { type: "h2", text: "Who processes your data" },
        {
          type: "p",
          text: "JELLY – Digital Agency, Unip. Lda., based in Sintra, Portugal. For anything about personal data, write to geral@jelly.pt.",
        },
        { type: "h2", text: "What we collect, and why" },
        {
          type: "list",
          items: [
            "Contact form: your name, email, company and message. Used to answer you, and nothing else.",
            "Suppliers' billing area: your email address, to send you an access link and recognise your session.",
            "Server logs: IP address, page requested and time, kept by the host for security and diagnostics.",
          ],
        },
        {
          type: "p",
          text: "We do not sell data, do not use it for advertising, and do not profile visitors.",
        },
        { type: "h2", text: "On what basis" },
        {
          type: "p",
          text: "Answering an enquiry you sent us is a legitimate interest — and, in practice, what your message asks for. The billing area exists to serve our contracts with suppliers. Server logs rest on the legitimate interest of keeping the service secure.",
        },
        { type: "h2", text: "Who else handles it" },
        {
          type: "p",
          text: "We work with processors acting on our behalf and only for the purposes above: Vercel (hosting), Neon (database, in the European Union), Resend (email delivery) and Monday.com (handling enquiries from the form). None of them uses this data for anything else.",
        },
        { type: "h2", text: "How long we keep it" },
        {
          type: "p",
          text: "Enquiries are kept while the conversation is live and at most two years after the last contact. Billing sessions expire in minutes. Server logs are deleted by the host within days.",
        },
        { type: "h2", text: "Your rights" },
        {
          type: "p",
          text: "You can ask to see, correct, delete or export your data, and object to processing. Write to geral@jelly.pt and we answer within one month. If you believe we handled it badly, you may complain to the Portuguese data protection authority (cnpd.pt).",
        },
        { type: "h2", text: "Changes" },
        {
          type: "p",
          text: "When this policy changes, so does the date at the top of this page. Previous versions are not secret: ask and we send them.",
        },
      ],
    },
  },
  {
    slug: "politica-de-cookies",
    title: { pt: "Política de Cookies", en: "Cookie Policy" },
    lead: {
      pt: "Este site usa o mínimo: nenhum cookie de publicidade, nenhum de estatística.",
      en: "This site uses the minimum: no advertising cookies, no analytics cookies.",
    },
    updated: "2026-08-22",
    blocks: {
      pt: [
        { type: "h2", text: "O que guardamos no seu browser" },
        {
          type: "list",
          items: [
            "A língua que escolheu, para o site abrir na mesma da próxima vez.",
            "Na área de faturação de prestadores, um cookie de sessão que o mantém autenticado enquanto lá está. Termina quando sai.",
          ],
        },
        {
          type: "p",
          text: "É tudo. Não há cookies de publicidade, de redes sociais nem de estatística — e por isso não lhe pedimos consentimento: os cookies estritamente necessários dispensam-no.",
        },
        { type: "h2", text: "Se isto mudar" },
        {
          type: "p",
          text: "Se um dia passarmos a medir visitas, essa medição não arranca sem lhe perguntarmos primeiro, e esta página passa a listar o que faz cada cookie, quem o põe e quanto tempo dura.",
        },
        { type: "h2", text: "Como apagar" },
        {
          type: "p",
          text: "Qualquer browser permite ver e apagar os cookies de um site nas suas preferências de privacidade. Apagar o da língua só faz o site voltar a abrir em português; apagar o da faturação termina a sessão.",
        },
      ],
      en: [
        { type: "h2", text: "What we keep in your browser" },
        {
          type: "list",
          items: [
            "The language you chose, so the site opens in it next time.",
            "In the suppliers' billing area, a session cookie that keeps you signed in while you are there. It ends when you leave.",
          ],
        },
        {
          type: "p",
          text: "That is all. There are no advertising, social or analytics cookies — which is why we do not ask for consent: strictly necessary cookies do not require it.",
        },
        { type: "h2", text: "If this changes" },
        {
          type: "p",
          text: "If we ever start measuring visits, that measurement will not begin without asking you first, and this page will list what each cookie does, who sets it and how long it lasts.",
        },
        { type: "h2", text: "How to delete them" },
        {
          type: "p",
          text: "Every browser lets you see and delete a site's cookies in its privacy settings. Deleting the language one only makes the site open in Portuguese again; deleting the billing one ends the session.",
        },
      ],
    },
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
