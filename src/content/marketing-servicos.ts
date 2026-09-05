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
      { pergunta: { pt: "Como reportam?", en: "How do you report?" }, resposta: { pt: "Em tempo real, em analytics.jelly.pt: dashboards feitos à medida de cada conta, com o custo por venda ou por lead qualificada à frente de tudo o resto. E relatórios periódicos, semanais ou mensais conforme o acordado, que dizem o que aconteceu, o que aprendemos e o que muda a seguir.", en: "In real time, at analytics.jelly.pt: dashboards built for each account, with cost per sale or per qualified lead ahead of everything else. Plus periodic reports, weekly or monthly as agreed, saying what happened, what we learned and what changes next." } },
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

  {
    slug: { pt: "social-media", en: "social-media" },
    area: "conteudo",
    nome: { pt: "Social Media", en: "Social Media" },
    titulo: { pt: "As redes não são um mural. São um meio, e um meio gere-se.", en: "Social isn't a noticeboard. It's a medium, and a medium gets managed." },
    claim: {
      pt: "Gestão, conteúdos e comunidade nas redes que interessam ao negócio, com uma ideia editorial por trás e o tempo de atenção como medida.",
      en: "Management, content and community on the networks that matter to the business, with an editorial idea behind them and attention time as the measure.",
    },
    descricao: {
      pt: "Gestão de social media pela Jelly: estratégia, linha editorial, produção de conteúdos, comunidade e social ads, com relatório mensal lido pelo tempo de atenção e não pelo alcance.",
      en: "Social media management by Jelly: strategy, editorial line, content production, community and social ads, with a monthly report read by attention time rather than reach.",
    },
    abertura: {
      titulo: { pt: "Alcance é vaidade. Atenção é o que fica.", en: "Reach is vanity. Attention is what stays." },
      problema: [
        { pt: "A maioria das marcas publica para não desaparecer: três posts por semana, uma imagem de banco, uma frase que podia ser de qualquer outra. Alcança muita gente durante dois segundos.", en: "Most brands post so as not to disappear: three posts a week, a stock image, a line that could belong to anyone. It reaches many people for two seconds." },
        { pt: "E mede o que a plataforma mostra: seguidores, gostos, alcance. Nenhum deles aparece na conta de resultados.", en: "And it measures what the platform shows: followers, likes, reach. None of them shows up in the P&L." },
      ],
      abordagem: [
        { pt: "Tratamos cada rede como um meio próprio, com a sua linha editorial, o seu formato e o seu ritmo. Uma ideia por mês, não um post por dia sem ideia.", en: "We treat each network as a medium of its own, with its editorial line, format and rhythm. One idea a month, not one idea-less post a day." },
        { pt: "E lemos pelo tempo de atenção, pelos guardados e pelas conversas que começam, porque é isso que antecede uma compra. O alcance vem a seguir, e vem porque houve atenção.", en: "And we read by attention time, saves and conversations started, because that's what precedes a purchase. Reach follows, and it follows because there was attention." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que uma conta de social media da Jelly inclui", en: "What a Jelly social media account includes" },
      itens: [
        { nome: { pt: "Estratégia e linha editorial", en: "Strategy and editorial line" }, corpo: { pt: "Que redes, para quem, com que voz e com que temas. Escrito, e revisto de três em três meses contra o número.", en: "Which networks, for whom, in what voice and on which topics. Written down, and reviewed quarterly against the number." } },
        { nome: { pt: "Produção de conteúdos", en: "Content production" }, corpo: { pt: "Vídeo curto, carrosséis, fotografia e texto, feitos no nosso estúdio para o formato de cada rede, não adaptados à pressa.", en: "Short video, carousels, photography and copy, made in our studio for each network's format rather than hastily adapted." } },
        { nome: { pt: "Comunidade", en: "Community" }, corpo: { pt: "Responder, moderar e conversar em nome da marca, com tempos de resposta acordados e uma voz que não muda com quem está de turno.", en: "Replying, moderating and talking on behalf of the brand, with agreed response times and a voice that doesn't change with whoever is on shift." } },
        { nome: { pt: "Social ads", en: "Social ads" }, corpo: { pt: "Amplificar o que já provou merecer atenção. O orçamento pago segue o orgânico, não o substitui.", en: "Amplify what has already earned attention. Paid budget follows organic, it doesn't replace it." } },
        { nome: { pt: "Criadores e UGC", en: "Creators and UGC" }, corpo: { pt: "Conteúdo de criadores integrado no calendário, em ligação com a nossa área de Influência e Reputação.", en: "Creator content built into the calendar, in step with our Influence and Reputation area." } },
        { nome: { pt: "Relatório mensal", en: "Monthly report" }, corpo: { pt: "O que prendeu atenção, o que gerou conversa, o que trouxe visitas e leads. E o que sai do calendário por causa disso.", en: "What held attention, what sparked conversation, what brought visits and leads. And what leaves the calendar because of it." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se arranca", en: "How we start" },
      itens: [
        { nome: { pt: "Auditoria e voz", en: "Audit and voice" }, corpo: { pt: "O que a marca publicou, o que funcionou, o que a concorrência faz. E a voz: como fala, do que fala, do que não fala.", en: "What the brand has posted, what worked, what competitors do. And the voice: how it speaks, what it speaks about, what it doesn't." } },
        { nome: { pt: "Linha editorial", en: "Editorial line" }, corpo: { pt: "Três a cinco territórios de conteúdo, os formatos de cada rede e o ritmo que a equipa aguenta sem baixar a qualidade.", en: "Three to five content territories, the formats for each network and a rhythm the team can sustain without dropping quality." } },
        { nome: { pt: "Produção em ciclo", en: "Production in cycles" }, corpo: { pt: "Um mês de conteúdo produzido de cada vez, com margem para reagir ao que acontece. Publicação, comunidade e leitura semanal.", en: "A month of content produced at a time, with room to react to what happens. Publishing, community and a weekly read." } },
        { nome: { pt: "Ler e ajustar", en: "Read and adjust" }, corpo: { pt: "Todos os meses, o que ganhou atenção ganha mais lugar; o que não ganhou sai. O calendário é uma hipótese, não um contrato.", en: "Every month, what earned attention earns more room; what didn't leaves. The calendar is a hypothesis, not a contract." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Em que redes devemos estar?", en: "Which networks should we be on?" }, resposta: { pt: "Nas que o vosso cliente usa para decidir, não em todas. Para a maioria dos negócios B2B são duas; para o consumo, três. Dizemos quais na auditoria, e dizemos também de quais sair.", en: "The ones your customer uses to decide, not all of them. For most B2B businesses that's two; for consumer brands, three. We say which in the audit, and which to leave." } },
      { pergunta: { pt: "Quantas publicações por semana?", en: "How many posts a week?" }, resposta: { pt: "As que a ideia pedir e a qualidade aguentar. Preferimos três boas a sete esquecíveis, e o algoritmo também.", en: "As many as the idea calls for and quality can sustain. We'd rather do three good ones than seven forgettable ones, and so would the algorithm." } },
      { pergunta: { pt: "Quem responde aos comentários e mensagens?", en: "Who answers comments and messages?" }, resposta: { pt: "Nós, dentro de horários e tempos de resposta acordados, com um guia de voz e de casos a escalar para a vossa equipa. O que é comercial ou sensível passa para vocês na hora.", en: "We do, within agreed hours and response times, with a voice guide and escalation cases for your team. Anything commercial or sensitive is passed to you straight away." } },
      { pergunta: { pt: "Fazem também os anúncios nas redes?", en: "Do you also run the ads on social?" }, resposta: { pt: "Sim, e de preferência a partir do conteúdo que já provou funcionar em orgânico. Quando a conta de media é grande, junta-se à área de Paid Media.", en: "Yes, and preferably from content that has already proven itself organically. When the media account is large, it joins the Paid Media area." } },
    ],
    fecho: { titulo: { pt: "Quer redes que trabalhem para o negócio, e não só para o feed?", en: "Want social that works for the business, not just the feed?" }, texto: { pt: "Começa por uma auditoria do que já publicam. Demora uma semana e diz muito.", en: "It starts with an audit of what you already post. It takes a week and says a lot." } },
  },

  {
    slug: { pt: "video-audiovisual", en: "video-and-audiovisual" },
    area: "conteudo",
    nome: { pt: "Vídeo e Audiovisual", en: "Video and Audiovisual" },
    titulo: { pt: "Vídeos feitos para atrair e converter, com uma fração de segundo para o conseguir.", en: "Video made to attract and convert, with a fraction of a second to do it." },
    claim: {
      pt: "Jelly.Studio: produção e pós-produção de vídeo para campanhas de performance, spots, institucionais e conteúdo para redes. Estúdio próprio, da ideia ao ficheiro final.",
      en: "Jelly.Studio: video production and post-production for performance campaigns, spots, corporate films and social content. Our own studio, from idea to final file.",
    },
    descricao: {
      pt: "Produção de vídeo pela Jelly: storytelling, pré-produção, filmagem em estúdio próprio ou exterior, pós-produção e motion graphics, com versões para cada canal e medição em campanha.",
      en: "Video production by Jelly: storytelling, pre-production, shooting in our own studio or on location, post-production and motion graphics, with versions for every channel and in-campaign measurement.",
    },
    abertura: {
      titulo: { pt: "Seduzir e conquistar", en: "Seduce and win" },
      problema: [
        { pt: "Um vídeo numa campanha online tem uma fração de tempo para prender a atenção de quem faz scroll. A maioria gasta esse tempo com um logótipo a aparecer.", en: "A video in an online campaign has a fraction of a second to hold the attention of someone scrolling. Most spend that time on a logo fading in." },
        { pt: "E é produzido uma vez, num formato, para um canal. Depois é esticado, cortado e legendado à pressa para todos os outros, e nota-se.", en: "And it's produced once, in one format, for one channel. Then it's stretched, cropped and subtitled in a hurry for all the others, and it shows." },
      ],
      abordagem: [
        { pt: "Conquistar, para nós, significa gerar leads qualificadas e vendas. Por isso o vídeo nasce da campanha e não ao lado dela: sabe-se onde vai correr, quanto tempo tem e o que tem de acontecer depois.", en: "Winning, to us, means qualified leads and sales. So the video is born from the campaign, not beside it: we know where it will run, how long it has and what must happen next." },
        { pt: "O Jelly.Studio assegura todas as fases, do storytelling à pós-produção, com estúdio próprio para vídeo e fotografia. E entrega versões para cada canal, pensadas de raiz e não adaptadas.", en: "Jelly.Studio covers every phase, from storytelling to post-production, with our own studio for video and photography. And delivers versions for each channel, designed from scratch rather than adapted." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que sai do Jelly.Studio", en: "What comes out of Jelly.Studio" },
      itens: [
        { nome: { pt: "Vídeo para performance", en: "Performance video" }, corpo: { pt: "Peças curtas para Meta, TikTok, YouTube e Google, com variantes para testar: gancho, oferta e chamada em versões diferentes.", en: "Short pieces for Meta, TikTok, YouTube and Google, with variants to test: hook, offer and call to action in different versions." } },
        { nome: { pt: "Spots e institucionais", en: "Spots and corporate films" }, corpo: { pt: "Filmes de marca e de produto, para televisão, cinema e digital. Como o spot dos quarenta anos do Slide & Splash, contado em vinte segundos.", en: "Brand and product films for TV, cinema and digital. Like the Slide & Splash 40th-anniversary spot, told in twenty seconds." } },
        { nome: { pt: "Conteúdo para redes", en: "Social content" }, corpo: { pt: "Séries, entrevistas, bastidores e vídeo vertical em cadência mensal, produzidos com a área de Social Media.", en: "Series, interviews, behind-the-scenes and vertical video on a monthly cadence, produced with the Social Media area." } },
        { nome: { pt: "Motion graphics e animação", en: "Motion graphics and animation" }, corpo: { pt: "Explicar um produto, um dado ou um processo em movimento, quando a câmara não chega lá.", en: "Explaining a product, a figure or a process in motion, where the camera can't reach." } },
        { nome: { pt: "Fotografia", en: "Photography" }, corpo: { pt: "Produto, equipa e ambiente, no estúdio ou no vosso espaço, para o site, as redes e a imprensa.", en: "Product, team and environment, in the studio or at your premises, for the website, social and press." } },
        { nome: { pt: "Versões e legendagem", en: "Versions and subtitling" }, corpo: { pt: "Cada peça sai em todos os formatos que a campanha pede, com legendas, sem som e com som, e com o ficheiro certo para cada plataforma.", en: "Every piece ships in all the formats the campaign needs, subtitled, with and without sound, and in the right file for each platform." } },
      ],
    },
    passos: {
      titulo: { pt: "Fases de produção e promoção", en: "Production and promotion phases" },
      itens: [
        { nome: { pt: "Pré-produção", en: "Pre-production" }, corpo: { pt: "Storytelling, guião, storyboard, casting e planeamento. É aqui que se decide o que o vídeo tem de fazer acontecer.", en: "Storytelling, script, storyboard, casting and planning. This is where we decide what the video has to make happen." } },
        { nome: { pt: "Produção", en: "Production" }, corpo: { pt: "Filmagem no nosso estúdio ou em exterior, com equipa e equipamento próprios. Um dia bem planeado rende para um trimestre.", en: "Shooting in our studio or on location, with our own crew and equipment. One well-planned day feeds a quarter." } },
        { nome: { pt: "Pós-produção", en: "Post-production" }, corpo: { pt: "Montagem, cor, som, grafismo e legendas. E as versões: um master, e dele tudo o que cada canal pede.", en: "Editing, colour, sound, graphics and subtitles. And the versions: one master, and from it everything each channel needs." } },
        { nome: { pt: "Divulgação e leitura", en: "Distribution and reading" }, corpo: { pt: "O vídeo entra na campanha e é lido pelo que faz: retenção, cliques, leads. O que retém mais ganha mais orçamento.", en: "The video goes into the campaign and is read by what it does: retention, clicks, leads. What retains best earns more budget." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Têm estúdio próprio?", en: "Do you have your own studio?" }, resposta: { pt: "Sim, para vídeo e fotografia, com equipa e equipamento nossos. Filmamos também em exterior e nas instalações do cliente.", en: "Yes, for video and photography, with our own crew and equipment. We also shoot on location and at the client's premises." } },
      { pergunta: { pt: "Quanto tempo leva um vídeo?", en: "How long does a video take?" }, resposta: { pt: "Uma série de peças curtas para performance faz-se em duas a três semanas. Um spot ou institucional, entre quatro e oito, conforme o guião e as filmagens.", en: "A series of short performance pieces takes two to three weeks. A spot or corporate film, four to eight, depending on script and shooting." } },
      { pergunta: { pt: "Fazem só o vídeo ou também o colocam a correr?", en: "Do you just make the video, or run it too?" }, resposta: { pt: "As duas coisas, e preferimos as duas: quem faz o vídeo aprende com o que ele faz em campanha, e a peça seguinte sai melhor.", en: "Both, and we prefer both: whoever makes the video learns from what it does in campaign, and the next piece comes out better." } },
      { pergunta: { pt: "E se já tivermos material filmado?", en: "What if we already have footage?" }, resposta: { pt: "Trabalhamo-lo. Muitas vezes há um arquivo bom à espera de montagem, versões e legendas.", en: "We work with it. There's often a good archive waiting for an edit, versions and subtitles." } },
    ],
    fecho: { titulo: { pt: "Tem uma história para contar em vinte segundos?", en: "Got a story to tell in twenty seconds?" }, texto: { pt: "Bem-vindo ao Jelly.Studio. Comece por nos dizer onde é que o vídeo vai correr.", en: "Welcome to Jelly.Studio. Start by telling us where the video will run." } },
  },

  {
    slug: { pt: "conteudo-editorial-inbound", en: "editorial-content-inbound" },
    area: "conteudo",
    nome: { pt: "Conteúdo editorial e Inbound", en: "Editorial content and Inbound" },
    titulo: { pt: "Responder ao que o mercado pergunta, antes de o mercado perguntar a outro.", en: "Answer what the market asks, before the market asks someone else." },
    claim: {
      pt: "Artigos, guias, newsletters e páginas que respondem à intenção de pesquisa e alimentam o SEO, o GEO e as jornadas de e-mail. Escrito por gente, com editor no fim.",
      en: "Articles, guides, newsletters and pages that answer search intent and feed SEO, GEO and email journeys. Written by people, with an editor at the end.",
    },
    descricao: {
      pt: "Conteúdo editorial e inbound marketing pela Jelly: calendário por intenção de pesquisa, artigos e guias, newsletters, páginas pilar e leitura por leads geradas, não por visitas.",
      en: "Editorial content and inbound marketing by Jelly: an intent-led calendar, articles and guides, newsletters, pillar pages and measurement by leads generated rather than visits.",
    },
    abertura: {
      titulo: { pt: "O conteúdo é o combustível", en: "Content is the fuel" },
      problema: [
        { pt: "O SEO sem conteúdo é canalização sem água. A automação sem conteúdo é um e-mail vazio. As redes sem conteúdo são um calendário. Quase tudo no marketing digital depende de haver alguma coisa que valha a pena ler.", en: "SEO without content is plumbing without water. Automation without content is an empty email. Social without content is a calendar. Almost everything in digital marketing depends on there being something worth reading." },
        { pt: "E agora há também os motores generativos, que respondem em vez de listar. Quem não escreve a resposta não é citado.", en: "And now there are generative engines, which answer instead of listing. Whoever doesn't write the answer doesn't get cited." },
      ],
      abordagem: [
        { pt: "Partimos do que o vosso cliente pergunta, na pesquisa, nas reuniões comerciais, no apoio ao cliente. Cada pergunta é uma peça, e cada peça tem um lugar no funil.", en: "We start from what your customer asks, in search, in sales meetings, in customer support. Each question is a piece, and each piece has a place in the funnel." },
        { pt: "Escrevemos com gente que sabe do assunto, usamos a IA onde acelera e nunca onde substitui o juízo, e lemos pelo que interessa: leads, subscrições, citações. As visitas são o caminho, não o destino.", en: "We write with people who know the subject, use AI where it speeds things up and never where it replaces judgement, and read by what matters: leads, subscriptions, citations. Visits are the path, not the destination." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que produzimos", en: "What we produce" },
      itens: [
        { nome: { pt: "Calendário por intenção", en: "Intent-led calendar" }, corpo: { pt: "Temas ordenados pela procura real e pelo valor comercial, agrupados em clusters. Sabe-se o que se escreve nos próximos três meses e porquê.", en: "Topics ranked by real demand and commercial value, grouped in clusters. You know what gets written over the next three months and why." } },
        { nome: { pt: "Artigos e guias", en: "Articles and guides" }, corpo: { pt: "Peças longas que respondem por inteiro, com dados, exemplos e fontes. O tipo de texto que um motor generativo cita.", en: "Long pieces that answer in full, with data, examples and sources. The kind of text a generative engine cites." } },
        { nome: { pt: "Páginas pilar", en: "Pillar pages" }, corpo: { pt: "Uma página por tema que a marca quer dominar, ligada a tudo o que se escreveu sobre ele. Como as que estão neste site.", en: "One page per topic the brand wants to own, linked to everything written about it. Like the ones on this site." } },
        { nome: { pt: "Newsletters", en: "Newsletters" }, corpo: { pt: "Uma razão para escrever à vossa lista todos os meses que não seja uma promoção. Lidas pela taxa de resposta, não só pela abertura.", en: "A reason to write to your list every month that isn't a promotion. Read by reply rate, not just opens." } },
        { nome: { pt: "Conteúdo comercial", en: "Sales content" }, corpo: { pt: "Casos, comparativos, calculadoras e FAQs para a fase final da decisão, escritos com a equipa comercial.", en: "Cases, comparisons, calculators and FAQs for the final stage of the decision, written with the sales team." } },
        { nome: { pt: "Edição e governance", en: "Editing and governance" }, corpo: { pt: "Guia de estilo, revisão, atualização de frescura e regras claras para o uso de IA. Cada texto tem um autor e um editor.", en: "Style guide, review, freshness updates and clear rules for AI use. Every text has an author and an editor." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se monta", en: "How it comes together" },
      itens: [
        { nome: { pt: "Ouvir", en: "Listen" }, corpo: { pt: "Pesquisa de intenção, conversas com a equipa comercial e o apoio ao cliente. As perguntas verdadeiras estão aí, não numa ferramenta.", en: "Intent research, conversations with sales and customer support. The real questions live there, not in a tool." } },
        { nome: { pt: "Ordenar", en: "Prioritise" }, corpo: { pt: "O calendário do trimestre: o que se escreve primeiro pelo valor e pela procura, o que fica para depois.", en: "The quarter's calendar: what gets written first by value and demand, what waits." } },
        { nome: { pt: "Escrever e editar", en: "Write and edit" }, corpo: { pt: "Autor, editor, revisão do especialista quando o tema pede. Marcação e ligação interna feitas com a área de SEO e GEO.", en: "Author, editor, specialist review when the topic calls for it. Markup and internal linking done with the SEO and GEO area." } },
        { nome: { pt: "Distribuir e ler", en: "Distribute and read" }, corpo: { pt: "Cada peça sai para as redes, a newsletter e as jornadas de e-mail. Ao fim de um trimestre, lê-se o que trouxe leads e o que trouxe só visitas.", en: "Each piece goes out to social, the newsletter and email journeys. After a quarter, we read what brought leads and what brought only visits." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Usam IA para escrever?", en: "Do you use AI to write?" }, resposta: { pt: "Usamos para pesquisar, estruturar e rever, e dizemos onde. O texto final é de um autor com nome e passa por um editor. Um texto que qualquer um podia gerar não merece ser lido nem citado.", en: "We use it to research, structure and review, and we say where. The final text belongs to a named author and goes through an editor. Text anyone could generate deserves neither to be read nor cited." } },
      { pergunta: { pt: "Quantas peças por mês?", en: "How many pieces a month?" }, resposta: { pt: "Depende do tema e da ambição, mas o típico são duas a quatro peças longas e uma newsletter. Menos, bem feito, vale mais do que muito, esquecível.", en: "It depends on the topic and the ambition, but typically two to four long pieces and one newsletter. Fewer, done well, is worth more than many, forgettable." } },
      { pergunta: { pt: "Como medem o resultado?", en: "How do you measure results?" }, resposta: { pt: "Por leads e subscrições atribuídas ao conteúdo, por citações em motores generativos e pela posição nos temas escolhidos. As visitas ficam no relatório, mas não mandam.", en: "By leads and subscriptions attributed to content, by citations in generative engines and by ranking on the chosen topics. Visits stay in the report, but they don't rule." } },
      { pergunta: { pt: "Podem escrever sobre um setor técnico que não conhecem?", en: "Can you write about a technical sector you don't know?" }, resposta: { pt: "Sim, com o vosso especialista ao lado: uma hora de conversa por peça rende mais do que um dia de pesquisa. O texto sai com a voz da casa e o rigor de quem sabe.", en: "Yes, with your specialist alongside: an hour of conversation per piece is worth more than a day of research. The text comes out in the brand's voice with the rigour of someone who knows." } },
    ],
    fecho: { titulo: { pt: "Quer ser a resposta em vez de mais um resultado?", en: "Want to be the answer instead of another result?" }, texto: { pt: "Comece por nos enviar as dez perguntas que os vossos clientes mais fazem.", en: "Start by sending us the ten questions your customers ask most." } },
  },

  {
    slug: { pt: "influencers-creators-ugc", en: "influencers-creators-ugc" },
    area: "influencia",
    nome: { pt: "Influencers e Creators (UGC)", en: "Influencers and Creators (UGC)" },
    titulo: { pt: "A recomendação de quem já tem a atenção do seu público.", en: "A recommendation from those who already have your audience's attention." },
    claim: {
      pt: "Criadores escolhidos por afinidade e medidos por efeito, não por seguidores. Seleção, briefing, contratos, produção e medição, com o conteúdo a servir também as campanhas pagas.",
      en: "Creators chosen by affinity and measured by effect, not followers. Selection, briefing, contracts, production and measurement, with content that also feeds paid campaigns.",
    },
    descricao: {
      pt: "Influencer marketing e UGC pela Jelly: seleção de criadores por afinidade, briefing, contratos e direitos, produção de conteúdo de criadores para campanhas e medição por vendas e leads.",
      en: "Influencer marketing and UGC by Jelly: creator selection by affinity, briefing, contracts and rights, creator content for campaigns, and measurement by sales and leads.",
    },
    abertura: {
      titulo: { pt: "Seguidores não se convertem. Confiança sim.", en: "Followers don't convert. Trust does." },
      problema: [
        { pt: "A forma mais comum de fazer influencer marketing é pagar a quem tem mais seguidores para dizer uma frase que nunca diria. O público percebe, e o efeito dura o que dura o post.", en: "The most common way to do influencer marketing is to pay whoever has the most followers to say a line they'd never say. Audiences notice, and the effect lasts as long as the post." },
        { pt: "E o conteúdo fica preso ao perfil do criador: um vídeo bom, visto uma vez, sem direitos para o usar onde converteria.", en: "And the content stays locked in the creator's profile: a good video, seen once, with no rights to use it where it would convert." },
      ],
      abordagem: [
        { pt: "Escolhemos por afinidade: criadores que já falam do vosso tema para o vosso público, mesmo que sejam pequenos. Um criador com dez mil seguidores certos vale mais do que um com um milhão errados.", en: "We choose by affinity: creators who already talk about your topic to your audience, even if they're small. A creator with ten thousand right followers is worth more than one with a million wrong ones." },
        { pt: "E tratamos o conteúdo de criadores como matéria-prima: com direitos negociados, entra nas campanhas pagas, no site e nas redes da marca. É aí que o UGC paga o que custou.", en: "And we treat creator content as raw material: with rights negotiated, it goes into paid campaigns, the website and the brand's own channels. That's where UGC pays for itself." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que gerimos", en: "What we manage" },
      itens: [
        { nome: { pt: "Seleção por afinidade", en: "Affinity-led selection" }, corpo: { pt: "Pesquisa de criadores pelo tema e pelo público, com verificação de audiência real, tom e histórico de marcas.", en: "Creator research by topic and audience, with checks on real audience, tone and brand history." } },
        { nome: { pt: "Briefing e contratos", en: "Briefing and contracts" }, corpo: { pt: "Um briefing que deixa espaço à voz do criador, e contratos com direitos de uso, exclusividade e prazos claros.", en: "A brief that leaves room for the creator's voice, and contracts with clear usage rights, exclusivity and timelines." } },
        { nome: { pt: "UGC para campanhas", en: "UGC for campaigns" }, corpo: { pt: "Conteúdo de criadores produzido especificamente para correr como anúncio, em séries de variantes para testar na área de Paid Media.", en: "Creator content produced specifically to run as ads, in series of variants to test in the Paid Media area." } },
        { nome: { pt: "Programas de embaixadores", en: "Ambassador programmes" }, corpo: { pt: "Relações de longo prazo com poucos criadores certos, em vez de campanhas soltas com muitos. É mais barato e mais credível.", en: "Long-term relationships with a few right creators, instead of one-off campaigns with many. Cheaper and more credible." } },
        { nome: { pt: "Gestão e produção", en: "Management and production" }, corpo: { pt: "Calendário, aprovações, envios, pagamentos e apoio de produção do nosso estúdio quando o criador precisa.", en: "Calendar, approvals, shipments, payments and production support from our studio when the creator needs it." } },
        { nome: { pt: "Medição", en: "Measurement" }, corpo: { pt: "Códigos, links e landing pages por criador. Lê-se em vendas e leads, com o alcance como contexto e não como resultado.", en: "Codes, links and landing pages per creator. Read in sales and leads, with reach as context rather than result." } },
      ],
    },
    passos: {
      titulo: { pt: "Como corre uma campanha", en: "How a campaign runs" },
      itens: [
        { nome: { pt: "Mapa de criadores", en: "Creator map" }, corpo: { pt: "Quem fala do vosso tema para o vosso público, em que redes, com que tom. Uma lista curta e verificada, não um catálogo.", en: "Who talks about your topic to your audience, on which networks, in what tone. A short, verified list, not a catalogue." } },
        { nome: { pt: "Briefing e acordo", en: "Brief and agreement" }, corpo: { pt: "O que a marca precisa de dizer, o que o criador quer dizer, e onde as duas coisas se encontram. Direitos e prazos fechados por escrito.", en: "What the brand needs to say, what the creator wants to say, and where the two meet. Rights and deadlines closed in writing." } },
        { nome: { pt: "Produção e publicação", en: "Production and publishing" }, corpo: { pt: "O criador produz, a marca aprova o essencial e não o resto, e o conteúdo sai no perfil dele e entra nos canais da marca.", en: "The creator produces, the brand approves the essentials and not the rest, and the content goes out on their profile and into the brand's channels." } },
        { nome: { pt: "Ler e repetir", en: "Read and repeat" }, corpo: { pt: "Quem trouxe vendas continua e passa a embaixador. Quem trouxe só alcance sai da lista.", en: "Whoever brought sales continues and becomes an ambassador. Whoever brought only reach leaves the list." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Trabalham com micro-influenciadores?", en: "Do you work with micro-influencers?" }, resposta: { pt: "De preferência. Têm audiências mais próximas, taxas de envolvimento mais altas e custam menos por resultado. Os grandes entram quando o objetivo é notoriedade e há orçamento para isso.", en: "Preferably. They have closer audiences, higher engagement and cost less per result. Big names come in when the goal is awareness and there's budget for it." } },
      { pergunta: { pt: "Os criadores são pagos por post ou por resultado?", en: "Are creators paid per post or per result?" }, resposta: { pt: "Normalmente um valor fixo pelo conteúdo e pelos direitos, e um variável por vendas quando o produto o permite. O contrato diz tudo antes de se filmar o que quer que seja.", en: "Usually a fixed fee for the content and rights, plus a variable on sales when the product allows. The contract says everything before anything is filmed." } },
      { pergunta: { pt: "A marca controla o que o criador diz?", en: "Does the brand control what the creator says?" }, resposta: { pt: "Controla o essencial: o que não pode ser dito, o que tem de aparecer, as regras legais de publicidade. O resto é a voz do criador, e é por ela que o público confia.", en: "It controls the essentials: what can't be said, what must appear, the advertising rules. The rest is the creator's voice, and that's why the audience trusts them." } },
      { pergunta: { pt: "Como é que isto se mede em vendas?", en: "How is this measured in sales?" }, resposta: { pt: "Com códigos e links próprios por criador, landing pages dedicadas e a leitura no CRM ou na loja. Quando o produto se vende em loja física, usamos inquéritos de origem e picos de procura por marca.", en: "With creator-specific codes and links, dedicated landing pages and reading in the CRM or the store. For products sold in physical retail, we use source surveys and branded-search spikes." } },
    ],
    fecho: { titulo: { pt: "Quer que falem da sua marca quem já é ouvido?", en: "Want your brand talked about by those already listened to?" }, texto: { pt: "Começa por um mapa de criadores do vosso tema. Leva duas semanas e não obriga a nada.", en: "It starts with a creator map for your topic. Two weeks, no commitment." } },
  },

  {
    slug: { pt: "digital-pr-assessoria-imprensa", en: "digital-pr-media-relations" },
    area: "influencia",
    nome: { pt: "Digital PR e Assessoria de Imprensa", en: "Digital PR and Media Relations" },
    titulo: { pt: "Aparecer onde a marca não paga para aparecer.", en: "Appearing where the brand doesn't pay to appear." },
    claim: {
      pt: "Press releases, relações com jornalistas e presença em publicações que o público lê e os motores de busca também. A reputação que se merece, e o SEO que vem com ela.",
      en: "Press releases, relationships with journalists and presence in publications your audience reads and search engines read too. Reputation earned, and the SEO that comes with it.",
    },
    descricao: {
      pt: "Digital PR e assessoria de imprensa pela Jelly: press releases, relações com os media, estudos e dados que dão notícia, gestão de crise e ligações de autoridade que também servem o SEO.",
      en: "Digital PR and media relations by Jelly: press releases, media relations, studies and data that make news, crisis handling and authority links that also serve SEO.",
    },
    abertura: {
      titulo: { pt: "Reputação é o que dizem quando não pagamos", en: "Reputation is what they say when we aren't paying" },
      problema: [
        { pt: "Um anúncio diz o que a marca quer. Uma notícia diz o que um jornalista achou que valia a pena contar. O público sabe a diferença, e os motores de busca também: uma referência num jornal vale por cem anúncios na autoridade de um site.", en: "An ad says what the brand wants. A news story says what a journalist thought worth telling. The public knows the difference, and so do search engines: one mention in a newspaper is worth a hundred ads to a site's authority." },
        { pt: "A maioria das empresas só fala com a imprensa quando lança um produto ou quando algo corre mal. Nas duas situações, chega tarde.", en: "Most companies only talk to the press when they launch a product or when something goes wrong. In both cases, too late." },
      ],
      abordagem: [
        { pt: "Trabalhamos a relação antes da notícia: quem escreve sobre o vosso setor, o que lhes interessa, que dados e histórias a marca tem que ninguém mais tem. E produzimo-las, com estudos, opinião e casos.", en: "We work the relationship before the news: who writes about your sector, what interests them, what data and stories the brand has that nobody else does. And we produce them, with studies, opinion and cases." },
        { pt: "E ligamos a imprensa ao digital: cada peça publicada é uma ligação de autoridade, uma citação possível num motor generativo e um conteúdo para as redes. Assessoria de imprensa e SEO são hoje o mesmo trabalho.", en: "And we tie press to digital: every published piece is an authority link, a possible citation in a generative engine and content for social. Media relations and SEO are the same job today." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que fazemos pela reputação", en: "What we do for reputation" },
      itens: [
        { nome: { pt: "Assessoria de imprensa", en: "Media relations" }, corpo: { pt: "Press releases que dão notícia, contactos certos por tema, acompanhamento e clipping. Sem enviar o mesmo e-mail a duzentos jornalistas.", en: "Press releases that make news, the right contacts per topic, follow-up and clipping. Without sending the same email to two hundred journalists." } },
        { nome: { pt: "Histórias e dados", en: "Stories and data" }, corpo: { pt: "Estudos, barómetros e opinião assinada pelos vossos especialistas. É o que a imprensa publica quando não há produto novo.", en: "Studies, barometers and opinion signed by your experts. It's what the press publishes when there's no new product." } },
        { nome: { pt: "Digital PR", en: "Digital PR" }, corpo: { pt: "Presença em publicações online, diretórios de referência e podcasts do setor, com as ligações que dão autoridade ao site. Trabalhado com a área de SEO e GEO.", en: "Presence in online publications, reference directories and sector podcasts, with the links that give the site authority. Worked with the SEO and GEO area." } },
        { nome: { pt: "Porta-vozes", en: "Spokespeople" }, corpo: { pt: "Preparação de quem fala pela marca: mensagens, treino de entrevista e perfil público nas redes profissionais.", en: "Preparing those who speak for the brand: messages, interview training and a public profile on professional networks." } },
        { nome: { pt: "Prémios e eventos", en: "Awards and events" }, corpo: { pt: "Candidaturas a prémios do setor e presença em eventos que a imprensa cobre. Como os Heróis PME, de que a Jelly é agência parceira.", en: "Entries to sector awards and presence at events the press covers. Like Heróis PME, where Jelly is the partner agency." } },
        { nome: { pt: "Gestão de crise", en: "Crisis handling" }, corpo: { pt: "Um plano antes de ser preciso, e uma equipa disponível quando for. O que se diz, quem diz e em quanto tempo.", en: "A plan before it's needed, and a team available when it is. What is said, who says it and how fast." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se constrói", en: "How it's built" },
      itens: [
        { nome: { pt: "Mapa de media", en: "Media map" }, corpo: { pt: "Quem escreve sobre o vosso setor, onde e para quem. E o que a marca já tem de histórias, dados e pessoas com opinião.", en: "Who writes about your sector, where and for whom. And what the brand already has in stories, data and people with opinions." } },
        { nome: { pt: "Agenda", en: "Agenda" }, corpo: { pt: "Um calendário de seis meses: os momentos da marca, os do setor e os que se criam com estudos e opinião.", en: "A six-month calendar: the brand's moments, the sector's, and the ones created with studies and opinion." } },
        { nome: { pt: "Relação", en: "Relationship" }, corpo: { pt: "Contacto regular com os jornalistas certos, com valor antes de pedir espaço. É o que faz a diferença quando a notícia chega.", en: "Regular contact with the right journalists, offering value before asking for space. It's what makes the difference when the news arrives." } },
        { nome: { pt: "Ler e amplificar", en: "Read and amplify" }, corpo: { pt: "Cada peça publicada é medida em alcance, autoridade e citações, e volta a sair nas redes e na newsletter da marca.", en: "Every published piece is measured in reach, authority and citations, and goes back out on the brand's social and newsletter." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Garantem publicação?", en: "Do you guarantee publication?" }, resposta: { pt: "Ninguém sério garante. Garantimos a história certa para o jornalista certo, no momento certo, e um histórico de publicação que podemos mostrar. Espaço pago é publicidade, e chama-se pelo nome.", en: "Nobody serious does. We guarantee the right story for the right journalist at the right time, and a publication track record we can show. Paid space is advertising, and we call it that." } },
      { pergunta: { pt: "Qual é a diferença entre digital PR e assessoria de imprensa?", en: "What's the difference between digital PR and media relations?" }, resposta: { pt: "A assessoria trabalha a relação com os jornalistas e a notícia. O digital PR trabalha a presença online da marca em publicações, diretórios e podcasts, com a autoridade de SEO que vem daí. Fazemos as duas, porque hoje uma sem a outra fica a meio.", en: "Media relations works the relationship with journalists and the news. Digital PR works the brand's online presence in publications, directories and podcasts, with the SEO authority that comes from it. We do both, because today one without the other stops halfway." } },
      { pergunta: { pt: "E se não tivermos nada de novo para anunciar?", en: "What if we have nothing new to announce?" }, resposta: { pt: "Quase nenhuma empresa tem, e é para isso que se criam histórias: um estudo com os vossos dados, uma opinião sobre o que muda no setor, um caso de cliente contado bem.", en: "Almost no company does, and that's why stories get created: a study with your data, an opinion on what's changing in the sector, a customer case told well." } },
      { pergunta: { pt: "Trabalham imprensa internacional?", en: "Do you handle international press?" }, resposta: { pt: "Trabalhamos a portuguesa e a especializada internacional do vosso setor. Para mercados inteiros lá fora, trabalhamos com parceiros locais e coordenamos a mensagem.", en: "We handle the Portuguese press and your sector's international specialist press. For whole markets abroad, we work with local partners and coordinate the message." } },
    ],
    fecho: { titulo: { pt: "Que história tem a sua marca que ninguém contou ainda?", en: "What story does your brand have that nobody has told yet?" }, texto: { pt: "Conte-nos a nós primeiro. Se der notícia, sabemos a quem a levar.", en: "Tell us first. If it's news, we know who to take it to." } },
  },

  {
    slug: { pt: "marketing-automation-lifecycle", en: "marketing-automation-lifecycle" },
    area: "dados",
    nome: { pt: "Marketing Automation e Lifecycle", en: "Marketing Automation and Lifecycle" },
    titulo: { pt: "O que acontece com uma lead às três da manhã decide o que acontece com ela às nove.", en: "What happens to a lead at three in the morning decides what happens to it at nine." },
    claim: {
      pt: "E-mail, nurturing e jornadas ligadas ao CRM: cada contacto tratado como se fosse o único, pela equipa e pelo sistema, do primeiro clique à renovação.",
      en: "Email, nurturing and journeys wired to the CRM: every contact treated as if it were the only one, by the team and by the system, from first click to renewal.",
    },
    descricao: {
      pt: "Marketing automation e lifecycle pela Jelly: jornadas de e-mail e mensagens ligadas ao CRM, lead scoring, nurturing, onboarding e retenção, em Brevo, Mailchimp, HubSpot, Pipedrive ou HighLevel.",
      en: "Marketing automation and lifecycle by Jelly: email and messaging journeys wired to the CRM, lead scoring, nurturing, onboarding and retention, on Brevo, Mailchimp, HubSpot, Pipedrive or HighLevel.",
    },
    abertura: {
      titulo: { pt: "A maior parte do funil acontece depois do clique", en: "Most of the funnel happens after the click" },
      problema: [
        { pt: "Uma empresa gasta meses e milhares de euros a trazer uma lead até ao formulário. Depois, a lead recebe um e-mail automático de agradecimento e mais nada durante três semanas, até um comercial ter tempo.", en: "A company spends months and thousands of euros bringing a lead to the form. Then the lead gets an automatic thank-you email and nothing for three weeks, until a salesperson has time." },
        { pt: "E os clientes que já compraram? Ficam numa lista, a receber a mesma newsletter que os que nunca compraram. A base de dados é o ativo de marketing mais caro e mais desperdiçado da maioria das empresas.", en: "And the customers who already bought? They sit on a list, receiving the same newsletter as those who never did. The database is the most expensive and most wasted marketing asset in most companies." },
      ],
      abordagem: [
        { pt: "Desenhamos o ciclo de vida inteiro: o que cada contacto recebe, quando e porquê, desde o primeiro clique até à compra, à renovação e à recomendação. E automatizamos o que deve ser automático, para a equipa ficar com o que precisa de gente.", en: "We design the whole lifecycle: what each contact receives, when and why, from first click to purchase, renewal and referral. And we automate what should be automatic, so the team keeps what needs a human." },
        { pt: "Tudo ligado ao CRM, para a jornada saber o que o comercial fez e o comercial saber o que a jornada fez. É este o pilar que cumpre a promessa da casa: otimizar o que acontece depois do clique.", en: "All wired to the CRM, so the journey knows what sales did and sales knows what the journey did. This is the pillar that delivers the house promise: optimising what happens after the click." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que construímos", en: "What we build" },
      itens: [
        { nome: { pt: "Jornadas de nurturing", en: "Nurturing journeys" }, corpo: { pt: "Sequências que educam e qualificam uma lead até estar pronta para uma conversa, com conteúdo da área editorial e paragens quando o comercial entra.", en: "Sequences that educate and qualify a lead until it's ready for a conversation, with content from the editorial area and pauses when sales steps in." } },
        { nome: { pt: "Lead scoring", en: "Lead scoring" }, corpo: { pt: "Uma pontuação por comportamento e perfil que diz ao comercial com quem falar primeiro. Afinada todos os meses contra os negócios ganhos.", en: "A score by behaviour and profile that tells sales who to call first. Tuned monthly against deals won." } },
        { nome: { pt: "Onboarding e ativação", en: "Onboarding and activation" }, corpo: { pt: "Os primeiros trinta dias de um cliente novo, desenhados para que use o que comprou. É onde se decide se renova.", en: "A new customer's first thirty days, designed so they use what they bought. It's where renewal is decided." } },
        { nome: { pt: "Retenção e recuperação", en: "Retention and win-back" }, corpo: { pt: "Sinais de abandono, carrinhos deixados, renovações a vencer e clientes silenciosos, cada um com a sua jornada.", en: "Churn signals, abandoned carts, renewals coming due and silent customers, each with its own journey." } },
        { nome: { pt: "Ligação ao CRM", en: "CRM integration" }, corpo: { pt: "Brevo, Mailchimp, HubSpot, Pipedrive, HighLevel ou o que já usam, ligados entre si e ao site. Um contacto, um registo, uma verdade.", en: "Brevo, Mailchimp, HubSpot, Pipedrive, HighLevel or whatever you already use, connected to each other and to the site. One contact, one record, one truth." } },
        { nome: { pt: "Consentimento e entregabilidade", en: "Consent and deliverability" }, corpo: { pt: "RGPD, autenticação do domínio, higiene da lista. Um e-mail que não chega ou que não podia ser enviado não é automação, é risco.", en: "GDPR, domain authentication, list hygiene. An email that doesn't arrive or shouldn't have been sent isn't automation, it's risk." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se implementa", en: "How it's implemented" },
      itens: [
        { nome: { pt: "Mapa do ciclo de vida", en: "Lifecycle map" }, corpo: { pt: "Todos os momentos entre o primeiro contacto e a recomendação, o que acontece hoje em cada um, e onde se perde gente.", en: "Every moment between first contact and referral, what happens today at each, and where people are lost." } },
        { nome: { pt: "Dados e ligações", en: "Data and connections" }, corpo: { pt: "Campos, eventos e integrações entre site, CRM e ferramenta de e-mail. Sem isto, a jornada mais bonita envia a mensagem errada à pessoa errada.", en: "Fields, events and integrations between site, CRM and email tool. Without this, the prettiest journey sends the wrong message to the wrong person." } },
        { nome: { pt: "Primeiras jornadas", en: "First journeys" }, corpo: { pt: "Duas ou três, onde o dinheiro se perde mais depressa: a resposta à lead nova e a recuperação dos que ficaram a meio. Ao vivo em quatro a seis semanas.", en: "Two or three, where money leaks fastest: the response to a new lead and win-back for those who stopped halfway. Live in four to six weeks." } },
        { nome: { pt: "Ler e alargar", en: "Read and extend" }, corpo: { pt: "Cada jornada lida por conversão, não por abertura. O que funciona alarga-se ao resto do ciclo, uma jornada de cada vez.", en: "Every journey read by conversion, not opens. What works extends to the rest of the cycle, one journey at a time." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Com que ferramentas trabalham?", en: "Which tools do you work with?" }, resposta: { pt: "Somos parceiros Brevo, Mailchimp, Pipedrive e HighLevel, e trabalhamos com HubSpot e outros. Recomendamos pela dimensão e pelo que a equipa vai usar de facto, não pelo catálogo.", en: "We are Brevo, Mailchimp, Pipedrive and HighLevel partners, and work with HubSpot and others. We recommend by size and by what the team will actually use, not by catalogue." } },
      { pergunta: { pt: "Isto não vai parecer robótico para os clientes?", en: "Won't this feel robotic to customers?" }, resposta: { pt: "Parece robótico quando é genérico. Uma mensagem no momento certo, com o contexto certo, parece atenção. E quando é preciso uma pessoa, a jornada para e passa a vez.", en: "It feels robotic when it's generic. A message at the right moment, with the right context, feels like attention. And when a person is needed, the journey stops and hands over." } },
      { pergunta: { pt: "Quanto tempo até estar a funcionar?", en: "How long until it's running?" }, resposta: { pt: "As primeiras jornadas ficam ao vivo em quatro a seis semanas. O ciclo de vida completo constrói-se ao longo de seis meses, uma jornada de cada vez, medindo cada uma.", en: "The first journeys go live in four to six weeks. The full lifecycle is built over six months, one journey at a time, measuring each." } },
      { pergunta: { pt: "E a IA entra aqui?", en: "Does AI come into this?" }, resposta: { pt: "Entra onde decide melhor do que uma regra: escolher o próximo toque, resumir a conversa para o comercial, qualificar uma lead por chat. Está na página de pré-qualificação de leads com agentes de IA.", en: "Where it decides better than a rule: choosing the next touch, summarising the conversation for sales, qualifying a lead via chat. See the AI-agent lead pre-qualification page." } },
    ],
    fecho: { titulo: { pt: "Quanto vale a lead que ficou sem resposta ontem à noite?", en: "What was last night's unanswered lead worth?" }, texto: { pt: "Comece por um mapa do vosso ciclo de vida. Mostra onde o dinheiro se perde antes de gastar mais a trazê-lo.", en: "Start with a map of your lifecycle. It shows where money leaks before spending more to bring it in." } },
  },

  {
    slug: { pt: "analytics-atribuicao-cro", en: "analytics-attribution-cro" },
    area: "dados",
    nome: { pt: "Analytics, Atribuição e CRO", en: "Analytics, Attribution and CRO" },
    titulo: { pt: "O número de partida, e o que o faz mexer.", en: "The starting number, and what makes it move." },
    claim: {
      pt: "Medição limpa, atribuição honesta e testes na página. É a linha de base de tudo o que fazemos, e um serviço por si quando a casa já tem quem faça o resto.",
      en: "Clean measurement, honest attribution and on-page testing. It's the baseline of everything we do, and a service in its own right when you already have people for the rest.",
    },
    descricao: {
      pt: "Analytics, atribuição e otimização de conversão pela Jelly: implementação de GA4 e eventos, consent mode, conversões offline, modelos de atribuição, dashboards e testes A/B nas páginas que convertem.",
      en: "Analytics, attribution and conversion optimisation by Jelly: GA4 and event implementation, consent mode, offline conversions, attribution models, dashboards and A/B tests on the pages that convert.",
    },
    abertura: {
      titulo: { pt: "Não se otimiza o que se mede mal", en: "You can't optimise what you measure badly" },
      problema: [
        { pt: "A maioria dos painéis de marketing mede o que a ferramenta mede por defeito: sessões, cliques, formulários enviados. O que a direção quer saber, quanto custou a venda e de onde veio, não está lá, ou está errado.", en: "Most marketing dashboards measure what the tool measures by default: sessions, clicks, forms sent. What leadership wants to know, what the sale cost and where it came from, isn't there, or is wrong." },
        { pt: "E cada canal reclama a mesma venda. Somadas as atribuições das plataformas, a empresa vendeu o dobro do que faturou.", en: "And every channel claims the same sale. Add up the platforms' attributions and the company sold twice what it invoiced." },
      ],
      abordagem: [
        { pt: "Começamos pelo número que interessa, definido com a direção comercial, e construímos a medição de trás para a frente: eventos, conversões offline do CRM, consentimento e um modelo de atribuição que se possa defender numa reunião.", en: "We start from the number that matters, agreed with sales leadership, and build measurement backwards from it: events, offline conversions from the CRM, consent and an attribution model you can defend in a meeting." },
        { pt: "Depois, testamos as páginas onde a conversão acontece. Um formulário mais curto ou um título mais claro rendem tantas vezes mais do que mais orçamento em media, e custam uma fração.", en: "Then we test the pages where conversion happens. A shorter form or a clearer headline often yields more than extra media budget, at a fraction of the cost." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que instalamos e o que testamos", en: "What we install and what we test" },
      itens: [
        { nome: { pt: "Plano de medição", en: "Measurement plan" }, corpo: { pt: "Os eventos que interessam, com nome, definição e dono. Um documento que sobrevive à mudança de agência e de ferramenta.", en: "The events that matter, with name, definition and owner. A document that outlives changes of agency and tool." } },
        { nome: { pt: "Implementação", en: "Implementation" }, corpo: { pt: "GA4, Tag Manager server-side, consent mode, conversões offline do CRM. Feito para o dado ser fiável antes de ser bonito.", en: "GA4, server-side Tag Manager, consent mode, offline conversions from the CRM. Built for the data to be reliable before it's pretty." } },
        { nome: { pt: "Atribuição", en: "Attribution" }, corpo: { pt: "Um modelo escolhido pelo vosso ciclo de venda, e a leitura honesta do que cada canal traz, incluindo o que nenhuma plataforma reclama.", en: "A model chosen for your sales cycle, and an honest read of what each channel brings, including what no platform claims." } },
        { nome: { pt: "Dashboards", en: "Dashboards" }, corpo: { pt: "Um painel por decisão: o da direção, o da equipa de media, o do comercial. Poucas métricas, as que mudam alguma coisa.", en: "One dashboard per decision: leadership's, the media team's, sales'. Few metrics, the ones that change something." } },
        { nome: { pt: "CRO: testes na página", en: "CRO: on-page testing" }, corpo: { pt: "Hipóteses ordenadas por impacto, testes A/B nas páginas que convertem, e a disciplina de deixar o teste acabar antes de decidir.", en: "Hypotheses ranked by impact, A/B tests on the pages that convert, and the discipline to let the test finish before deciding." } },
        { nome: { pt: "Auditorias", en: "Audits" }, corpo: { pt: "O estado da medição atual, o que está partido e o que está a mentir. É por aqui que quase todos os projetos começam.", en: "The state of current measurement, what's broken and what's lying. This is where almost every project starts." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se faz", en: "How it's done" },
      itens: [
        { nome: { pt: "Auditoria", en: "Audit" }, corpo: { pt: "O que está a ser medido, como, e o que não bate certo com a faturação. Em duas semanas, um relatório sem rodeios.", en: "What's being measured, how, and what doesn't reconcile with invoicing. In two weeks, a report with no hedging." } },
        { nome: { pt: "Plano e implementação", en: "Plan and implementation" }, corpo: { pt: "O plano de medição acordado com a direção comercial, e a implementação limpa, com testes antes de ligar.", en: "The measurement plan agreed with sales leadership, and a clean implementation, tested before going live." } },
        { nome: { pt: "Linha de base", en: "Baseline" }, corpo: { pt: "Quatro semanas de dados fiáveis. O número de partida, por canal e por página, de que tudo o resto se mede.", en: "Four weeks of reliable data. The starting number, by channel and by page, against which everything else is measured." } },
        { nome: { pt: "Testar e melhorar", en: "Test and improve" }, corpo: { pt: "Um teste de cada vez nas páginas que convertem, com o resultado a entrar no painel e a mudar a página seguinte.", en: "One test at a time on the pages that convert, with results going into the dashboard and shaping the next page." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Já temos Google Analytics. Isto não é a mesma coisa?", en: "We already have Google Analytics. Isn't this the same thing?" }, resposta: { pt: "Ter a ferramenta instalada e medir bem são coisas diferentes. Na maioria das auditorias encontramos conversões duplicadas, eventos sem definição e nenhuma ligação ao que foi faturado.", en: "Having the tool installed and measuring well are different things. In most audits we find duplicate conversions, undefined events and no link to what was invoiced." } },
      { pergunta: { pt: "Que modelo de atribuição usam?", en: "Which attribution model do you use?" }, resposta: { pt: "O que fizer sentido para o vosso ciclo de venda, e dizemos porquê. Para ciclos longos B2B, o último clique mente; para compras por impulso, chega. O importante é que o modelo se explique numa frase.", en: "Whichever fits your sales cycle, and we say why. For long B2B cycles, last click lies; for impulse purchases, it's fine. What matters is that the model can be explained in one sentence." } },
      { pergunta: { pt: "Quanto tráfego é preciso para fazer testes A/B?", en: "How much traffic is needed for A/B tests?" }, resposta: { pt: "Depende da conversão de partida. Com poucas centenas de conversões por mês testam-se mudanças grandes; com menos, faz-se pesquisa com utilizadores e mudanças fundamentadas, sem fingir estatística.", en: "It depends on the starting conversion rate. With a few hundred conversions a month you can test big changes; with fewer, you do user research and grounded changes, without pretending to statistics." } },
      { pergunta: { pt: "Trabalham com a nossa equipa de dados?", en: "Do you work with our data team?" }, resposta: { pt: "Sim, e de preferência: eles conhecem os sistemas, nós conhecemos o marketing. O plano de medição é o documento comum.", en: "Yes, and preferably: they know the systems, we know the marketing. The measurement plan is the shared document." } },
    ],
    fecho: { titulo: { pt: "Sabe quanto custou a última venda que fez?", en: "Do you know what your last sale cost?" }, texto: { pt: "Se a resposta demorar mais de um minuto, comece por uma auditoria de medição.", en: "If the answer takes more than a minute, start with a measurement audit." } },
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
