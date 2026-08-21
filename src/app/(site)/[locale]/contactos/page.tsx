import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import { ContactForm } from "./ContactForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("eyebrow"), description: t("lead"), alternates: alternates("/contactos", locale) };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");

  return (
    <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
        <div>
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="mt-5 text-display">{t("title")}</h1>
        </div>
        <p className="subtitle">{t("lead")}</p>
      </div>

      <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,52%)_minmax(0,40%)] lg:justify-between">
        <ContactForm
          copy={{
            name: t("name"),
            company: t("company"),
            email: t("email"),
            message: t("message"),
            messageHint: t("messageHint"),
            submit: t("submit"),
            sending: t("sending"),
            sent: t("sent"),
            error: t("error"),
            invalid: t("invalid"),
          }}
        />

        <div className="flex flex-col gap-8">
          <div>
            <h2 className="text-xl">{t("book")}</h2>
            <p className="mt-2 text-sm text-slate">{t("bookBody")}</p>
            <a href="https://jelly.pt/calendar-gmalho" className="mt-3 inline-block text-sm font-semibold text-red">
              jelly.pt/calendar-gmalho →
            </a>
          </div>
          <div className="border-t border-paper-3 pt-6">
            <h2 className="eyebrow text-mute">{t("office")}</h2>
            <p className="mt-2 text-md text-slate">
              Rua Dom João V, 29C
              <br />
              1250-091 Lisboa
              <br />
              geral@jelly.pt
            </p>
          </div>
          <div className="border-t border-paper-3 pt-6">
            <h2 className="eyebrow text-mute">{t("careers")}</h2>
            <p className="mt-2 text-md text-slate">iwork@jelly.pt</p>
          </div>
          <p className="text-sm text-mute">{t("reply")}</p>
        </div>
      </div>
    </section>
  );
}
