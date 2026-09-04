import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { JellyWordmark } from "@/components/JellyLogo";
import { findProvider } from "@/lib/billing/providers";
import { currentProvider } from "@/lib/billing/session";
import { envOr } from "@/lib/env";

// O formulário de submissão de faturas, no Monday. Não é segredo, por isso
// vive aqui como valor por omissão; a variável de ambiente serve para o trocar
// sem deploy.
const FORMULARIO = "https://forms.monday.com/forms/embed/c18384d0498b636d3f3f38109d1337e7?r=use1";

export default async function InvoicePage() {
  const provider = await currentProvider();
  if (!provider) redirect("/billing?erro=link");

  const t = await getTranslations("billing");
  // A ficha pode ter sido desativada durante a sessão: sem ficha, sem página.
  const ficha = await findProvider(provider);
  if (!ficha) redirect("/billing?erro=link");
  const formUrl = envOr(process.env.NEXT_PUBLIC_MONDAY_FORM_URL, FORMULARIO);

  // O formulário do Monday recebe o email autenticado por query string, para o
  // prestador não ter de o escrever outra vez (e para não poder trocá-lo).
  const embedUrl = formUrl
    ? `${formUrl}${formUrl.includes("?") ? "&" : "?"}email=${encodeURIComponent(provider)}`
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-paper-3 px-5 py-5 sm:px-8">
        <JellyWordmark className="w-[72px] text-red" />
        <div className="flex items-center gap-3 text-sm text-slate">
          <span>{ficha.nome}</span>
          <form action="/billing/sair" method="post">
            <button type="submit" className="text-sm font-semibold text-red hover:underline">
              {t("signOut")}
            </button>
          </form>
        </div>
      </header>

      <main className="px-5 py-10 sm:px-8">
        <h1 className="text-chapter">{t("submitInvoice")}</h1>
        <p className="mt-3 max-w-[52ch] text-[14px] text-slate">{t("invoiceIntro")}</p>

        <div className="mt-7 max-w-[860px] border border-paper-3 bg-white">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title={t("submitInvoice")}
              className="h-[720px] w-full border-0"
              // O formulário é servido pelo Monday; nada aqui lê o seu conteúdo.
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
            />
          ) : (
            <p className="p-6 text-[13px] text-mute">{t("formUnavailable")}</p>
          )}
        </div>

        <p className="mt-5 max-w-[52ch] border-l-2 border-lime bg-white p-4 text-[13px] text-slate">
          {t("phase2")}
        </p>
      </main>
    </div>
  );
}
