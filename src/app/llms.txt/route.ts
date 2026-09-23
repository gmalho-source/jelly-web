import { getPathname } from "@/i18n/navigation";
import { PILARES } from "@/content/pilares";
import { SERVICOS_DE_MARKETING } from "@/content/marketing-servicos";
import { SERVICOS_DE_TECNOLOGIA } from "@/content/tecnologia-servicos";
import { getPosts, getProjects, getServices } from "@/lib/cms";
import { SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * O índice da casa para quem a lê por máquina.
 *
 * Um modelo de linguagem que chega aqui não rasteja 428 endereços à procura do
 * que interessa: lê este ficheiro e fica a saber o que a casa faz e onde está
 * cada coisa. É Markdown por convenção — a auditoria do PageSpeed quer um H1 —
 * e é gerado do mesmo conteúdo que alimenta o site, pela mesma razão que o mapa
 * do site o é: uma lista escrita à mão fica desactualizada na primeira semana.
 *
 * Não é o site inteiro. Os artigos são 180 e mais, e despejá-los aqui fazia
 * deste ficheiro aquilo que ele existe para evitar. Vão os mais recentes, e o
 * caminho para o resto.
 */

const ARTIGOS_RECENTES = 15;

export async function GET() {
  const [projetos, servicos, artigos] = await Promise.all([getProjects(), getServices(), getPosts()]);

  type Href = Parameters<typeof getPathname>[0]["href"];
  const url = (href: Href) => SITE_URL + getPathname({ href, locale: "pt" });
  const linha = (nome: string, href: Href, nota?: string) =>
    `- [${nome}](${url(href)})${nota ? `: ${nota}` : ""}`;

  const recentes = [...artigos].sort((a, b) => b.date.localeCompare(a.date)).slice(0, ARTIGOS_RECENTES);

  const texto = [
    "# Jelly",
    "",
    "> Agência de marketing digital e inteligência artificial. Desde 2010 a ajudar empresas a comunicar e a desempenhar melhor, ligando os pontos entre estratégia de marca, marketing e tecnologia.",
    "",
    "Sediada em Lisboa, Portugal. O site existe em português, nos endereços abaixo, e em inglês, nos mesmos endereços debaixo de `/en` — o conteúdo é o mesmo, e alguns endereços mudam de palavra com a língua.",
    "",
    "## Páginas principais",
    linha("Início", "/", "o que a casa faz, em resumo"),
    linha("Sobre", "/sobre", "história, equipa e como se trabalha"),
    linha("Projetos", "/projetos", "casos com os números que os clientes validaram"),
    linha("Clientes", "/clientes", "com quem se trabalha"),
    linha("Blog", "/blog", "artigos sobre marketing, tecnologia e IA"),
    linha("Newsroom", "/newsroom", "o que se passa na casa"),
    linha("Contactos", "/contactos", "morada, telefone e formulário"),
    "",
    "## Serviços",
    ...servicos.map((s) =>
      linha(s.name.pt, { pathname: "/servicos/[slug]", params: { slug: slugFor(s, "pt") } }, s.claim.pt),
    ),
    "",
    "### Marketing, serviço a serviço",
    ...SERVICOS_DE_MARKETING.map((s) =>
      linha(s.nome.pt, { pathname: "/servicos/marketing/[sub]", params: { sub: s.slug.pt } }, s.claim.pt),
    ),
    "",
    "### Tecnologia, serviço a serviço",
    ...SERVICOS_DE_TECNOLOGIA.map((s) =>
      linha(s.nome.pt, { pathname: "/servicos/tecnologia/[sub]", params: { sub: s.slug.pt } }, s.claim.pt),
    ),
    "",
    "## Páginas em detalhe",
    "As páginas longas sobre um tema — escritas para serem lidas de ponta a ponta e citadas.",
    linha("Imunidade algorítmica", "/imunidade-algoritmica", "como não depender de uma só plataforma"),
    ...PILARES.map((p) => linha(p.titulo.pt, p.rota, p.resumo.pt)),
    "",
    "## Projetos",
    ...projetos.map((p) =>
      linha(
        p.title.pt,
        { pathname: "/projetos/[slug]", params: { slug: slugFor(p, "pt") } },
        // Há peças antigas sem ano. Melhor o cliente sozinho do que uma vírgula a olhar para o nada.
        [p.client, p.year].filter(Boolean).join(", "),
      ),
    ),
    "",
    `## Artigos recentes`,
    `São ${artigos.length} no total; ficam aqui os ${recentes.length} mais recentes, e o resto está no [blog](${url("/blog")}).`,
    ...recentes.map((a) =>
      linha(a.title.pt, { pathname: "/blog/[slug]", params: { slug: slugFor(a, "pt") } }, `${a.date}, ${a.category.pt}`),
    ),
    "",
    "## Opcional",
    `- [Mapa do site](${SITE_URL}/sitemap.xml): os 400 e tal endereços, nas duas línguas`,
    `- [Feed do blog](${SITE_URL}/rss.xml)`,
    "",
  ].join("\n");

  return new Response(texto, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, must-revalidate",
    },
  });
}
