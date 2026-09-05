import type { Localized } from "./types";

/**
 * Os serviços de Marketing, um a um.
 *
 * A página-mãe é o mapa; estas são as páginas para onde o mapa aponta. Cada
 * uma tem o mesmo esqueleto — abertura, o que fazemos, como trabalhamos,
 * perguntas, fecho — porque são dez páginas de uma família e a família lê-se
 * pela repetição. O que muda é o texto, e o texto é o que se vende.
 *
 * Três vieram do site antigo (SEO e GEO, Lead Generation B2B, Vídeo) e trazem
 * o que lá estava de bom; as outras nascem aqui. Uma entrada nesta lista é uma
 * página: a rota, o mapa do site e as ligações da página-mãe leem daqui.
 */

export type Passo = { nome: Localized; corpo: Localized };
export type Pergunta = { pergunta: Localized; resposta: Localized };
export type Formato = { nome: Localized; ideal: Localized; itens: Localized[] };

export type ServicoDeMarketing = {
  /** Endereço em cada língua. */
  slug: { pt: string; en: string };
  area: "performance" | "conteudo" | "influencia" | "dados";
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

export const SERVICOS_DE_MARKETING: ServicoDeMarketing[] = [
  {
    slug: { pt: "paid-media", en: "paid-media" },
    area: "performance",
    nome: { pt: "Paid Media", en: "Paid Media" },
    titulo: { pt: "Cada euro em media com um nome à frente: o da venda que trouxe.", en: "Every euro of media with a name in front of it: the sale it brought." },
    claim: {
      pt: "Google, Meta, LinkedIn e TikTok geridos como um só orçamento, full-funnel, com a atribuição limpa antes do primeiro euro.",
      en: "Google, Meta, LinkedIn and TikTok run as one budget, full-funnel, with clean attribution before the first euro.",
    },
    descricao: {
      pt: "Gestão de paid media pela Jelly: Google Ads, Meta, LinkedIn e TikTok geridos como um só orçamento, com medição limpa, hipóteses ordenadas por retorno e relatório semanal.",
      en: "Paid media management by Jelly: Google Ads, Meta, LinkedIn and TikTok run as one budget, with clean measurement, hypotheses ranked by return and a weekly report.",
    },
    abertura: {
      titulo: { pt: "Onde o dinheiro de media se perde", en: "Where media money gets lost" },
      problema: [
        { pt: "A maioria das contas de media otimiza para o que a plataforma mostra primeiro: o clique. O clique é barato de comprar e caro de manter, e não paga salários.", en: "Most media accounts optimise for what the platform shows first: the click. Clicks are cheap to buy, expensive to keep, and they don't pay salaries." },
        { pt: "Cada canal vive na sua conta, com o seu gestor e o seu relatório, e ninguém responde pela pergunta que interessa: quanto custou a venda, somando tudo.", en: "Each channel lives in its own account, with its own manager and report, and nobody answers the question that matters: what did the sale cost, all in." },
      ],
      abordagem: [
        { pt: "Começamos pela medição, não pela campanha. Eventos, conversões offline e um modelo de atribuição que a equipa comercial reconhece. Só depois se gasta.", en: "We start with measurement, not the campaign. Events, offline conversions and an attribution model the sales team recognises. Only then do we spend." },
        { pt: "Depois, um só orçamento para todos os canais. O que converte ganha na semana seguinte; o que não converte perde, sem drama e sem a inércia de quem defende o seu canal.", en: "Then one budget across all channels. What converts gets more the following week; what doesn't loses, without drama and without anyone defending their channel." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que entra numa conta de paid media da Jelly", en: "What goes into a Jelly paid media account" },
      itens: [
        { nome: { pt: "Search e Shopping", en: "Search and Shopping" }, corpo: { pt: "Google e Bing. Estrutura por intenção, feed de produto limpo, lances ligados à margem e não ao clique.", en: "Google and Bing. Intent-led structure, a clean product feed, bids tied to margin rather than clicks." } },
        { nome: { pt: "Social pago", en: "Paid social" }, corpo: { pt: "Meta, TikTok e LinkedIn. Criativos testados em série, audiências construídas a partir dos clientes que valem mais.", en: "Meta, TikTok and LinkedIn. Creatives tested in series, audiences built from the customers worth most." } },
        { nome: { pt: "Full-funnel", en: "Full-funnel" }, corpo: { pt: "Alcance, consideração e conversão com orçamento próprio e o mesmo painel. Sem topo de funil, o fundo seca em três meses.", en: "Reach, consideration and conversion with their own budget and one dashboard. Without the top of the funnel, the bottom dries up in three months." } },
        { nome: { pt: "Criativo para performance", en: "Performance creative" }, corpo: { pt: "Vídeo curto, estáticos e UGC produzidos para serem testados. Um anúncio é uma hipótese com imagem.", en: "Short video, statics and UGC made to be tested. An ad is a hypothesis with a picture." } },
        { nome: { pt: "Medição e atribuição", en: "Measurement and attribution" }, corpo: { pt: "Consent mode, conversões offline do CRM, atribuição por dados. O número que aparece no relatório é o que a direção comercial confirma.", en: "Consent mode, offline conversions from the CRM, data-driven attribution. The number in the report is the one sales leadership confirms." } },
        { nome: { pt: "Relatório semanal", en: "Weekly report" }, corpo: { pt: "Uma página: o que aconteceu, o que aprendemos, o que muda na semana seguinte. Sem quarenta métricas.", en: "One page: what happened, what we learned, what changes next week. No forty-metric dashboards." } },
      ],
    },
    passos: {
      titulo: { pt: "Como uma conta arranca", en: "How an account starts" },
      itens: [
        { nome: { pt: "Linha de base", en: "Baseline" }, corpo: { pt: "Duas semanas de medição limpa antes de gastar: eventos, atribuição, e o custo por venda de partida, mesmo que seja incómodo.", en: "Two weeks of clean measurement before spending: events, attribution, and the starting cost per sale, however uncomfortable." } },
        { nome: { pt: "Hipóteses", en: "Hypotheses" }, corpo: { pt: "Cinco a dez apostas por canal, ordenadas pelo retorno esperado e pelo que custa testá-las. Não por gosto.", en: "Five to ten bets per channel, ranked by expected return and by the cost of testing them. Not by taste." } },
        { nome: { pt: "Cadência", en: "Cadence" }, corpo: { pt: "Ciclos semanais de testar, ler e decidir. O orçamento move-se todas as semanas para onde a venda está a acontecer.", en: "Weekly cycles of test, read, decide. Budget moves every week to where the sale is happening." } },
        { nome: { pt: "Escala", en: "Scale" }, corpo: { pt: "A partir do segundo mês, o que funciona ganha orçamento e criativo novo. O que não funciona morre depressa.", en: "From month two, what works gets budget and fresh creative. What doesn't dies quickly." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Qual é o orçamento mínimo de media?", en: "What's the minimum media budget?" }, resposta: { pt: "Não há um número fixo: há um mínimo por hipótese. Um orçamento que não chegue para testar duas ideias por semana num canal ensina pouco. Dizemos isso na primeira conversa, com números.", en: "There's no fixed figure: there's a minimum per hypothesis. A budget that can't test two ideas a week on one channel teaches little. We say so in the first conversation, with numbers." } },
      { pergunta: { pt: "Trabalham com a nossa conta ou com a vossa?", en: "Do you work on our account or yours?" }, resposta: { pt: "Sempre na vossa. As contas, os dados e o histórico são do cliente. Se um dia trocar de agência, leva tudo.", en: "Always on yours. Accounts, data and history belong to the client. If you ever change agency, you take everything with you." } },
      { pergunta: { pt: "Em quanto tempo se vê resultado?", en: "How soon do we see results?" }, resposta: { pt: "A media paga responde em dias e afina em semanas. O primeiro relatório com aprendizagem útil chega ao fim da terceira semana; a estabilidade do custo por venda leva dois a três meses.", en: "Paid media responds in days and settles in weeks. The first report with useful learning arrives by week three; a stable cost per sale takes two to three months." } },
      { pergunta: { pt: "Fazem também os criativos?", en: "Do you also produce the creatives?" }, resposta: { pt: "Sim. Vídeo curto, estáticos e conteúdo de criadores saem do nosso estúdio e das nossas parcerias, e são produzidos para ser testados, não para ganhar prémios.", en: "Yes. Short video, statics and creator content come from our studio and our partners, produced to be tested rather than to win awards." } },
      { pergunta: { pt: "Como reportam?", en: "How do you report?" }, resposta: { pt: "Todas as semanas, numa página, com o custo por venda ou por lead qualificada à frente de tudo o resto. E um painel sempre aberto para quem quiser ver o detalhe.", en: "Every week, on one page, with cost per sale or per qualified lead ahead of everything else. Plus an always-on dashboard for anyone who wants the detail." } },
    ],
    fecho: { titulo: { pt: "Quer saber quanto custa hoje a sua venda?", en: "Want to know what your sale costs today?" }, texto: { pt: "Duas semanas de medição dizem-no. Depois decide-se onde entrar.", en: "Two weeks of measurement will tell you. Then we decide where to go in." } },
  },

  {
    slug: { pt: "seo-geo", en: "seo-geo" },
    area: "performance",
    nome: { pt: "SEO e GEO", en: "SEO and GEO" },
    titulo: { pt: "Enquanto uns procuram visibilidade, outros conquistam relevância. E são os escolhidos.", en: "While some chase visibility, others earn relevance. And they are the ones chosen." },
    claim: {
      pt: "Search Everywhere Optimization: ser encontrado onde quer que o seu público pesquise, pergunte ou converse. No Google, no TikTok, no ChatGPT.",
      en: "Search Everywhere Optimization: be found wherever your audience searches, asks or talks. On Google, on TikTok, in ChatGPT.",
    },
    descricao: {
      pt: "SEO e GEO pela Jelly: otimização para motores de pesquisa, para social search e para motores generativos como ChatGPT e Perplexity. Três níveis de serviço, da base técnica à estratégia.",
      en: "SEO and GEO by Jelly: optimisation for search engines, social search and generative engines such as ChatGPT and Perplexity. Three service levels, from technical foundations to strategy.",
    },
    abertura: {
      titulo: { pt: "A forma de pesquisar mudou", en: "The way people search has changed" },
      problema: [
        { pt: "As pessoas já não recorrem só ao Google. Fazem perguntas ao ChatGPT, pesquisam no TikTok, leem a resposta na própria página de resultados sem clicar em nada.", en: "People no longer rely on Google alone. They ask ChatGPT, search on TikTok, and read the answer on the results page itself without clicking anything." },
        { pt: "Uma estratégia de SEO desenhada para dez links azuis fala com um mundo que já não existe. Ter tráfego é uma coisa; ser a fonte citada é outra.", en: "An SEO strategy designed for ten blue links speaks to a world that no longer exists. Getting traffic is one thing; being the cited source is another." },
      ],
      abordagem: [
        { pt: "Preparamos a marca para esta realidade em três frentes: os motores de pesquisa tradicionais, a pesquisa social e os motores generativos. O mesmo conteúdo, marcado e estruturado para os três.", en: "We prepare the brand for this reality on three fronts: traditional search engines, social search and generative engines. The same content, marked up and structured for all three." },
        { pt: "E medimos onde a maioria não mede: menções em respostas de IA, share of voice por tema, citações. Se não aparece na resposta, não existe.", en: "And we measure where most don't: mentions in AI answers, share of voice by topic, citations. If you're not in the answer, you don't exist." },
      ],
    },
    fazemos: {
      titulo: { pt: "Atuação por canal", en: "Where we act, by channel" },
      itens: [
        { nome: { pt: "Motores de pesquisa", en: "Search engines" }, corpo: { pt: "Google, Bing e Yandex. Auditoria técnica, Page Experience, Core Web Vitals, IndexNow. A base rastreável de tudo o resto.", en: "Google, Bing and Yandex. Technical audit, Page Experience, Core Web Vitals, IndexNow. The crawlable foundation for everything else." } },
        { nome: { pt: "Social search", en: "Social search" }, corpo: { pt: "YouTube, TikTok, Pinterest e LinkedIn. Pesquisa de tendências, tags, thumbnails e descrições que são elas próprias resultados de pesquisa.", en: "YouTube, TikTok, Pinterest and LinkedIn. Trend research, tags, thumbnails and descriptions that are search results in their own right." } },
        { nome: { pt: "Motores generativos", en: "Generative engines" }, corpo: { pt: "ChatGPT, Gemini, Copilot e Perplexity. Schema orientado a snippets, parágrafos ancorados, licenças de reutilização e APIs de conteúdo, para ser citado e não só rastreado.", en: "ChatGPT, Gemini, Copilot and Perplexity. Snippet-oriented schema, anchored paragraphs, reuse licences and content APIs, so you get cited rather than merely crawled." } },
        { nome: { pt: "Conteúdo com intenção", en: "Intent-led content" }, corpo: { pt: "Calendário editorial por intenção de pesquisa, topic clusters, atualização de frescura. O conteúdo é o combustível; sem ele o SEO é só canalização.", en: "An editorial calendar built on search intent, topic clusters, freshness updates. Content is the fuel; without it SEO is just plumbing." } },
        { nome: { pt: "Autoridade", en: "Authority" }, corpo: { pt: "Digital PR, link-building ético, colaborações. Ligado à nossa área de Influência e Reputação, porque é o mesmo trabalho visto de outro lado.", en: "Digital PR, ethical link-building, collaborations. Tied to our Influence and Reputation area, because it's the same work seen from the other side." } },
        { nome: { pt: "Medição multicanal", en: "Multichannel measurement" }, corpo: { pt: "Dashboards de share of voice, citações em IA, logs dos bots e ROI por canal. O que não se mede, não se defende no orçamento.", en: "Share-of-voice dashboards, AI citations, bot logs and ROI by channel. What isn't measured can't be defended in the budget." } },
      ],
    },
    formatos: {
      titulo: { pt: "Três níveis de serviço", en: "Three service levels" },
      nota: { pt: "Escolhe-se pelo ponto de partida do site e pela ambição, não pelo preço. Passa-se de um para o outro quando o anterior está feito.", en: "Chosen by where the site starts and how far it wants to go, not by price. You move from one to the next when the previous one is done." },
      itens: [
        { nome: { pt: "SEO Machine", en: "SEO Machine" }, ideal: { pt: "Para websites que precisam de uma base sólida e rastreável.", en: "For websites that need a solid, crawlable foundation." }, itens: [
          { pt: "Google Site Kit, Bing Webmaster e IndexNow instalados", en: "Google Site Kit, Bing Webmaster and IndexNow installed" },
          { pt: "Sitemaps e robots.txt, incluindo GPTBot e Google-Extended", en: "Sitemaps and robots.txt, including GPTBot and Google-Extended" },
          { pt: "Titles, meta descriptions, alt texts, H1 e mapeamento de keywords", en: "Titles, meta descriptions, alt texts, H1 and keyword mapping" },
          { pt: "Schema básico e diretivas de licenciamento para IA", en: "Basic schema and AI licensing directives" },
        ] },
        { nome: { pt: "SEO Content", en: "SEO Content" }, ideal: { pt: "Para marcas que querem crescer tráfego e autoridade com conteúdos consistentes.", en: "For brands that want to grow traffic and authority with consistent content." }, itens: [
          { pt: "Calendário editorial baseado em intenção de pesquisa", en: "Editorial calendar based on search intent" },
          { pt: "Artigos, FAQs, vídeos curtos e peças para social", en: "Articles, FAQs, short videos and social pieces" },
          { pt: "Otimização on-page contínua, interlinking e frescura", en: "Continuous on-page optimisation, interlinking and freshness" },
          { pt: "Marcação avançada: HowTo, Video, Review, Recipe", en: "Advanced markup: HowTo, Video, Review, Recipe" },
        ] },
        { nome: { pt: "SEO Strategy", en: "SEO Strategy" }, ideal: { pt: "Para empresas que precisam de integrar o SEO no planeamento de marketing e produto.", en: "For companies that need SEO built into marketing and product planning." }, itens: [
          { pt: "Pesquisa de mercado e topic clusters", en: "Market research and topic clusters" },
          { pt: "Construção de autoridade: digital PR, link-building ético, colaborações", en: "Authority building: digital PR, ethical link-building, collaborations" },
          { pt: "Governance editorial, guidelines EEAT, auditorias de compliance em IA", en: "Editorial governance, EEAT guidelines, AI compliance audits" },
          { pt: "Dashboards de share of voice, citações em IA e ROI multicanal", en: "Share-of-voice dashboards, AI citations and multichannel ROI" },
        ] },
      ],
    },
    passos: {
      titulo: { pt: "Como se começa", en: "How it starts" },
      itens: [
        { nome: { pt: "Auditoria", en: "Audit" }, corpo: { pt: "Técnica, de conteúdo e de presença em IA. Onde o site é rastreado, onde é citado, onde nem aparece.", en: "Technical, content and AI-presence. Where the site is crawled, where it's cited, where it doesn't appear at all." } },
        { nome: { pt: "Base", en: "Foundation" }, corpo: { pt: "O que está partido arranja-se primeiro: indexação, velocidade, estrutura, marcação. Ganhos técnicos imediatos.", en: "Fix what's broken first: indexing, speed, structure, markup. Immediate technical gains." } },
        { nome: { pt: "Conteúdo", en: "Content" }, corpo: { pt: "O calendário por intenção arranca e o conteúdo começa a acumular. Os ganhos de tráfego compõem-se entre três e seis meses.", en: "The intent-led calendar starts and content begins to compound. Traffic gains build over three to six months." } },
        { nome: { pt: "Autoridade e medição", en: "Authority and measurement" }, corpo: { pt: "Digital PR e colaborações, com a medição de citações em IA a dizer onde a marca já é a resposta e onde ainda não.", en: "Digital PR and collaborations, with AI-citation tracking showing where the brand is already the answer and where it isn't yet." } },
      ],
    },
    faq: [
      { pergunta: { pt: "O SEO ainda traz tráfego se as respostas aparecem na própria página de resultados?", en: "Does SEO still drive traffic when answers appear on the results page itself?" }, resposta: { pt: "Sim. Ao otimizar para answer boxes e citações em IA, a marca aparece como fonte confiável: ganha os cliques de quem quer aprofundar e a notoriedade de quem não clica.", en: "Yes. By optimising for answer boxes and AI citations, the brand appears as a trusted source: it wins the clicks of those who want depth and the awareness of those who don't click." } },
      { pergunta: { pt: "Como medem o impacto em IA generativa?", en: "How do you measure the impact in generative AI?" }, resposta: { pt: "Monitorizamos resumos de IA nos resultados, menções em ChatGPT e Perplexity, e os logs dos principais bots de IA no servidor. É um relatório próprio, ao lado do tradicional.", en: "We monitor AI overviews in results, mentions in ChatGPT and Perplexity, and server logs of the main AI bots. It's a report of its own, alongside the traditional one." } },
      { pergunta: { pt: "Quanto tempo até ver resultados?", en: "How long until results show?" }, resposta: { pt: "O nível Machine mostra melhorias técnicas imediatas. Os ganhos de tráfego compõem-se entre três e seis meses, conforme a concorrência e o investimento em conteúdo.", en: "The Machine level shows immediate technical improvements. Traffic gains compound over three to six months, depending on competition and content investment." } },
      { pergunta: { pt: "Trabalham só com o Google?", en: "Do you only work with Google?" }, resposta: { pt: "Não. Bing, social search e indexadores de IA fazem parte do trabalho, para o conteúdo estar onde o público está.", en: "No. Bing, social search and AI indexers are part of the work, so the content is wherever the audience is." } },
      { pergunta: { pt: "E se já tivermos equipa interna?", en: "What if we already have an in-house team?" }, resposta: { pt: "Integramo-nos: auditorias, templates de conteúdo e workshops para a equipa ficar mais capaz, não mais dependente.", en: "We plug in: audits, content templates and workshops that leave the team more capable, not more dependent." } },
    ],
    fecho: { titulo: { pt: "Chega de conversa. Vamos construir a visibilidade do seu website juntos?", en: "Enough talk. Shall we build your website's visibility together?" }, texto: { pt: "Começa com uma auditoria, e a auditoria começa com uma conversa.", en: "It starts with an audit, and the audit starts with a conversation." } },
  },

  {
    slug: { pt: "lead-generation-b2b", en: "b2b-lead-generation" },
    area: "performance",
    nome: { pt: "Lead Generation B2B", en: "B2B Lead Generation" },
    titulo: { pt: "Digital sem propósito é ruído. Comercial sem visão é esforço. Juntos, são estratégia.", en: "Digital without purpose is noise. Sales without vision is effort. Together, they are strategy." },
    claim: {
      pt: "Estratégia digital B2B com os dados da Informa D&B: saber quem são e quanto valem os clientes a conquistar antes de gastar a falar com os errados.",
      en: "B2B digital strategy powered by Informa D&B data: know who the customers worth winning are, and what they're worth, before spending on the wrong ones.",
    },
    descricao: {
      pt: "Lead generation B2B pela Jelly com os dados da Informa D&B: diagnóstico da carteira, empresas semelhantes aos melhores clientes, campanhas dirigidas e pré-qualificação com agentes de IA.",
      en: "B2B lead generation by Jelly with Informa D&B data: portfolio diagnosis, look-alikes of your best customers, targeted campaigns and AI-agent pre-qualification.",
    },
    abertura: {
      titulo: { pt: "Por trás de cada cliente há um padrão", en: "Behind every customer there is a pattern" },
      problema: [
        { pt: "No B2C, uma boa campanha gera vendas em horas. No B2B, em cada duzentos contactos só trinta reúnem condições para se tornarem clientes, e a equipa comercial gasta o tempo a descobrir quais.", en: "In B2C a good campaign generates sales in hours. In B2B, of every two hundred contacts only thirty have the conditions to become customers, and the sales team spends its time finding out which." },
        { pt: "O marketing digital B2B falha quando compra atenção de empresas que nunca poderiam comprar: pela dimensão, pelo setor, pela saúde financeira. É ruído com fatura.", en: "B2B digital marketing fails when it buys the attention of companies that could never buy: by size, by sector, by financial health. It's noise with an invoice." },
      ],
      abordagem: [
        { pt: "Combinamos a inteligência de dados da Informa D&B, especialista no tecido empresarial português, com a execução digital da Jelly. Primeiro sabe-se quem vale, depois fala-se com quem vale.", en: "We combine the data intelligence of Informa D&B, specialists in Portugal's business fabric, with Jelly's digital execution. First you know who's worth it, then you talk to them." },
        { pt: "E fechamos o circuito com agentes de IA que pré-qualificam cada lead antes de chegar à equipa comercial: a equipa fala com os trinta, não com os duzentos.", en: "And we close the loop with AI agents that pre-qualify each lead before it reaches sales: the team talks to the thirty, not the two hundred." },
      ],
    },
    fazemos: {
      titulo: { pt: "Do diagnóstico à reunião marcada", en: "From diagnosis to the meeting in the calendar" },
      itens: [
        { nome: { pt: "Diagnóstico e análise da carteira", en: "Portfolio diagnosis and analysis" }, corpo: { pt: "O potencial real de crescimento, dentro da carteira atual e no mercado. Quem são os melhores clientes, o que têm em comum, quantos como eles existem.", en: "The real growth potential, inside the current portfolio and in the market. Who the best customers are, what they share, how many like them exist." } },
        { nome: { pt: "Atrair novos clientes", en: "Win new customers" }, corpo: { pt: "Empresas semelhantes aos melhores clientes, identificadas com dados da Informa D&B e quantificadas em potencial de vendas antes da primeira campanha.", en: "Companies that resemble your best customers, identified with Informa D&B data and quantified in sales potential before the first campaign." } },
        { nome: { pt: "Crescer na carteira atual", en: "Grow the existing portfolio" }, corpo: { pt: "Oportunidades escondidas na base de clientes existente: quem compra abaixo do que podia, quem tem empresas do grupo por abordar.", en: "Opportunities hidden in the existing customer base: who buys below their potential, which group companies remain unapproached." } },
        { nome: { pt: "Campanhas dirigidas", en: "Targeted campaigns" }, corpo: { pt: "LinkedIn, Google, e-mail e conteúdo apontados às listas certas. O orçamento não se dilui em quem nunca compraria.", en: "LinkedIn, Google, email and content aimed at the right lists. Budget isn't diluted on those who would never buy." } },
        { nome: { pt: "Pré-qualificação com agentes de IA", en: "AI-agent pre-qualification" }, corpo: { pt: "Um agente conversa com cada lead, confirma dimensão, necessidade e prazo, e entrega à equipa comercial só o que está pronto, com o resumo feito.", en: "An agent talks to each lead, confirms size, need and timing, and hands the sales team only what's ready, summary included." } },
        { nome: { pt: "Ligação ao CRM", en: "CRM connection" }, corpo: { pt: "Cada lead entra no Pipedrive, HubSpot ou no vosso CRM com origem, pontuação e histórico. O comercial abre a ficha e sabe por onde começar.", en: "Every lead lands in Pipedrive, HubSpot or your CRM with source, score and history. Sales opens the record and knows where to start." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se trabalha", en: "How the work runs" },
      itens: [
        { nome: { pt: "Ler a carteira", en: "Read the portfolio" }, corpo: { pt: "Cruzamos os vossos clientes com os dados da Informa D&B. Sai um retrato: quem vale mais, e quanto mercado igual a eles existe.", en: "We cross your customers with Informa D&B data. Out comes a portrait: who's worth most, and how much market like them exists." } },
        { nome: { pt: "Definir o alvo", en: "Define the target" }, corpo: { pt: "Listas de empresas por prioridade, com o potencial de vendas de cada segmento. É aqui que se decide onde gastar.", en: "Company lists by priority, with the sales potential of each segment. This is where we decide where to spend." } },
        { nome: { pt: "Ativar", en: "Activate" }, corpo: { pt: "Campanhas e conteúdo apontados às listas, com o agente de IA a qualificar quem responde. Cada semana, o funil lê-se de ponta a ponta.", en: "Campaigns and content aimed at the lists, with the AI agent qualifying whoever responds. Every week the funnel is read end to end." } },
        { nome: { pt: "Medir em receita", en: "Measure in revenue" }, corpo: { pt: "Não em leads: em reuniões marcadas, propostas e negócios ganhos, lidos no CRM. É o único número que a direção comercial aceita.", en: "Not in leads: in meetings booked, proposals and deals won, read from the CRM. It's the only number sales leadership accepts." } },
      ],
    },
    faq: [
      { pergunta: { pt: "O que é a Informa D&B e porque é que importa aqui?", en: "What is Informa D&B and why does it matter here?" }, resposta: { pt: "É a especialista no conhecimento do tecido empresarial em Portugal: informação atualizada sobre empresas, dimensão, setor e risco. É o que nos permite dizer, antes de gastar, quem pode comprar e quem não.", en: "Portugal's specialist in business-fabric intelligence: up-to-date information on companies, size, sector and risk. It's what lets us say, before spending, who can buy and who can't." } },
      { pergunta: { pt: "Isto serve para empresas pequenas?", en: "Does this work for small companies?" }, resposta: { pt: "Serve para quem vende a empresas e tem um ciclo de venda com várias conversas. A dimensão que importa é a do ticket, não a da empresa.", en: "It works for anyone selling to businesses with a multi-conversation sales cycle. The size that matters is the ticket, not the company." } },
      { pergunta: { pt: "Como é que o agente de IA qualifica sem afastar o cliente?", en: "How does the AI agent qualify without putting customers off?" }, resposta: { pt: "Conversa como uma pessoa da equipa conversaria nas primeiras perguntas, responde ao que lhe perguntam e passa a uma pessoa assim que a lead está pronta ou pede. Tem página própria: veja a pré-qualificação de leads com agentes de IA.", en: "It talks the way a team member would in the first few questions, answers what it's asked, and hands over to a person as soon as the lead is ready or asks. It has its own page: see AI-agent lead pre-qualification." } },
      { pergunta: { pt: "Precisamos de trocar de CRM?", en: "Do we need to change CRM?" }, resposta: { pt: "Não. Ligamos ao que existe. Se não existir nenhum, ajudamos a escolher um que a equipa use de facto.", en: "No. We connect to what you have. If there's none, we help pick one the team will actually use." } },
    ],
    fecho: { titulo: { pt: "Negócio B2B? Descubra como transformar dados em crescimento real.", en: "B2B business? Find out how to turn data into real growth." }, texto: { pt: "Começa por uma leitura da vossa carteira. Sem compromisso, com números.", en: "It starts with a reading of your portfolio. No commitment, with numbers." } },
  },
];

/** Um serviço pelo seu endereço, em qualquer das duas línguas. */
export function servicoDeMarketing(slug: string): ServicoDeMarketing | undefined {
  return SERVICOS_DE_MARKETING.find((s) => s.slug.pt === slug || s.slug.en === slug);
}

/** Os outros serviços da mesma área. */
export function irmaos(servico: ServicoDeMarketing): ServicoDeMarketing[] {
  return SERVICOS_DE_MARKETING.filter((s) => s.area === servico.area && s.slug.pt !== servico.slug.pt);
}
