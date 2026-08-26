import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { bilheteLido } from "@/lib/subscricao";
import { ConfirmarSubscricao } from "./ConfirmarSubscricao";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * O segundo gesto da subscrição.
 *
 * A confirmação não acontece ao abrir a página: acontece quando se carrega no
 * botão. Parece um passo a mais, mas não é — há filtros de segurança que abrem
 * todos os links de um email antes de o entregarem, e sem o botão essas visitas
 * subscreviam pessoas que nunca carregaram em nada.
 */
export default async function ConfirmarPage({ params }: { params: Promise<{ locale: Locale; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("subscricao");

  const bilhete = bilheteLido(token);

  return (
    <section className="surface-ink mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="max-w-[52ch]">
        <span className="eyebrow">{t("eyebrow")}</span>
        {bilhete ? (
          <>
            <h1 className="mt-5 text-display">{t("confirmTitle")}</h1>
            <p className="subtitle mt-5 text-fg-soft">{t("confirmLead")}</p>
            <div className="mt-10">
              <ConfirmarSubscricao
                token={token}
                copy={{
                  button: t("confirmButton"),
                  sending: t("sending"),
                  done: t("confirmDone"),
                  doneBody: t("confirmDoneBody"),
                  erro: t("erros.geral"),
                }}
              />
            </div>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-display">{t("confirmExpiredTitle")}</h1>
            <p className="subtitle mt-5 text-fg-soft">{t("confirmExpiredLead")}</p>
          </>
        )}
      </div>
    </section>
  );
}
