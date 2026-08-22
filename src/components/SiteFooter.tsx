import { getLocale, getTranslations } from "next-intl/server";
import { legalPages } from "@/content/legal";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getServices } from "@/lib/cms";
import { slugFor } from "@/lib/slugs";
import { JellyWordmark } from "./JellyLogo";

/** Rodapé ink, alto, com a marca nominativa como motivo esbatido. */
export async function SiteFooter() {
  const [nav, footer, locale, services] = await Promise.all([
    getTranslations("nav"),
    getTranslations("footer"),
    getLocale(),
    getServices(),
  ]);
  const lingua = locale as Locale;

  // Os quatro serviços do rodapé vêm do painel, não escritos aqui: é de lá que
  // sai o slug de cada língua.
  const servico = (slug: string) => {
    const encontrado = services.find((item) => item.slug === slug);
    return { pathname: "/servicos/[slug]" as const, params: { slug: encontrado ? slugFor(encontrado, lingua) : slug } };
  };

  const columns = [
    {
      title: footer("agency"),
      items: [
        { label: nav("about"), href: "/sobre" as const },
        { label: footer("careers"), href: "/sobre" as const },
        { label: nav("newsroom"), href: "/newsroom" as const },
      ],
    },
    {
      title: nav("services"),
      items: [
        { label: footer("branding"), href: servico("branding") },
        { label: footer("marketing"), href: servico("marketing") },
        { label: footer("ai"), href: servico("inteligencia-artificial") },
        { label: footer("tech"), href: servico("tecnologia") },
      ],
    },
    {
      title: footer("workCol"),
      items: [
        { label: nav("work"), href: "/projetos" as const },
        { label: nav("clients"), href: "/clientes" as const },
        { label: nav("blog"), href: "/blog" as const },
      ],
    },
  ];

  return (
    <footer className="relative min-h-[320px] overflow-hidden bg-ink text-paper">
      <JellyWordmark
        className="pointer-events-none absolute -bottom-16 -right-8 w-[46%] text-paper opacity-[0.05]"
        title=""
      />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-5 py-16 sm:px-8 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="eyebrow mb-4 text-fg-soft">{column.title}</h4>
            <ul className="flex flex-col gap-1.5">
              {column.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm text-paper/80 transition-colors duration-200 hover:text-red">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="eyebrow mb-4 text-fg-soft">{footer("contactCol")}</h4>
          <ul className="flex flex-col gap-1.5 text-sm text-paper/80">
            <li>geral@jelly.pt</li>
            <li>
              <Link href="/contactos" className="text-paper/80 transition-colors duration-200 hover:text-red">
                {footer("book")}
              </Link>
            </li>
          </ul>
        </div>
        {/* Legal e Livro de Reclamações: a lei portuguesa obriga ao segundo, e o
            primeiro é onde se responde a quem pergunta o que fazemos com dados. */}
        <div className="col-span-2 mt-8 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/10 pt-5 text-sm text-fg-soft lg:col-span-4">
          {legalPages.map((page) => (
            <Link
              key={page.slug}
              href={{ pathname: "/legal/[slug]", params: { slug: page.slug } }}
              className="transition-colors duration-200 hover:text-red"
            >
              {page.title[lingua]}
            </Link>
          ))}
          <a
            href="https://www.livroreclamacoes.pt/inicio"
            target="_blank"
            rel="noreferrer"
            className="transition-colors duration-200 hover:text-red"
          >
            {footer("complaints")}
          </a>
        </div>

        <div className="col-span-2 mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5 text-sm text-fg-soft lg:col-span-4">
          <span>Rua Dom João V, 29C · Lisboa · Jelly 2010—2026</span>
          <span className="font-display text-lg text-paper">
            be the <span className="text-red">change</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
