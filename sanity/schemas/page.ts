type Rule = { required: () => Rule };

/**
 * Caderno de copy de uma página. Não é a página: é a lista de textos que ela
 * usa, chave a chave, nas duas línguas. As chaves são criadas pelo seed e não
 * se editam — inventar uma chave nova no Studio não punha texto nenhum no site,
 * porque quem decide que chaves existem é o código.
 *
 * O que fica de fora, por decisão: a navegação, o footer e a área de faturação
 * (são interface, não conteúdo) e a headline do herói, composta no JSX porque a
 * palavra riscada é desenho.
 */
export const page = {
  name: "page",
  title: "Página",
  type: "document",
  fields: [
    { name: "title", title: "Página", type: "string", validation: (rule: Rule) => rule.required() },
    { name: "slug", title: "Chave", type: "slug", readOnly: true, description: "Corresponde ao grupo de textos no código." },
    {
      name: "entries",
      title: "Textos",
      type: "array",
      of: [
        {
          type: "object",
          name: "entry",
          fields: [
            { name: "key", title: "Chave", type: "string", readOnly: true },
            { name: "pt", title: "Português", type: "text", rows: 2 },
            { name: "en", title: "English", type: "text", rows: 2 },
          ],
          preview: { select: { title: "pt", subtitle: "key" } },
        },
      ],
    },
  ],
  preview: { select: { title: "title", subtitle: "slug.current" } },
};

/** Ordem e nome das páginas no Studio. É também a lista do que é editável. */
export const PAGE_KEYS: { slug: string; title: string }[] = [
  { slug: "home", title: "Homepage" },
  { slug: "about", title: "Sobre" },
  { slug: "services", title: "Serviços" },
  { slug: "work", title: "Projetos" },
  { slug: "clients", title: "Clientes" },
  { slug: "blog", title: "Blog" },
  { slug: "newsroom", title: "Newsroom" },
  { slug: "contact", title: "Contactos" },
];
