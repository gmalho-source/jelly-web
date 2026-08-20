import { getTranslations } from "next-intl/server";
import { BILLING_HOST } from "@/lib/hosts";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  return (
    <footer className="mt-16 border-t border-line px-5 py-10 sm:px-8 lg:px-14">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <p className="max-w-[46ch] text-[13px] text-mute">
          {t("providersNote")}{" "}
          <a className="text-red" href={`https://${BILLING_HOST}`}>
            {BILLING_HOST}
          </a>
        </p>
        <p className="font-display text-lg">
          Jelly — <span className="text-red">be the change</span>
        </p>
      </div>
    </footer>
  );
}
