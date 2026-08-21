import { localeString, localeText } from "./locale";
import { page } from "./page";
import { articleBody, category, coverImage, post } from "./post";
import { archivedProject, client, kpi, logoGallery, milestone, newsItem, project, service, teamMember } from "./work";

/** Todos os tipos do Studio. Ordem: conteúdo primeiro, blocos no fim. */
export const schemaTypes = [
  page,
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
