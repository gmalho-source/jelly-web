import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPayload } from "payload";
import config from "@/../payload.config";
import type { Locale } from "@/i18n/routing";
import { aindaVale, resumoDaChave } from "@/lib/confirmacao";
import { ConfirmForm } from "./ConfirmForm";

// Um link com uma chave lá dentro não se pré-constrói nem se guarda em cache.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Params = { locale: Locale; token: string };

/**
 * A página onde quem se candidatou por fora do formulário vê o que temos.
 *
 * Não pede senha nem cria conta: a chave no endereço é a credencial, e chegou
 * ao email da própria pessoa. Vale catorze dias e morre quando for usada.
 *
 * A ficha lê-se com o controlo de acesso do Payload desligado, de propósito —
 * do outro lado não há sessão nenhuma, e o que se mostra é só o que pertence a
 * quem está a ver. Nada de identificadores internos: o formulário devolve a
 * chave, não a ficha.
 */
export default async function ConfirmarPage({ params }: { params: Promise<Params> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("confirmacao");

  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "applications",
    where: { confirmTokenHash: { equals: resumoDaChave(token) } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const ficha = docs[0];
  const vale = ficha && aindaVale(ficha.confirmSentAt) && !ficha.confirmedAt;

  if (!vale) {
    return (
      <section className="surface-ink mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="max-w-[52ch]">
          <span className="eyebrow">{t("eyebrow")}</span>
          <h1 className="mt-5 text-display">{t("expiredTitle")}</h1>
          <p className="subtitle mt-5 text-fg-soft">{t("expiredLead")}</p>
        </div>
      </section>
    );
  }

  const escolhas = (chave: "experienceOptions" | "contractOptions", valores: readonly string[]) =>
    valores.map((valor) => ({ value: valor, label: t(`${chave}.${valor}`) }));

  return (
    <section className="surface-ink mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
      <div className="max-w-[52ch]">
        <span className="eyebrow">{t("eyebrow")}</span>
        <h1 className="mt-5 text-display">{t("title")}</h1>
        <p className="subtitle mt-5 text-fg-soft">{t("lead")}</p>
      </div>

      <div className="mt-14 max-w-[52ch]">
        <ConfirmForm
          token={token}
          valores={{
            name: ficha.name ?? "",
            email: ficha.email ?? "",
            phone: ficha.phone ?? "",
            city: ficha.city ?? "",
            country: ficha.country ?? "",
            linkedin: ficha.linkedin ?? "",
            portfolio: ficha.portfolio ?? "",
            experienceYears: ficha.experienceYears ?? "",
            contractWanted: ficha.contractWanted ?? "",
          }}
          copy={{
            name: t("name"),
            email: t("email"),
            emailHint: t("emailHint"),
            phone: t("phone"),
            city: t("city"),
            country: t("country"),
            linkedin: t("linkedin"),
            portfolio: t("portfolio"),
            experience: t("experience"),
            contract: t("contract"),
            choose: t("choose"),
            experienceOptions: escolhas("experienceOptions", ["nenhuma", "menos-de-um", "um-dois", "tres-cinco", "mais-de-cinco"]),
            contractOptions: escolhas("contractOptions", ["contrato", "estagio", "freelancer"]),
            consent: t("consent"),
            newsletter: t("newsletter"),
            submit: t("submit"),
            sending: t("sending"),
            done: t("done", { nome: (ficha.name ?? "").split(" ")[0] || "" }),
            doneLead: t("doneLead"),
            erros: { name: t("erros.name"), consent: t("erros.consent"), geral: t("erros.geral") },
            deleteTitle: t("deleteTitle"),
            deleteLead: t("deleteLead"),
            delete: t("delete"),
            deleteConfirm: t("deleteConfirm"),
            deleted: t("deleted"),
            deletedLead: t("deletedLead"),
          }}
        />
      </div>
    </section>
  );
}
