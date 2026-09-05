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
      <header className="border-b border-paper-3">
        <div className="mx-auto flex w-full max-w-[920px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <JellyWordmark className="w-[72px] text-red" />
          <span className="eyebrow text-mute">{t("area")}</span>
        </div>
      </header>

      {/* O mesmo cartão branco do formulário do Monday, para quem chega daqui
          não mudar de casa quando entra. */}
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-8 sm:py-16">
        <div className="w-full max-w-[560px] rounded-[16px] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(21,23,25,0.04),0_8px_28px_rgba(21,23,25,0.06)] sm:px-10 sm:py-10">
          <h1 className="text-chapter">{t("signIn")}</h1>
          <p className="mt-3 text-[14px] text-slate">{t("intro")}</p>

          {erro === "link" ? (
            <p className="mt-5 rounded-[12px] border-l-2 border-red bg-paper p-4 text-[13px] text-slate" role="alert">
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
