/**
 * GROQ. Uma consulta por coleção, com os campos exatos que as páginas usam —
 * o Sanity cobra por dados transferidos e o site não precisa do resto.
 */
// Projeção plana: o next/image quer src, alt e as dimensões reais.
const IMAGE = `{
    alt,
    caption,
    "src": asset->url,
    "width": asset->metadata.dimensions.width,
    "height": asset->metadata.dimensions.height
  }`;
const LOCALE = `{ pt, en }`;
const KPI = `{ value, label ${LOCALE} }`;

export const POSTS = `*[_type == "post" && draft != true] | order(date desc) {
  "slug": slug.current,
  date,
  lang,
  author,
  readingMinutes,
  legacyPath,
  title ${LOCALE},
  excerpt ${LOCALE},
  "category": category->title ${LOCALE},
  cover ${IMAGE},
  body[]
}`;

export const PROJECTS = `*[_type == "project"] | order(order asc) {
  "slug": slug.current,
  client,
  year,
  order,
  title ${LOCALE},
  summary ${LOCALE},
  disciplines ${LOCALE},
  team ${LOCALE},
  headline ${KPI},
  kpis[] ${KPI},
  quote { text ${LOCALE}, author, role ${LOCALE} },
  cover ${IMAGE}
}`;

// A história leva projeções por tipo de bloco: o Portable Text vem cru, e as
// imagens de dentro precisam de endereço e dimensões como as outras.
const STORY = `story[] {
    ...,
    _type == "coverImage" => ${IMAGE},
    _type == "galleryBlock" => { "images": images[] ${IMAGE} },
    _type == "videoBlock" => { mp4, webm, portrait, "poster": poster ${IMAGE} }
  }`;

export const ARCHIVED_PROJECTS = `*[_type == "archivedProject"] | order(date desc) {
  "slug": slug.current,
  legacyPath,
  client,
  date,
  year,
  disciplines,
  subtitle,
  summary,
  cover ${IMAGE},
  "images": images[] ${IMAGE},
  ${STORY}
}`;

export const SERVICES = `*[_type == "service"] | order(order asc) {
  "slug": slug.current,
  name ${LOCALE},
  claim ${LOCALE},
  link ${LOCALE},
  promise ${LOCALE},
  "includes": includes[] ${LOCALE},
  "phases": phases[] { name ${LOCALE}, body ${LOCALE} },
  "caseSlugs": cases[]->slug.current,
  accent
}`;

export const CLIENTS = `*[_type == "client"] | order(coalesce(order, 999) asc, name asc) { name, sector }`;

export const TEAM = `*[_type == "teamMember"] | order(coalesce(order, 999) asc, name asc) { name, role ${LOCALE} }`;

export const MILESTONES = `*[_type == "milestone"] | order(year asc) { year, body ${LOCALE} }`;

export const NEWS = `*[_type == "newsItem"] | order(date desc) {
  "slug": slug.current,
  date,
  kind,
  outlet,
  title ${LOCALE},
  summary ${LOCALE}
}`;

export const LOGO_GALLERIES = `*[_type == "logoGallery"] {
  gallery,
  "slug": slug.current,
  "logos": logos[] { name, link, "src": image.asset->url }
}`;

export const PAGE_COPY = `*[_type == "page"] {
  "slug": slug.current,
  "entries": entries[] { key, pt, en }
}`;
