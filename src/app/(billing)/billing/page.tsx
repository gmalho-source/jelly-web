import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JellyWordmark } from "@/components/JellyLogo";
import { currentProvider } from "@/lib/billing/session";
import { SignInForm } from "./SignInForm";

export default async function BillingSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const provider = await currentProvider();
  if (provider) redirect("/billing/faturacao");

  const { erro } = await searchParams;
  const t = await getTranslations("billing");

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-line px-5 py-5 sm:px-8">
        <JellyWordmark className="w-[72px] text-red" />
        <span className="label">{t("area")}</span>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-[520px]">
          <h1 className="text-chapter">{t("signIn")}</h1>
          <p className="mt-3 text-[14px] text-navy">{t("intro")}</p>

          {erro === "link" ? (
            <p className="mt-5 border-l-2 border-red bg-white p-4 text-[13px] text-navy" role="alert">
              {t("invalidLink")}
            </p>
          ) : null}

          <div className="mt-7">
            <SignInForm
              copy={{
                email: t("email"),
                submit: t("submit"),
                sending: t("sending"),
                sent: t("sent"),
                invalidEmail: t("invalidEmail"),
                tooMany: t("tooMany"),
                error: t("error"),
              }}
            />
          </div>

          <p className="mt-6 text-[12px] text-mute">{t("help")}</p>
        </div>
      </main>
    </div>
  );
}
