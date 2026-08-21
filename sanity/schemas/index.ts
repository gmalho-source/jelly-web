import { localeString, localeText } from "./locale";
import { articleBody, category, coverImage, post } from "./post";
import { archivedProject, client, kpi, logoGallery, milestone, newsItem, project, service, teamMember } from "./work";

/** Todos os tipos do Studio. Ordem: conteúdo primeiro, blocos no fim. */
export const schemaTypes = [
  post,
  category,
  project,
  archivedProject,
  service,
  client,
  newsItem,
  teamMember,
  milestone,
  logoGallery,
  // blocos reutilizáveis
  localeString,
  localeText,
  coverImage,
  articleBody,
  kpi,
];
