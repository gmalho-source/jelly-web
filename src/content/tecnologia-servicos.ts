import { servicoPorSlug, type PaginaDeServico } from "./pagina-de-servico";

/**
 * Os serviços de Tecnologia, um a um.
 *
 * A página-mãe é o mapa; estas são as quatro páginas para onde o mapa aponta.
 * O esqueleto é o das páginas de Marketing (`PaginaDeServico`): abertura em
 * duas colunas, o que fazemos, como trabalhamos, perguntas, fecho. Três vieram
 * do site antigo — web design, aplicações, consultoria e sistemas — e trazem o
 * que lá estava de bom, incluindo o JellyCARE; a de performance nasce aqui,
 * porque era a parte do trabalho que se fazia e não se dizia. Uma entrada nesta
 * lista é uma página: a rota, o mapa do site e a página-mãe leem daqui.
 *
 * Cada serviço é a sua própria área — o mapa tem quatro serviços, não quatro
 * áreas com serviços dentro — e por isso não há irmãos: o caminho de volta é a
 * página-mãe e os outros três.
 */

export type AreaDeTecnologia = "web" | "apps" | "dados" | "performance";
export type ServicoDeTecnologia = PaginaDeServico<AreaDeTecnologia>;

export const SERVICOS_DE_TECNOLOGIA: ServicoDeTecnologia[] = [
  {
    slug: { pt: "websites-ecommerce", en: "websites-ecommerce" },
    area: "web",
    nome: { pt: "Websites e Plataformas de E-commerce", en: "Websites and E-commerce Platforms" },
    titulo: { pt: "Um site que a equipa consegue editar, o Google consegue ler e o cliente consegue comprar.", en: "A site your team can edit, Google can read and your customer can buy from." },
    claim: {
      pt: "Sites institucionais, lojas online e plataformas à medida, construídos a partir do conteúdo e com a performance fixada antes do primeiro ecrã.",
      en: "Corporate sites, online stores and bespoke platforms, built from the content out and with the performance budget fixed before the first screen.",
    },
    descricao: {
      pt: "Criação de websites e lojas online pela Jelly: sites institucionais, e-commerce em Shopify, WooCommerce ou headless, e plataformas à medida. Arquitetura primeiro, performance fixada, migração sem perder tráfego.",
      en: "Website and online store development by Jelly: corporate sites, e-commerce on Shopify, WooCommerce or headless, and bespoke platforms. Architecture first, a fixed performance budget, migration without losing traffic.",
    },
    abertura: {
      titulo: { pt: "Porque é que tantos sites novos vendem menos do que os antigos", en: "Why so many new sites sell less than the old ones" },
      problema: [
        { pt: "A maioria dos projetos de website começa pelo ecrã: uma proposta visual, três rondas de opinião, e só depois alguém pergunta o que é que o site tem de fazer. O conteúdo chega no fim, a medição nunca chega, e a migração perde metade do tráfego orgânico que levou anos a ganhar.", en: "Most website projects start with the screen: a visual proposal, three rounds of opinion, and only then does someone ask what the site has to do. Content arrives last, measurement never arrives, and the migration loses half the organic traffic that took years to earn." },
        { pt: "E o site fica preso: cada alteração é um pedido à agência, cada campanha uma landing page nova, cada integração um remendo. Ao terceiro ano já ninguém quer tocar-lhe.", en: "And the site gets stuck: every change is a request to the agency, every campaign a new landing page, every integration a patch. By year three nobody wants to touch it." },
      ],
      abordagem: [
        { pt: "Começamos pela arquitetura: o mapa de conteúdo, os URLs, o modelo de dados e o que se vai medir. O design chega depois, e chega a um problema já resolvido.", en: "We start with the architecture: the content map, the URLs, the data model and what will be measured. Design comes after, and arrives at a problem already solved." },
        { pt: "Construímos em cima de um design system em código e de um CMS que a equipa edita sem nos ligar. E publicamos com o mapa de redirecionamentos feito e o tráfego medido antes e depois, para que o site novo herde o que o antigo conquistou.", en: "We build on a design system in code and a CMS the team edits without calling us. And we launch with the redirect map done and traffic measured before and after, so the new site inherits what the old one earned." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que entra num website da Jelly", en: "What goes into a Jelly website" },
      itens: [
        { nome: { pt: "Websites institucionais", en: "Corporate websites" }, corpo: { pt: "Estrutura de conteúdo, design system, CMS editável e SEO técnico de origem. Em Next.js com Payload, ou em WordPress quando é o que a casa já sabe usar.", en: "Content structure, design system, editable CMS and technical SEO from the start. In Next.js with Payload, or in WordPress when that is what the team already knows." } },
        { nome: { pt: "E-commerce", en: "E-commerce" }, corpo: { pt: "Shopify, WooCommerce ou headless, conforme o catálogo e a operação. Feed de produto limpo, checkout medido, faturação e stock ligados.", en: "Shopify, WooCommerce or headless, depending on catalogue and operations. A clean product feed, a measured checkout, invoicing and stock connected." } },
        { nome: { pt: "Plataformas à medida", en: "Bespoke platforms" }, corpo: { pt: "Portais de cliente, configuradores, leilões online, reservas. Quando o produto de série obriga a dobrar o negócio para caber.", en: "Customer portals, configurators, online auctions, bookings. When the off-the-shelf product forces the business to bend to fit." } },
        { nome: { pt: "Design system em código", en: "Design system in code" }, corpo: { pt: "Componentes reutilizáveis, tipografia e cor como variáveis. Uma landing page nova demora horas, não semanas.", en: "Reusable components, typography and colour as variables. A new landing page takes hours, not weeks." } },
        { nome: { pt: "Medição de origem", en: "Measurement from day one" }, corpo: { pt: "Eventos, consentimento e conversões definidos antes de abrir. Um site sem medição é um folheto caro.", en: "Events, consent and conversions defined before opening. A site without measurement is an expensive brochure." } },
        { nome: { pt: "Conformidade", en: "Compliance" }, corpo: { pt: "RGPD, cookies e termos com a Iubenda, de que somos parceiros certificados. Acessibilidade WCAG desde o primeiro componente.", en: "GDPR, cookies and terms with Iubenda, of which we are certified partners. WCAG accessibility from the first component." } },
      ],
    },
    passos: {
      titulo: { pt: "Como um site se faz nesta casa", en: "How a site gets made here" },
      itens: [
        { nome: { pt: "Arquitetura", en: "Architecture" }, corpo: { pt: "Duas a três semanas: objetivos, públicos, mapa de conteúdo, URLs e modelo de dados. Sai um documento que vale por si, mesmo que o site o faça outro.", en: "Two to three weeks: goals, audiences, content map, URLs and data model. Out comes a document that stands on its own, even if someone else builds the site." } },
        { nome: { pt: "Sistema", en: "System" }, corpo: { pt: "Design system em código e orçamento de performance fixado. O primeiro ecrã aprovado já é código, não uma imagem.", en: "Design system in code and a fixed performance budget. The first approved screen is already code, not a picture." } },
        { nome: { pt: "Construção", en: "Build" }, corpo: { pt: "Entregas semanais em pré-visualização. O cliente vê o site crescer e carrega conteúdo enquanto se constrói, não no fim.", en: "Weekly deliveries in preview. The client watches the site grow and loads content while it is built, not at the end." } },
        { nome: { pt: "Publicação e migração", en: "Launch and migration" }, corpo: { pt: "Mapa de redirecionamentos, medição antes e depois, e vigilância nas quatro semanas seguintes. Depois, JellyCARE, se quiser que continuemos a tratar dele.", en: "Redirect map, before-and-after measurement, and a close watch for the following four weeks. Then JellyCARE, if you want us to keep looking after it." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Em que tecnologia constroem?", en: "What technology do you build in?" }, resposta: { pt: "Na que o projeto pede. Sites institucionais e de conteúdo em Next.js com Payload CMS, ou em WordPress quando a equipa já o domina. Lojas em Shopify ou WooCommerce, ou headless quando o catálogo e as integrações o justificam. Este site é Next.js, Payload e Vercel.", en: "Whatever the project calls for. Corporate and content sites in Next.js with Payload CMS, or in WordPress when the team already knows it. Stores on Shopify or WooCommerce, or headless when the catalogue and integrations justify it. This site is Next.js, Payload and Vercel." } },
      { pergunta: { pt: "Quanto tempo demora um website?", en: "How long does a website take?" }, resposta: { pt: "Um site institucional, oito a doze semanas da arquitetura à publicação. Uma loja, doze a dezasseis. Uma plataforma à medida define-se na arquitetura. O que mais atrasa não é o código: é o conteúdo, e por isso ele começa na primeira semana.", en: "A corporate site, eight to twelve weeks from architecture to launch. A store, twelve to sixteen. A bespoke platform is scoped during architecture. What delays most is not the code: it is the content, which is why it starts in week one." } },
      { pergunta: { pt: "Quanto custa?", en: "How much does it cost?" }, resposta: { pt: "Depende do que tem de fazer, e é por isso que começamos por uma fase de arquitetura com preço fechado. No fim dela há um âmbito, um plano e um orçamento que não muda a meio.", en: "It depends on what it has to do, which is why we start with a fixed-price architecture phase. At the end of it there is a scope, a plan and a budget that does not change halfway." } },
      { pergunta: { pt: "A minha equipa consegue editar o site sozinha?", en: "Can my team edit the site on their own?" }, resposta: { pt: "Sim, e é um critério de aceitação. Entregamos com o CMS configurado, formação gravada e componentes que não se partem quando alguém muda um texto.", en: "Yes, and it is an acceptance criterion. We hand over with the CMS configured, recorded training and components that do not break when someone changes a text." } },
      { pergunta: { pt: "Vou perder posições no Google com o site novo?", en: "Will I lose Google rankings with the new site?" }, resposta: { pt: "Não, se a migração for feita como deve ser: inventário dos URLs que trazem tráfego, mapa de redirecionamentos 301, títulos e dados estruturados preservados, e medição antes e depois. É a quarta fase do método, não um extra.", en: "Not if the migration is done properly: an inventory of the URLs that bring traffic, a 301 redirect map, titles and structured data preserved, and before-and-after measurement. It is the fourth phase of the method, not an extra." } },
      { pergunta: { pt: "Fazem só o design, ou só o desenvolvimento?", en: "Do you do design only, or development only?" }, resposta: { pt: "Fazemos os dois, e é assim que trabalhamos melhor. Mas construímos a partir de design de terceiros, e desenhamos para equipas técnicas internas, quando é isso que faz sentido.", en: "We do both, and that is how we work best. But we build from third-party design, and design for in-house technical teams, when that is what makes sense." } },
    ],
    fecho: {
      titulo: { pt: "O seu site está a trabalhar para o negócio, ou o negócio a trabalhar para o site?", en: "Is your site working for the business, or the business working for the site?" },
      texto: { pt: "Envie-nos o endereço. Respondemos com uma leitura técnica gratuita: performance, SEO, acessibilidade e o que mudaríamos primeiro.", en: "Send us the address. We answer with a free technical reading: performance, SEO, accessibility and what we would change first." },
    },
  },
  {
    slug: { pt: "aplicacoes-web-mobile", en: "web-mobile-apps" },
    area: "apps",
    nome: { pt: "Aplicações Web e Mobile", en: "Web and Mobile Applications" },
    titulo: { pt: "Uma app só vale o que as pessoas voltam a fazer nela.", en: "An app is only worth what people come back to do in it." },
    claim: {
      pt: "iOS, Android e web, nativo ou híbrido conforme o projeto pede. Desenhadas para o gesto que se repete, medidas por quem volta.",
      en: "iOS, Android and web, native or hybrid as the project demands. Designed around the gesture that repeats, measured by who returns.",
    },
    descricao: {
      pt: "Desenvolvimento de aplicações web e mobile pela Jelly: apps iOS e Android, nativas ou híbridas, aplicações web, portais e MVPs. Do protótipo à loja, com retenção medida.",
      en: "Web and mobile application development by Jelly: iOS and Android apps, native or hybrid, web applications, portals and MVPs. From prototype to store, with retention measured.",
    },
    abertura: {
      titulo: { pt: "A app que se instala e a app que se usa", en: "The app that gets installed and the app that gets used" },
      problema: [
        { pt: "Metade das apps são abertas uma vez. O problema raramente é técnico: é uma app feita para o lançamento, com dez funcionalidades na primeira versão e nenhuma razão para voltar na segunda semana.", en: "Half of all apps are opened once. The problem is rarely technical: it is an app made for launch day, with ten features in the first release and no reason to come back in week two." },
        { pt: "Do outro lado, as ferramentas internas: folhas de cálculo partilhadas, formulários por e-mail e três sistemas que não se falam, a custar horas todos os dias a quem tinha mais que fazer.", en: "On the other side, internal tools: shared spreadsheets, forms by email and three systems that do not talk, costing hours every day to people who had better things to do." },
      ],
      abordagem: [
        { pt: "Começamos pelo gesto que se repete: a única coisa que a app tem de fazer melhor do que qualquer alternativa. A primeira versão faz isso muito bem e pouco mais, e vai para utilizadores reais em semanas.", en: "We start with the gesture that repeats: the one thing the app has to do better than any alternative. The first release does that very well and little else, and reaches real users in weeks." },
        { pt: "Depois, mede-se quem volta e porquê, e cada versão seguinte é decidida por isso. Nativo ou híbrido, web ou loja, decide-se pelo projeto e pelo orçamento, não pela moda.", en: "Then we measure who comes back and why, and every following release is decided by that. Native or hybrid, web or store, is decided by the project and the budget, not by fashion." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que fazemos em aplicações", en: "What we do in applications" },
      itens: [
        { nome: { pt: "Apps mobile", en: "Mobile apps" }, corpo: { pt: "iOS e Android, nativas ou híbridas. Publicação nas lojas, notificações, pagamentos, modo offline quando faz falta.", en: "iOS and Android, native or hybrid. Store publishing, notifications, payments, offline mode when it is needed." } },
        { nome: { pt: "Aplicações web", en: "Web applications" }, corpo: { pt: "Back-offices, portais de cliente, áreas reservadas e ferramentas internas que substituem folhas de cálculo e e-mails.", en: "Back offices, customer portals, members' areas and internal tools that replace spreadsheets and emails." } },
        { nome: { pt: "Produto e MVP", en: "Product and MVP" }, corpo: { pt: "Do protótipo navegável à primeira versão em produção. Utilizadores reais desde cedo, funcionalidades ordenadas pelo que aprendem.", en: "From clickable prototype to first production release. Real users from early on, features ranked by what they teach." } },
        { nome: { pt: "APIs e backend", en: "APIs and backend" }, corpo: { pt: "O serviço por trás da app: autenticação, dados, integrações com CRM, pagamentos e sistemas da casa.", en: "The service behind the app: authentication, data, integrations with CRM, payments and in-house systems." } },
        { nome: { pt: "Design de interação", en: "Interaction design" }, corpo: { pt: "Fluxos desenhados e testados antes do código. Um ecrã a menos vale mais do que uma funcionalidade a mais.", en: "Flows designed and tested before the code. One screen fewer is worth more than one feature more." } },
        { nome: { pt: "Manutenção e evolução", en: "Maintenance and evolution" }, corpo: { pt: "Versões, sistemas operativos e lojas mudam todos os anos. Ficamos, com um plano de evolução e o custo à vista.", en: "Releases, operating systems and stores change every year. We stay, with an evolution plan and the cost in plain sight." } },
      ],
    },
    passos: {
      titulo: { pt: "Como uma app nasce aqui", en: "How an app is born here" },
      itens: [
        { nome: { pt: "Descoberta", en: "Discovery" }, corpo: { pt: "Duas semanas: quem usa, o que repete, o que existe hoje. Sai o gesto central e a lista do que fica de fora da primeira versão.", en: "Two weeks: who uses it, what repeats, what exists today. Out comes the core gesture and the list of what stays out of the first release." } },
        { nome: { pt: "Protótipo", en: "Prototype" }, corpo: { pt: "Fluxos navegáveis testados com utilizadores reais antes de uma linha de código. Aqui é barato mudar de ideias.", en: "Clickable flows tested with real users before a line of code. This is where changing your mind is cheap." } },
        { nome: { pt: "Construção", en: "Build" }, corpo: { pt: "Ciclos de duas semanas com versão instalável no fim de cada um. O cliente usa a app enquanto ela se faz.", en: "Two-week cycles with an installable build at the end of each. The client uses the app while it is being made." } },
        { nome: { pt: "Lançamento e retenção", en: "Launch and retention" }, corpo: { pt: "Publicação nas lojas, medição de retenção e um plano de versões decidido pelo que os utilizadores fazem, não pelo que se imaginou.", en: "Store publishing, retention measurement and a release plan decided by what users do, not by what was imagined." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Nativo ou híbrido?", en: "Native or hybrid?" }, resposta: { pt: "Depende do que a app precisa do telemóvel. Câmara, sensores, desempenho gráfico ou offline pesado apontam para nativo. Uma app de conteúdo, serviço ou comércio fica bem servida em híbrido, com uma base de código para as duas lojas e metade do custo de manutenção. Decidimos na descoberta, com o orçamento à frente.", en: "It depends on what the app needs from the phone. Camera, sensors, graphics performance or heavy offline use point to native. A content, service or commerce app is well served by hybrid, with one codebase for both stores and half the maintenance cost. We decide during discovery, with the budget in front of us." } },
      { pergunta: { pt: "Já tenho um website. Preciso de uma app?", en: "I already have a website. Do I need an app?" }, resposta: { pt: "Só se houver um gesto que se repete e que o telemóvel faz melhor: notificações, câmara, localização, acesso rápido. Muitas vezes a resposta certa é uma aplicação web instalável, sem lojas nem aprovações. Dizemos-lhe qual é antes de propor.", en: "Only if there is a repeating gesture the phone does better: notifications, camera, location, quick access. Often the right answer is an installable web app, with no stores and no approvals. We tell you which before proposing." } },
      { pergunta: { pt: "Quanto tempo até estar nas lojas?", en: "How long until it is in the stores?" }, resposta: { pt: "Um MVP bem delimitado, três a quatro meses da descoberta à publicação. As aprovações da Apple e da Google contam-se em dias, quando a app está preparada para elas desde o início.", en: "A well-scoped MVP, three to four months from discovery to publishing. Apple and Google approvals take days when the app is prepared for them from the start." } },
      { pergunta: { pt: "E depois do lançamento?", en: "And after launch?" }, resposta: { pt: "A app precisa de quem a mantenha: sistemas operativos novos, regras das lojas, dependências. Propomos um plano de evolução com horas mensais e prioridades decididas pela medição.", en: "The app needs someone to maintain it: new operating systems, store rules, dependencies. We propose an evolution plan with monthly hours and priorities decided by measurement." } },
      { pergunta: { pt: "Que tipo de apps já fizeram?", en: "What kind of apps have you built?" }, resposta: { pt: "Reserva de transporte, leilões online, saúde, plataformas de descontos, apps de bairro e de cidade, personalizadores de produto para retalho. Os casos estão na página de trabalho.", en: "Ride booking, online auctions, health, discount platforms, neighbourhood and city apps, product customisers for retail. The cases are on the work page." } },
    ],
    fecho: {
      titulo: { pt: "Tem uma ideia de app, ou uma folha de cálculo que já devia ser uma?", en: "Do you have an app idea, or a spreadsheet that should already be one?" },
      texto: { pt: "Descreva-nos o gesto que se repete. Respondemos com uma primeira leitura: nativo ou híbrido, o que entra na primeira versão e quanto custa chegar lá.", en: "Describe the gesture that repeats. We answer with a first reading: native or hybrid, what goes into the first release and what it costs to get there." },
    },
  },
  {
    slug: { pt: "crm-cdp-integracoes", en: "crm-cdp-integrations" },
    area: "dados",
    nome: { pt: "CRM, CDP e Integrações de Dados", en: "CRM, CDP and Data Integrations" },
    titulo: { pt: "Um cliente, um registo. E toda a empresa a ler o mesmo.", en: "One customer, one record. And the whole company reading the same thing." },
    claim: {
      pt: "Implementação de CRM e CDP, e as integrações que ligam marketing, vendas e operações num só sistema. Parceiros certificados Pipedrive e Iubenda.",
      en: "CRM and CDP implementation, and the integrations that connect marketing, sales and operations into one system. Certified Pipedrive and Iubenda partners.",
    },
    descricao: {
      pt: "Implementação de CRM, CDP e integrações de dados pela Jelly: Pipedrive, Zoho, automação entre loja, ERP, faturação e e-mail. Parceiros certificados Pipedrive e Iubenda.",
      en: "CRM, CDP and data integration by Jelly: Pipedrive, Zoho, automation between store, ERP, invoicing and email. Certified Pipedrive and Iubenda partners.",
    },
    abertura: {
      titulo: { pt: "Onde os dados do cliente se perdem", en: "Where customer data gets lost" },
      problema: [
        { pt: "O marketing tem uma lista, as vendas têm outra, a faturação tem a verdadeira e o suporte tem um Excel. O mesmo cliente existe quatro vezes, com quatro nomes ligeiramente diferentes, e ninguém sabe quanto vale.", en: "Marketing has one list, sales has another, invoicing has the real one and support has a spreadsheet. The same customer exists four times, under four slightly different names, and nobody knows what they are worth." },
        { pt: "Cada sistema foi comprado para resolver um problema e resolveu-o. O problema novo é o que fica entre eles: horas de copiar e colar, leads que arrefecem à espera de alguém, e relatórios que não batem certo.", en: "Each system was bought to solve a problem and solved it. The new problem is what sits between them: hours of copy and paste, leads going cold waiting for someone, and reports that do not add up." },
      ],
      abordagem: [
        { pt: "Começamos pelo modelo de dados, não pela ferramenta: o que é um cliente, um contacto, uma oportunidade, e que sistema manda em cada campo. Só depois se escolhe e configura o CRM.", en: "We start with the data model, not the tool: what a customer, a contact and an opportunity are, and which system owns each field. Only then is the CRM chosen and configured." },
        { pt: "Depois ligam-se as pontas. Loja, site, formulários, faturação, e-mail e suporte a escrever no mesmo registo, com o consentimento ao lado. O dado entra uma vez e chega a todos.", en: "Then the ends are connected. Store, site, forms, invoicing, email and support writing to the same record, with consent alongside. Data goes in once and reaches everyone." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que fazemos em dados e sistemas", en: "What we do in data and systems" },
      itens: [
        { nome: { pt: "Implementação de CRM", en: "CRM implementation" }, corpo: { pt: "Pipedrive e Zoho: pipeline, campos, automações, permissões e migração dos dados que já existem. Parceiros certificados Pipedrive.", en: "Pipedrive and Zoho: pipeline, fields, automations, permissions and migration of the data that already exists. Certified Pipedrive partners." } },
        { nome: { pt: "CDP e perfil de cliente", en: "CDP and customer profile" }, corpo: { pt: "Um perfil por pessoa, com comportamento no site, compras e consentimento. É o que alimenta segmentação, automação e atribuição.", en: "One profile per person, with site behaviour, purchases and consent. It is what feeds segmentation, automation and attribution." } },
        { nome: { pt: "Integrações", en: "Integrations" }, corpo: { pt: "ERP, loja, faturação, e-mail, suporte e formulários ligados por API ou por plataformas de integração. Sem exportar CSV às sextas.", en: "ERP, store, invoicing, email, support and forms connected by API or through integration platforms. No CSV exports on Fridays." } },
        { nome: { pt: "Automação de processos", en: "Process automation" }, corpo: { pt: "Lead entra, é qualificada, atribuída e seguida sem ninguém carregar num botão. Com agentes de IA quando o processo o justifica.", en: "A lead comes in, is qualified, assigned and followed up without anyone pressing a button. With AI agents when the process justifies it." } },
        { nome: { pt: "Dados e relatórios", en: "Data and reporting" }, corpo: { pt: "Um só painel onde marketing, vendas e direção leem o mesmo número. Em analytics.jelly.pt ou na ferramenta da casa.", en: "One dashboard where marketing, sales and management read the same number. On analytics.jelly.pt or in your own tool." } },
        { nome: { pt: "Conformidade", en: "Compliance" }, corpo: { pt: "RGPD por desenho: consentimento registado, retenção definida e acessos por função. Parceiros certificados Iubenda.", en: "GDPR by design: consent recorded, retention defined and role-based access. Certified Iubenda partners." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se liga uma empresa", en: "How a company gets connected" },
      itens: [
        { nome: { pt: "Diagnóstico", en: "Diagnosis" }, corpo: { pt: "Duas semanas a mapear sistemas, campos, quem escreve onde e quantas horas se perdem. Sai o modelo de dados e a ordem das ligações.", en: "Two weeks mapping systems, fields, who writes where and how many hours are lost. Out comes the data model and the order of the connections." } },
        { nome: { pt: "Modelo e CRM", en: "Model and CRM" }, corpo: { pt: "O CRM configurado à volta do modelo, com os dados antigos migrados e limpos. A equipa comercial testa antes de mudar.", en: "The CRM configured around the model, with legacy data migrated and cleaned. The sales team tests before switching." } },
        { nome: { pt: "Integrações", en: "Integrations" }, corpo: { pt: "Uma ligação de cada vez, em produção, com a anterior estável. Loja, faturação, e-mail, suporte, pela ordem que devolve mais horas.", en: "One connection at a time, in production, with the previous one stable. Store, invoicing, email, support, in the order that gives back the most hours." } },
        { nome: { pt: "Adoção", en: "Adoption" }, corpo: { pt: "Formação, regras de uso e um mês de acompanhamento. Um CRM que a equipa não usa é uma base de dados cara.", en: "Training, usage rules and a month of follow-up. A CRM the team does not use is an expensive database." } },
      ],
    },
    faq: [
      { pergunta: { pt: "Que CRM recomendam?", en: "Which CRM do you recommend?" }, resposta: { pt: "Para a maioria das PME comerciais, Pipedrive: simples, visual e bem servido de integrações. Zoho quando a empresa precisa de mais módulos dentro do mesmo ecossistema. Trabalhamos também com o que já existir na casa, se estiver bem implementado.", en: "For most sales-driven SMEs, Pipedrive: simple, visual and well served by integrations. Zoho when the company needs more modules within the same ecosystem. We also work with whatever is already in place, if it is well implemented." } },
      { pergunta: { pt: "O que é uma CDP e preciso de uma?", en: "What is a CDP and do I need one?" }, resposta: { pt: "Uma plataforma de dados de cliente junta num só perfil o que cada pessoa fez no site, comprou, abriu e consentiu. Precisa dela se tem vários canais e quer segmentar e automatizar com base no comportamento real. Se tem um só canal, um CRM bem feito chega.", en: "A customer data platform gathers into one profile what each person did on the site, bought, opened and consented to. You need one if you have several channels and want to segment and automate on real behaviour. If you have a single channel, a well-built CRM is enough." } },
      { pergunta: { pt: "Migram os dados que já temos?", en: "Do you migrate the data we already have?" }, resposta: { pt: "Sim, e é a parte que mais cuidado pede: desduplicação, normalização de nomes e e-mails, histórico preservado. Fazemos uma migração de ensaio antes da definitiva.", en: "Yes, and it is the part that needs the most care: deduplication, normalising names and emails, history preserved. We run a rehearsal migration before the final one." } },
      { pergunta: { pt: "Quanto tempo demora?", en: "How long does it take?" }, resposta: { pt: "Um CRM implementado e adotado, seis a dez semanas. Cada integração, uma a três semanas conforme o sistema do outro lado. Uma CDP é um projeto de trimestre.", en: "A CRM implemented and adopted, six to ten weeks. Each integration, one to three weeks depending on the system at the other end. A CDP is a quarter-long project." } },
      { pergunta: { pt: "E o RGPD?", en: "What about GDPR?" }, resposta: { pt: "Faz parte do desenho, não de uma auditoria no fim: consentimento registado por finalidade, retenção definida, acessos por função e o direito ao esquecimento executável num clique. Somos parceiros certificados Iubenda.", en: "It is part of the design, not an audit at the end: consent recorded per purpose, retention defined, role-based access and the right to be forgotten executable in one click. We are certified Iubenda partners." } },
    ],
    fecho: {
      titulo: { pt: "Quantas vezes o mesmo cliente existe nos seus sistemas?", en: "How many times does the same customer exist in your systems?" },
      texto: { pt: "Se a resposta for mais do que uma, comece por um diagnóstico de dados. Duas semanas, e um mapa do que ligar primeiro.", en: "If the answer is more than once, start with a data diagnosis. Two weeks, and a map of what to connect first." },
    },
  },
  {
    slug: { pt: "performance-acessibilidade-migracoes", en: "performance-accessibility-migrations" },
    area: "performance",
    nome: { pt: "Performance, Acessibilidade e Migrações", en: "Performance, Accessibility and Migrations" },
    titulo: { pt: "Rápido, acessível e mudado de casa sem perder um visitante.", en: "Fast, accessible and moved house without losing a visitor." },
    claim: {
      pt: "Core Web Vitals, WCAG 2.2 e migrações com mapa de redirecionamentos: a parte do trabalho que ninguém vê e todos sentem. E o JellyCARE para depois.",
      en: "Core Web Vitals, WCAG 2.2 and migrations with a redirect map: the part of the work nobody sees and everyone feels. And JellyCARE for afterwards.",
    },
    descricao: {
      pt: "Performance web, acessibilidade e migrações sem perder tráfego pela Jelly: Core Web Vitals, WCAG 2.2 AA, redirecionamentos 301 e JellyCARE, o plano de manutenção ativa e preventiva.",
      en: "Web performance, accessibility and migrations without losing traffic by Jelly: Core Web Vitals, WCAG 2.2 AA, 301 redirects and JellyCARE, the active, preventive maintenance plan.",
    },
    abertura: {
      titulo: { pt: "O que um site perde sem ninguém dar por isso", en: "What a site loses without anyone noticing" },
      problema: [
        { pt: "Um segundo a mais no carregamento leva uma parte das visitas, todos os dias, sem aviso. Um formulário que não se lê com um leitor de ecrã fecha a porta a quem mais precisava dele. E uma migração feita à pressa apaga em dez minutos o tráfego orgânico de dez anos.", en: "One extra second of loading takes a share of the visits, every day, without warning. A form that cannot be read with a screen reader shuts the door on the people who needed it most. And a rushed migration wipes out ten years of organic traffic in ten minutes." },
        { pt: "Nenhuma destas perdas aparece numa reunião. Aparecem meses depois, no relatório, com outro nome.", en: "None of these losses shows up in a meeting. They show up months later, in the report, under another name." },
      ],
      abordagem: [
        { pt: "Medimos primeiro, em utilizadores reais e não num laboratório: Core Web Vitals, erros de acessibilidade, URLs que trazem tráfego. Sai uma lista ordenada pelo que custa mais.", en: "We measure first, on real users rather than in a lab: Core Web Vitals, accessibility errors, the URLs that bring traffic. Out comes a list ranked by what costs most." },
        { pt: "Depois corrige-se pela ordem, com o número a confirmar cada passo. E quando o site muda de casa, o mapa de redirecionamentos está feito antes de a chave rodar.", en: "Then we fix in order, with the number confirming each step. And when the site moves house, the redirect map is done before the key turns." },
      ],
    },
    fazemos: {
      titulo: { pt: "O que fazemos em performance, acessibilidade e migrações", en: "What we do in performance, accessibility and migrations" },
      itens: [
        { nome: { pt: "Auditoria de performance", en: "Performance audit" }, corpo: { pt: "Core Web Vitals em utilizadores reais, orçamento de performance e uma lista ordenada de correções com o ganho estimado de cada uma.", en: "Core Web Vitals on real users, a performance budget and a ranked list of fixes with the estimated gain of each." } },
        { nome: { pt: "Otimização", en: "Optimisation" }, corpo: { pt: "Imagens, fontes, scripts de terceiros, cache e servidor. O trabalho invisível que faz um site parecer instantâneo.", en: "Images, fonts, third-party scripts, caching and server. The invisible work that makes a site feel instant." } },
        { nome: { pt: "Acessibilidade WCAG 2.2", en: "WCAG 2.2 accessibility" }, corpo: { pt: "Auditoria, correção e declaração de acessibilidade. Nível AA, com o European Accessibility Act em vigor.", en: "Audit, fixes and accessibility statement. Level AA, with the European Accessibility Act in force." } },
        { nome: { pt: "Migrações sem perder tráfego", en: "Migrations without losing traffic" }, corpo: { pt: "Inventário de URLs, mapa de redirecionamentos 301, títulos e dados estruturados preservados, medição antes e depois.", en: "URL inventory, 301 redirect map, titles and structured data preserved, before-and-after measurement." } },
        { nome: { pt: "Segurança e disponibilidade", en: "Security and uptime" }, corpo: { pt: "Checkups diários, atualizações, monitor de disponibilidade e backups na cloud. Ser o primeiro a saber, não o último.", en: "Daily checkups, updates, uptime monitoring and cloud backups. Being the first to know, not the last." } },
        { nome: { pt: "JellyCARE", en: "JellyCARE" }, corpo: { pt: "O plano de manutenção ativa e preventiva: tudo isto, todos os meses, com relatório do que se fez e do que se evitou.", en: "The active, preventive maintenance plan: all of this, every month, with a report of what was done and what was avoided." } },
      ],
    },
    passos: {
      titulo: { pt: "Como se recupera o que se perdia", en: "How to recover what was being lost" },
      itens: [
        { nome: { pt: "Medição", en: "Measurement" }, corpo: { pt: "Uma semana a medir em utilizadores reais: velocidade, acessibilidade, tráfego por URL. Sem opinião, com números.", en: "A week measuring on real users: speed, accessibility, traffic by URL. No opinion, just numbers." } },
        { nome: { pt: "Prioridades", en: "Priorities" }, corpo: { pt: "Lista ordenada pelo que custa mais e pelo que custa corrigir. As três primeiras costumam valer metade do ganho.", en: "A list ranked by what costs most and what it costs to fix. The first three usually account for half the gain." } },
        { nome: { pt: "Correção", en: "Fixing" }, corpo: { pt: "Uma correção de cada vez, em produção, com o número a confirmar. O que não mexe no número sai da lista.", en: "One fix at a time, in production, with the number confirming. Whatever does not move the number leaves the list." } },
        { nome: { pt: "Vigilância", en: "Watch" }, corpo: { pt: "Quatro semanas de acompanhamento depois de cada mudança, e o JellyCARE a partir daí, se quiser que continuemos.", en: "Four weeks of follow-up after each change, and JellyCARE from then on, if you want us to keep going." } },
      ],
    },
    faq: [
      { pergunta: { pt: "O que são os Core Web Vitals e porque importam?", en: "What are Core Web Vitals and why do they matter?" }, resposta: { pt: "Três medidas que o Google usa para avaliar a experiência de uma página: quanto demora o conteúdo principal a aparecer, quão depressa responde ao toque, e quanto salta enquanto carrega. Contam para o posicionamento, e contam mais para quem está do outro lado do ecrã.", en: "Three measures Google uses to judge a page's experience: how long the main content takes to show, how quickly it responds to a tap, and how much it jumps while loading. They count for rankings, and they count more for the person on the other side of the screen." } },
      { pergunta: { pt: "A acessibilidade é obrigatória?", en: "Is accessibility mandatory?" }, resposta: { pt: "Para o setor público há anos. Para o privado, o European Accessibility Act aplica-se desde junho de 2025 a comércio eletrónico, banca, transportes e outros serviços. Mas mais do que a lei, é uma percentagem de clientes que hoje não conseguem comprar-lhe.", en: "For the public sector, for years. For the private sector, the European Accessibility Act has applied since June 2025 to e-commerce, banking, transport and other services. But beyond the law, it is a share of customers who cannot buy from you today." } },
      { pergunta: { pt: "Vou perder tráfego ao mudar de site ou de domínio?", en: "Will I lose traffic when changing site or domain?" }, resposta: { pt: "Não, se cada URL antigo com tráfego tiver um destino e o resto do trabalho for feito: redirecionamentos 301, títulos e dados estruturados preservados, sitemap novo submetido, e vigilância nas semanas seguintes. É por não se fazer que se perde.", en: "Not if every old URL with traffic has a destination and the rest of the work is done: 301 redirects, titles and structured data preserved, the new sitemap submitted, and a close watch in the following weeks. Traffic is lost when this is not done." } },
      { pergunta: { pt: "O que é o JellyCARE?", en: "What is JellyCARE?" }, resposta: { pt: "O plano de manutenção ativa e preventiva da Jelly para websites: checkup diário de segurança, atualizações de temas e plugins, monitor de disponibilidade, links quebrados, otimização da base de dados e relatório mensal. Com backups diários na cloud no plano Plus. Sem fidelização: se não gostar, cancela.", en: "Jelly's active, preventive maintenance plan for websites: daily security checkup, theme and plugin updates, uptime monitoring, broken links, database optimisation and a monthly report. With daily cloud backups on the Plus plan. No lock-in: if you do not like it, you cancel." } },
      { pergunta: { pt: "Fazem isto em sites que não construíram?", en: "Do you do this on sites you did not build?" }, resposta: { pt: "Sim, e é frequente. Auditamos, corrigimos e mantemos sites em WordPress, Shopify e outras plataformas, feitos por outras equipas.", en: "Yes, and often. We audit, fix and maintain sites on WordPress, Shopify and other platforms, built by other teams." } },
    ],
    fecho: {
      titulo: { pt: "Quanto está o seu site a perder sem que ninguém dê por isso?", en: "How much is your site losing without anyone noticing?" },
      texto: { pt: "Envie-nos o endereço. Respondemos com a medição em utilizadores reais e as três correções que valem mais.", en: "Send us the address. We answer with the measurement on real users and the three fixes worth most." },
    },
  },
];

/** Um serviço pelo seu endereço, em qualquer das duas línguas. */
export const servicoDeTecnologia = (slug: string) => servicoPorSlug(SERVICOS_DE_TECNOLOGIA, slug);

/**
 * Os outros serviços de Tecnologia. Aqui cada serviço é a sua área, e por isso
 * a "família" no fim da página são os outros três, não os irmãos da mesma área.
 */
export const outrosDeTecnologia = (servico: ServicoDeTecnologia) => SERVICOS_DE_TECNOLOGIA.filter((s) => s.slug.pt !== servico.slug.pt);

