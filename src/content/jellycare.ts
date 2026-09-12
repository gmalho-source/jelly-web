import type { CarePlan } from "./types";

/**
 * JellyCARE: manutenção ativa e preventiva de websites.
 *
 * Existia no site antigo como página pilar, com os serviços, os dois planos e
 * os preços. Na primeira passagem do site novo foi absorvida pela página de
 * Performance, Acessibilidade e Migrações — e diluiu-se: o JellyCARE é um
 * produto com nome, preço e assinatura mensal, e uma menção dentro de um
 * serviço não é isso. Volta a ter página, com o que a de antes dizia.
 *
 * As palavras vêm de lá. Os preços também, e por isso não se inventam aqui:
 * 75 € e 90 € por mês, IVA à parte, como estava.
 */
export const jellycare = {
  eyebrow: { pt: "JellyCARE", en: "JellyCARE" },
  titulo: {
    pt: "Manutenção ativa e preventiva do seu website",
    en: "Active, preventive maintenance for your website",
  },
  tituloCurto: { pt: "JellyCARE", en: "JellyCARE" },
  claim: {
    pt: "Não precisa de pedir nada, porque tratamos de tudo. Proativamente.",
    en: "You never have to ask, because we take care of it all. Proactively.",
  },
  descricao: {
    pt: "Plano mensal de manutenção de websites: checkup diário de segurança, atualização de temas e plugins, monitor de disponibilidade, backups na cloud e um relatório todos os meses. Desde 75 € por mês, sem fidelização.",
    en: "A monthly website maintenance plan: daily security checkup, theme and plugin updates, uptime monitoring, cloud backups and a report every month. From €75 a month, no lock-in.",
  },
  imagem: {
    src: "/media/jellycare-topo.webp",
    alt: {
      pt: "Pessoa sentada à secretária, de café na mão, a ler no tablet sem pressa",
      en: "Someone at their desk, coffee in hand, reading on a tablet without any hurry",
    },
  },

  abertura: {
    titulo: {
      pt: "Um site publicado é um site que começa a envelhecer.",
      en: "A published site is a site that starts to age.",
    },
    texto: {
      pt: "Plugins que ficam para trás, uma vulnerabilidade nova de cada vez, uma base de dados que incha, links que morrem porque outra pessoa mudou de endereço. Nada disto avisa, e quase nada disto se vê do lado de fora — até ao dia em que se vê demais. O JellyCARE trata destas coisas antes de alguém dar por elas, e no fim do mês diz o que fez.",
      en: "Plugins falling behind, a new vulnerability at a time, a database filling up with leftovers, links dying because somebody else changed an address. None of it announces itself, and almost none of it shows from the outside — until the day it shows far too much. JellyCARE deals with all of it before anyone notices, and at the end of the month it tells you what it did.",
    },
  },

  servicos: {
    eyebrow: { pt: "Serviços JellyCARE", en: "JellyCARE services" },
    titulo: { pt: "O que está incluído, todos os meses", en: "What is included, every month" },
    itens: [
      {
        nome: { pt: "Segurança", en: "Security" },
        corpo: {
          pt: "Checkup diário ao site, à procura de vulnerabilidades, vírus e malware.",
          en: "A daily checkup of the site, looking for vulnerabilities, viruses and malware.",
        },
      },
      {
        nome: { pt: "Atualização de temas e plugins", en: "Theme and plugin updates" },
        corpo: {
          pt: "Temas, plugins e dependências atualizados de forma permanente. É por aí que entra a maior parte das vulnerabilidades.",
          en: "Themes, plugins and dependencies kept permanently up to date. That is where most vulnerabilities get in.",
        },
      },
      {
        nome: { pt: "Monitor de disponibilidade", en: "Uptime monitor" },
        corpo: {
          pt: "Verificamos o site de cinco em cinco segundos, para que seja o primeiro a saber se ficar indisponível.",
          en: "We check the site every five seconds, so you are the first to know if it goes down.",
        },
      },
      {
        nome: { pt: "Links quebrados", en: "Broken links" },
        corpo: {
          pt: "Procuramos e identificamos os links que deixaram de funcionar, para serem corrigidos. Um link morto pesa no SEO.",
          en: "We find and flag the links that stopped working, so they can be fixed. A dead link weighs on SEO.",
        },
      },
      {
        nome: { pt: "Desempenho", en: "Performance" },
        corpo: {
          pt: "A avaliação de desempenho do site, com base nas auditorias do PageSpeed e do YSlow.",
          en: "Your site's performance score, based on PageSpeed and YSlow audits.",
        },
      },
      {
        nome: { pt: "Otimização da base de dados", en: "Database optimisation" },
        corpo: {
          pt: "As bases de dados guardam dados temporários e, de vez em quando, precisam de ser limpas e reorganizadas. O site carrega mais depressa.",
          en: "Databases hold temporary data and now and then need cleaning and reorganising. The site loads faster for it.",
        },
      },
      {
        nome: { pt: "Gestão de conteúdo", en: "Content management" },
        corpo: {
          pt: "De vez em quando é preciso mudar uma imagem, um texto, um produto ou um serviço. Conte connosco para que o conteúdo esteja sempre atual.",
          en: "Every so often an image, a text, a product or a service needs changing. Count on us to keep the content current.",
        },
      },
      {
        nome: { pt: "Suporte web", en: "Web support" },
        corpo: {
          pt: "A nossa equipa de suporte responde a qualquer questão relacionada com o site, com atendimento prioritário.",
          en: "Our support team answers any question about the site, with priority handling.",
        },
      },
      {
        nome: { pt: "Analytics", en: "Analytics" },
        corpo: {
          pt: "Ligamos a sua conta Google Analytics (ou as estatísticas do WordPress) para ver os indicadores principais no mesmo relatório.",
          en: "We connect your Google Analytics account (or the WordPress stats) so the main indicators show up in the same report.",
        },
      },
    ],
  },

  addons: {
    titulo: { pt: "Addons JellyCARE", en: "JellyCARE add-ons" },
    itens: [
      {
        nome: { pt: "Backups diários", en: "Daily backups" },
        corpo: {
          pt: "O site sempre com uma cópia de segurança na cloud, todos os dias. Incluído no Plus.",
          en: "The site always with a backup in the cloud, every day. Included in Plus.",
        },
      },
      {
        nome: { pt: "SEO Ranking", en: "SEO ranking" },
        corpo: {
          pt: "Saiba como o site se posiciona face aos concorrentes, nas palavras que os seus clientes usam de facto.",
          en: "See where the site stands against competitors, on the words your customers actually use.",
        },
      },
    ],
  },

  planos: {
    eyebrow: { pt: "Dois planos", en: "Two plans" },
    titulo: { pt: "Escolha o seu JellyCARE", en: "Choose your JellyCARE" },
    nota: { pt: "Acresce IVA à taxa legal em vigor.", en: "VAT at the legal rate is added." },
    periodo: { pt: "mês", en: "month" },
    cta: { pt: "Subscrever", en: "Subscribe" },
    /** O que a campanha diz quando o painel só preenche o preço do primeiro mês. */
    campanhaPrimeiroMes: { pt: "Primeiro mês a {preco}", en: "First month at {preco}" },
  },

  comecar: {
    eyebrow: { pt: "Como começar", en: "How to start" },
    titulo: { pt: "Três passos, e o terceiro é seu", en: "Three steps, and the third one is yours" },
    itens: [
      {
        nome: { pt: "Subscreva", en: "Subscribe" },
        corpo: {
          pt: "Diga-nos o endereço do site e escolha o plano.",
          en: "Tell us the site's address and pick the plan.",
        },
      },
      {
        nome: { pt: "Experimente", en: "Try it" },
        corpo: {
          pt: "Cuidamos do site e reportamos exatamente tudo o que foi feito.",
          en: "We look after the site and report exactly everything that was done.",
        },
      },
      {
        nome: { pt: "Decida", en: "Decide" },
        corpo: {
          pt: "Se gostou, é só continuar. Se não gostou, é só cancelar. Não há fidelização.",
          en: "If you liked it, just carry on. If you didn't, just cancel. There is no lock-in.",
        },
      },
    ],
  },

  fecho: {
    titulo: {
      pt: "Quer saber o que anda a acontecer ao seu site?",
      en: "Want to know what has been happening to your site?",
    },
    texto: {
      pt: "Diga-nos o endereço. Tratamos dele durante um mês e mostramos, ao detalhe, tudo o que foi feito.",
      en: "Tell us the address. We look after it for a month and show you, in detail, everything that was done.",
    },
    cta: { pt: "Subscrever sem compromisso", en: "Subscribe, no strings" },
  },

  formulario: {
    eyebrow: { pt: "Subscrever", en: "Subscribe" },
    titulo: { pt: "Diga-nos qual é o site", en: "Tell us which site" },
    texto: {
      pt: "Escolha o plano, deixe o endereço do site e o contacto. Respondemos com os próximos passos e com o dia em que começamos a tratar dele.",
      en: "Pick the plan, leave the site's address and your contact. We answer with the next steps and the day we start looking after it.",
    },
    campos: {
      plano: { pt: "Plano", en: "Plan" },
      site: { pt: "O seu website", en: "Your website" },
      siteHint: { pt: "exemplo.pt", en: "example.com" },
      infetado: {
        pt: "O site está infetado com malware, ou suspeito que esteja.",
        en: "The site is infected with malware, or I suspect it is.",
      },
      name: { pt: "Nome", en: "Name" },
      company: { pt: "Empresa", en: "Company" },
      email: { pt: "Email", en: "Email" },
      phone: { pt: "Telefone", en: "Phone" },
      phoneHint: { pt: "912 345 678", en: "912 345 678" },
      notas: { pt: "Quer acrescentar alguma coisa?", en: "Anything to add?" },
      notasHint: {
        pt: "A plataforma, quem aloja, o que já aconteceu ao site.",
        en: "The platform, who hosts it, what has happened to the site.",
      },
      consent: { pt: "Concordo e aceito a", en: "I agree to and accept the" },
      privacidade: { pt: "Política de Privacidade da Jelly", en: "Jelly Privacy Policy" },
      submit: { pt: "Quero experimentar", en: "I want to try it" },
      sending: { pt: "A enviar", en: "Sending" },
      sent: { pt: "Está tratado, {nome}.", en: "It's done, {nome}." },
      sentBody: {
        pt: "Recebemos o pedido e vamos ver o site antes de responder. Damos notícias com os próximos passos e a data de início.",
        en: "We have your request and will look at the site before replying. We'll come back with the next steps and a start date.",
      },
      error: {
        pt: "Não foi possível enviar. Tente outra vez, ou escreva para hello@jelly.pt.",
        en: "It could not be sent. Try again, or write to hello@jelly.pt.",
      },
      erros: {
        name: { pt: "Falta o nome.", en: "The name is missing." },
        email: { pt: "Falta o email.", en: "The email is missing." },
        emailInvalid: { pt: "Este email não parece estar certo.", en: "That email does not look right." },
        phone: { pt: "Falta o telefone.", en: "The phone number is missing." },
        phoneShort: { pt: "Este número parece curto.", en: "That number looks short." },
        site: { pt: "Falta o endereço do site.", en: "The site's address is missing." },
        consent: { pt: "É preciso aceitar a política de privacidade.", en: "The privacy policy has to be accepted." },
      },
    },
  },
} as const;

/**
 * Os planos, para quando não há painel.
 *
 * São os do site antigo, com os preços de lá. Quem manda é a coleção
 * «Planos JellyCARE»; isto é a rede por baixo — em desenvolvimento, ou se a
 * base não responder, a página de preços continua a ter preços.
 */
export const planosDeCodigo: CarePlan[] = [
  {
    key: "jellycare",
    name: "JellyCARE",
    price: 75,
    features: [
      { pt: "Segurança, checkup diário", en: "Security, daily checkup" },
      { pt: "Atualização de temas e plugins", en: "Theme and plugin updates" },
      { pt: "Otimização da base de dados", en: "Database optimisation" },
      { pt: "Links quebrados", en: "Broken links" },
      { pt: "Analytics", en: "Analytics" },
      { pt: "Relatório mensal JellyCARE", en: "Monthly JellyCARE report" },
    ],
  },
  {
    key: "jellycare-plus",
    name: "JellyCARE Plus",
    price: 90,
    badge: { pt: "Mais popular", en: "Most popular" },
    features: [
      { pt: "Segurança, checkup diário", en: "Security, daily checkup" },
      { pt: "Atualização de temas e plugins", en: "Theme and plugin updates" },
      { pt: "Otimização da base de dados", en: "Database optimisation" },
      { pt: "Links quebrados", en: "Broken links" },
      { pt: "Analytics", en: "Analytics" },
      { pt: "Relatório mensal JellyCARE", en: "Monthly JellyCARE report" },
      { pt: "Backup diário na cloud", en: "Daily cloud backup" },
      { pt: "Atualização segura", en: "Safe updates" },
    ],
  },
];
