import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { withPageCopy } from "@/lib/page-copy";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;

  return {
    locale,
    // A copy das páginas pode vir do CMS; sem CMS, ficam as mensagens do repositório.
    messages: await withPageCopy(locale, messages),
  };
});
