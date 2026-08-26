import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { SubscribeForm } from "./SubscribeForm";
import { copyDaSubscricao } from "./copy";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "subscricao" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/subscrever", locale) };
}

/**
 * A página onde se subscrevem as comunicações da Jelly.
 *
 * É o destino dos links que vão nos emails, nas redes e no fim dos artigos —
 * e por isso é aqui, e não no formulário do rodapé, que há espaço para dizer o
 * que a pessoa vai receber e com que frequência. É isso que faz alguém
 * subscrever ou fechar a página.
 */
export default async function SubscreverPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscricao");

  return (
    <section data-pagina="subscrever" className="surface-ink mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="lg:max-w-[62%]">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="mt-5 text-display">{t("title")}</h1>
        <p className="subtitle mt-5 max-w-[52ch] text-fg-soft">{t("lead")}</p>
      </div>

      <div className="mt-14 max-w-[42ch]">
        <SubscribeForm copy={copyDaSubscricao(t)} lingua={locale} origem="pagina" />
      </div>
    </section>
  );
}
