import type { Sector } from "./types";

/**
 * Os setores da página de Clientes, quando o painel não responde.
 *
 * Os setores vivem no painel (Casa → Setores). Esta lista é a rede: os mesmos
 * setores, com os nomes que estavam no site quando passaram para lá —
 * incluindo os que tinham sido mudados no painel («Retalho e consumo»,
 * «Serviços e saúde»).
 */
export const sectors: Sector[] = [
  { slug: "financeiro", name: { pt: "Financeiro e seguros", en: "Finance and insurance" }, order: 10 },
  { slug: "saude", name: { pt: "Saúde e estética", en: "Health and aesthetics" }, order: 20 },
  { slug: "bebidas", name: { pt: "Bebidas e espirituosas", en: "Drinks and spirits" }, order: 30 },
  { slug: "alimentar", name: { pt: "Indústria alimentar", en: "Food industry" }, order: 40 },
  { slug: "consumo", name: { pt: "Produtos de consumo", en: "Consumer products" }, order: 50 },
  { slug: "retalho", name: { pt: "Retalho e consumo", en: "Retail and consumer" }, order: 60 },
  { slug: "industria", name: { pt: "Indústria", en: "Industry" }, order: 70 },
  { slug: "automovel", name: { pt: "Indústria ou comércio automóvel", en: "Automotive industry and retail" }, order: 80 },
  { slug: "construcao", name: { pt: "Arquitetura e construção", en: "Architecture and construction" }, order: 90 },
  { slug: "imobiliario", name: { pt: "Mediação, consultoria, angariação e gestão imobiliária", en: "Real estate brokerage, consulting, sourcing and management" }, order: 100 },
  { slug: "transportes", name: { pt: "Transportes & Logística", en: "Transport & Logistics" }, order: 110 },
  { slug: "servicos", name: { pt: "Serviços e saúde", en: "Services and health" }, order: 120 },
  { slug: "ong", name: { pt: "ONG", en: "NGOs" }, order: 130 },
  { slug: "arte", name: { pt: "Arte e coleccionismo", en: "Art and collecting" }, order: 140 },
  { slug: "eventos", name: { pt: "Eventos e espaços", en: "Events and venues" }, order: 150 },
  { slug: "lazer", name: { pt: "Turismo e lazer", en: "Travel and leisure" }, order: 160 },
  { slug: "tecnologia", name: { pt: "Tecnologia", en: "Technology" }, order: 170 },
];
