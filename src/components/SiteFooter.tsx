import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { BILLING_HOST } from "@/lib/hosts";
import { JellyWordmark } from "./JellyLogo";

/** Rodapé ink, alto, com a marca nominativa como motivo esbatido. */
export async function SiteFooter() {
  const [nav, footer] = await Promise.all([getTranslations("nav"), getTranslations("footer")]);

  const columns = [
    { title: footer("agency"), items: [nav("about"), footer("team"), footer("careers"), nav("newsroom")] },
    { title: nav("services"), items: [footer("branding"), footer("marketing"), footer("ai"), footer("tech")] },
    { title: footer("workCol"), items: [nav("work"), nav("clients"), nav("blog")] },
  ];

  return (
    <footer className="relative min-h-[320px] overflow-hidden bg-ink text-paper">
      <JellyWordmark
        className="pointer-events-none absolute -bottom-16 -right-8 w-[46%] text-paper opacity-[0.05]"
        title=""
      />
      <div className="relative mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-5 py-16 sm:px-8 lg:grid-cols-4">
        {columns.map((column) => (
          <div key={column.title}>
            <h4 className="eyebrow mb-4 text-mute">{column.title}</h4>
            <ul className="flex flex-col gap-1.5">
              {column.items.map((item) => (
                <li key={item}>
                  <span className="text-sm text-paper/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h4 className="eyebrow mb-4 text-mute">{footer("contactCol")}</h4>
          <ul className="flex flex-col gap-1.5 text-sm text-paper/80">
            <li>geral@jelly.pt</li>
            <li>{footer("book")}</li>
            <li>
              <a className="text-paper/80 transition-colors duration-200 hover:text-red" href={`https://${BILLING_HOST}`}>
                {BILLING_HOST} · {footer("providers")}
              </a>
            </li>
          </ul>
        </div>
        <div className="col-span-2 mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-white/10 pt-5 text-sm text-mute lg:col-span-4">
          <span>Rua Dom João V, 29C · Lisboa · Jelly 2010—2026</span>
          <span className="font-display text-lg text-paper">
            be the <span className="text-red">change</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
