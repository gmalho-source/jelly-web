import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { PaginaDeServico } from "@/components/PaginaDeServico";
import { tecnologia } from "@/content/tecnologia";
import { SERVICOS_DE_TECNOLOGIA, outrosDeTecnologia, servicoDeTecnologia } from "@/content/tecnologia-servicos";
import { getService } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * Um serviço de Tecnologia, em página própria.
 *
 * Quatro páginas desenhadas pelo `PaginaDeServico` do Marketing. O texto vive
 * em `content/tecnologia-servicos.ts`; uma entrada lá é uma página aqui. O que
 * é desta família: a página-mãe, a unidade de medida de cada serviço, e a cor
 * do fio. Como cada serviço é a sua área, o fim da página lista os outros três.
 */
const MAE = "tecnologia";
const ROTA = "/servicos/tecnologia/[sub]" as const;

const AREAS = Object.fromEntries(tecnologia.lista.map((s) => [s.chave, s])) as Record<
  (typeof tecnologia.lista)[number]["chave"],
  (typeof tecnologia.lista)[number]
>;

const TONS = {
  web: { fio: "from-red to-red-deep", contorno: "[--outline-color:var(--color-red)]" },
  apps: { fio: "from-red to-lavender", contorno: "[--outline-color:var(--color-lavender)]" },
  dados: { fio: "from-red to-coral", contorno: "[--outline-color:var(--color-coral)]" },
  performance: { fio: "from-red to-chartreuse", contorno: "[--outline-color:var(--color-chartreuse)]" },
} as const;

export function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = (params.locale as Locale) ?? "pt";
  return SERVICOS_DE_TECNOLOGIA.map((s) => ({ sub: s.slug[locale] ?? s.slug.pt }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; sub: string }> }): Promise<Metadata> {
  const { locale, sub } = await params;
  const servico = servicoDeTecnologia(sub);
  if (!servico) return {};
  return {
    title: servico.nome[locale],
    description: servico.descricao[locale],
    alternates: alternates((candidate) => ({ pathname: ROTA, params: { sub: servico.slug[candidate] } }), locale),
    openGraph: { type: "website", title: servico.nome[locale], description: servico.descricao[locale], images: [{ url: `${SITE_URL}${tecnologia.topo.poster.src}` }] },
  };
}

export default async function ServicoDeTecnologiaPage({ params }: { params: Promise<{ locale: Locale; sub: string }> }) {
  const { locale, sub } = await params;
  setRequestLocale(locale);
  const servico = servicoDeTecnologia(sub);
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
      irmaos={outrosDeTecnologia(servico)}
      mae={{ nome: mae?.name[locale] ?? "Tecnologia", slug: mae ? slugFor(mae, locale) : MAE, lead: tecnologia.lead[locale] }}
      cta={{ topo: tecnologia.cta[locale], fecho: tecnologia.fecho.cta[locale] }}
    />
  );
}
