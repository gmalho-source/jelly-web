import type { Client, Service } from "./types";

export const services: Service[] = [
  {
    slug: "branding",
    name: { pt: "Branding", en: "Branding" },
    claim: {
      pt: "Identidade, posicionamento e narrativa para marcas que precisam de ser reconhecíveis antes de serem lembradas.",
      en: "Identity, positioning and narrative for brands that need to be recognisable before they can be remembered.",
    },
    link: { pt: "Brand", en: "Brand" },
  },
  {
    slug: "marketing",
    name: { pt: "Marketing", en: "Marketing" },
    claim: {
      pt: "Dados, criatividade e cadência. Tráfego, leads e vendas com o número ao lado.",
      en: "Data, creativity and cadence. Traffic, leads and sales with the number next to them.",
    },
    link: { pt: "Performance", en: "Performance" },
  },
  {
    slug: "inteligencia-artificial",
    name: { pt: "Inteligência artificial", en: "Artificial intelligence" },
    claim: {
      pt: "Da consultoria à implementação de agentes e automação com impacto real na operação.",
      en: "From consulting to shipping agents and automation with real operational impact.",
    },
    link: { pt: "IA", en: "AI" },
  },
  {
    slug: "tecnologia",
    name: { pt: "Tecnologia", en: "Technology" },
    claim: {
      pt: "Websites, e-commerce, CRM e CDP a ligar marketing, vendas e operações.",
      en: "Websites, e-commerce, CRM and CDP connecting marketing, sales and operations.",
    },
    link: { pt: "Tech", en: "Tech" },
  },
];

export const clients: Client[] = [
  { name: "BNP Paribas" },
  { name: "Montblanc" },
  { name: "Cetelem" },
  { name: "Adegamãe" },
  { name: "321 Crédito" },
  { name: "Slide & Splash" },
  { name: "Defined.ai" },
  { name: "Evidensia" },
  { name: "uPlayback" },
];
