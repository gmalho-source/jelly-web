import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PaginaDeServico } from "@/components/PaginaDeServico";
import { marketing } from "@/content/marketing";
import { SERVICOS_DE_MARKETING, irmaos, servicoDeMarketing } from "@/content/marketing-servicos";
import { getService } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * Um serviço de Marketing, em página própria.
 *
 * Dez páginas de uma família, desenhadas pelo `PaginaDeServico` que a
 * Tecnologia também usa. O texto vive em `content/marketing-servicos.ts`; uma
 * entrada lá é uma página aqui. O que é desta família: a página-mãe, a área e
 * a unidade de medida de cada serviço, e a cor do fio de cada área.
 */
const MAE = "marketing";
const ROTA = "/servicos/marketing/[sub]" as const;

const AREAS = Object.fromEntries(marketing.lista.map((area) => [area.chave, area])) as Record<
  (typeof marketing.lista)[number]["chave"],
  (typeof marketing.lista)[number]
>;

const TONS = {
  performance: { fio: "from-red to-red-deep", contorno: "[--outline-color:var(--color-red)]" },
  conteudo: { fio: "from-red to-lavender", contorno: "[--outline-color:var(--color-lavender)]" },
  influencia: { fio: "from-red to-coral", contorno: "[--outline-color:var(--color-coral)]" },
  dados: { fio: "from-red to-chartreuse", contorno: "[--outline-color:var(--color-chartreuse)]" },
} as const;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = (params.locale as Locale) ?? "pt";
  return SERVICOS_DE_MARKETING.map((s) => ({ sub: s.slug[locale] ?? s.slug.pt }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; sub: string }> }): Promise<Metadata> {
  const { locale, sub } = await params;
  const servico = servicoDeMarketing(sub);
  if (!servico) return {};
  return {
    title: servico.nome[locale],
    description: servico.descricao[locale],
    alternates: alternates((candidate) => ({ pathname: ROTA, params: { sub: servico.slug[candidate] } }), locale),
    openGraph: { type: "website", title: servico.nome[locale], description: servico.descricao[locale], images: [{ url: `${SITE_URL}${marketing.topo.poster.src}` }] },
  };
}

export default async function ServicoDeMarketingPage({ params }: { params: Promise<{ locale: Locale; sub: string }> }) {
  const { locale, sub } = await params;
  setRequestLocale(locale);
  const servico = servicoDeMarketing(sub);
  if (!servico) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  if (servico.slug[locale] !== sub) {
    permanentRedirect(getPathname({ href: { pathname: ROTA, params: { sub: servico.slug[locale] } }, locale }));
  }

  const mae = await getService(MAE);

  return (
    <PaginaDeServico
      locale={locale}
      servico={servico}
      rota={ROTA}
      area={AREAS[servico.area]}
      tom={TONS[servico.area]}
      irmaos={irmaos(servico)}
      mae={{ nome: mae?.name[locale] ?? "Marketing", slug: mae ? slugFor(mae, locale) : MAE, lead: marketing.lead[locale] }}
      cta={{ topo: marketing.cta[locale], fecho: marketing.fecho.cta[locale] }}
    />
  );
}
