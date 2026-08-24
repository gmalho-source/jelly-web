import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("eyebrow"), description: t("description"), alternates: alternates("/contactos", locale) };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");

  return (
    <section data-pagina="contactos" className="surface-ink mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      {/* A largura é a da coluna que o título ocupava antes — em `ch` partia-se
          palavra a palavra, porque a fonte do display é enorme e dezasseis
          caracteres não chegam a duas palavras. */}
      <div className="lg:max-w-[62%]">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="mt-5 text-display">{t("title")}</h1>
        <p className="subtitle mt-5 max-w-[42ch] text-fg-soft">{t("lead")}</p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,52%)_minmax(0,40%)] lg:justify-between">
        <ContactForm
          copy={{
            name: t("name"),
            company: t("company"),
            email: t("email"),
            phone: t("phone"),
            phoneHint: t("phoneHint"),
            message: t("message"),
            messageHint: t("messageHint"),
            start: t("start"),
            startHint: t("startHint"),
            // As opções vêm da mesma árvore de textos: uma lista de janelas
            // temporais, não uma promessa de prazo.
            startOptions: (["um-mes", "dois-tres", "mais-tarde", "nao-sei"] as const).map((valor) => ({
              value: valor,
              label: t(`startOptions.${valor}`),
            })),
            brief: t("brief"),
            briefHint: t("briefHint"),
            submit: t("submit"),
            sending: t("sending"),
            sent: t("sent"),
            sentBody: t("sentBody"),
            error: t("error"),
            invalid: t("invalid"),
            tooBig: t("tooBig"),
          }}
        />

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="eyebrow text-fg-soft">{t("office")}</h2>
            <p className="mt-2 text-md text-fg-soft">
              Rua Dom João V, 29C
              <br />
              1250-089 Lisboa
              <br />
              <a href="tel:+351915098769" className="link-quiet">
                (+351) 915 098 769
              </a>
              <br />
              <a href="mailto:hello@jelly.pt" className="link-quiet">
                hello@jelly.pt
              </a>
            </p>
          </div>
          <div className="border-t border-line pt-6">
            <h2 className="eyebrow text-fg-soft">{t("careers")}</h2>
            <p className="mt-2 text-md text-fg-soft">
              <a href="mailto:talent@jelly.pt" className="link-quiet">
                talent@jelly.pt
              </a>{" "}
              {t.rich("careersApply", {
                aqui: (texto) => (
                  <Link href="/recrutamento" className="link-quiet underline">
                    {texto}
                  </Link>
                ),
              })}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
