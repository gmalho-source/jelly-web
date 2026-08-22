import { Link } from "@/i18n/navigation";
import { SITE_URL } from "@/lib/seo";

type Href = Parameters<typeof Link>[0]["href"];

export type Crumb = {
  label: string;
  /** Sem endereço, é o item onde estamos: não se liga à própria página. */
  href?: Href;
  /** Caminho absoluto para o JSON-LD, quando o href é um objeto de rota. */
  path?: string;
};

/**
 * O caminho até aqui, no topo da página, e o mesmo caminho em JSON-LD para o
 * Google o desenhar nos resultados em vez de mostrar o URL cru.
 *
 * O último item não é ligação: é a página onde o leitor está. E não repete o
 * título — num artigo com um título de dez palavras, a migalha ficava com duas
 * linhas e deixava de ser uma migalha.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.path ? { item: `${SITE_URL}${item.path}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Caminho">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs uppercase tracking-[0.08em] text-fg-soft">
          {items.map((item, index) => (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {index > 0 ? (
                <span aria-hidden="true" className="text-line-strong">
                  /
                </span>
              ) : null}
              {item.href ? (
                <Link href={item.href} className="font-semibold transition-colors duration-200 hover:text-fg">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold text-fg">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
