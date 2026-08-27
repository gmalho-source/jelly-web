import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { getTeam } from "@/lib/cms";
import { EquipaGrelha, type Pessoa } from "./EquipaGrelha";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "equipa" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/equipa", locale) };
}

/**
 * A página da equipa.
 *
 * Herdada da do site antigo — os retratos, os nomes, as funções e as
 * apresentações são os que a casa já tinha escrito. O que muda é a forma: a cor
 * chega ao passar o rato em vez de só no clique, e a apresentação abre num
 * diálogo em vez de em ecrã cheio.
 */
export default async function EquipaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("equipa");
  const team = await getTeam();

  const pessoas: Pessoa[] = team.map((membro) => ({
    nome: membro.name,
    funcao: membro.role?.[locale] || membro.role?.pt || undefined,
    // Uma língua para as apresentações: o inglês serve o português enquanto
    // ninguém as traduzir. Um texto traduzido à pressa é pior do que o original.
    apresentacao: membro.bio?.[locale] || membro.bio?.pt || undefined,
    pb: membro.photo,
    cor: membro.photoColor,
    linkedin: membro.linkedin,
  }));

  return (
    <div className="surface-paper">
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="mt-5 text-display">{t("title")}</h1>
          </div>
          <p className="subtitle">{t("lead")}</p>
        </div>
      </section>

      <section className="mx-auto max-w-[1200px] px-5 pb-20 sm:px-8">
        <EquipaGrelha
          pessoas={pessoas}
          copy={{ open: t("open"), close: t("close"), linkedin: t("linkedin"), noBio: t("noBio") }}
        />
      </section>

      <section className="surface-red">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-5 py-14 sm:px-8">
          <div>
            <h2 className="max-w-[20ch] text-chapter text-paper">{t("ctaTitle")}</h2>
            <p className="mt-2 max-w-[42ch] text-md text-paper/75">{t("ctaLead")}</p>
          </div>
          <Link href="/recrutamento" className="btn-pill w-fit">
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
