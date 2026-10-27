import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isRegisteredProvider } from "@/lib/billing/providers";
import { currentProvider } from "@/lib/billing/session";
import { Aviso, Cartao } from "./Cartao";
import { SignInForm } from "./SignInForm";

export default async function BillingSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  // Só segue para a fatura quem tem sessão e ainda é prestador: com a sessão a
  // durar um mês, uma ficha desativada pelo meio fazia a fatura mandar para
  // aqui e isto mandar para a fatura, sem fim.
  const provider = await currentProvider();
  if (provider && (await isRegisteredProvider(provider))) redirect("/billing/faturacao");

  const { erro } = await searchParams;
  const t = await getTranslations("billing");

  return (
    <Cartao area={t("area")}>
      <h1 className="text-chapter">{t("signIn")}</h1>
      <p className="mt-3 text-[14px] text-slate">{t("intro")}</p>

      {erro === "expirado" ? (
        <Aviso>{t("expiredLink")}</Aviso>
      ) : erro === "usado" ? (
        <Aviso>{t("usedLink")}</Aviso>
      ) : erro === "link" ? (
        <Aviso>{t("invalidLink")}</Aviso>
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
    </Cartao>
  );
}
