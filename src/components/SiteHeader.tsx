import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JellyWordmark } from "./JellyLogo";

/** Header fixo, 72px, translúcido com desfoque — o único uso de blur do site. */
export async function SiteHeader() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/sobre" as const, label: t("about"), always: true },
    { href: "/servicos" as const, label: t("services"), always: true },
    { href: "/projetos" as const, label: t("work"), always: true },
    { href: "/clientes" as const, label: t("clients"), always: false },
    { href: "/blog" as const, label: t("blog"), always: false },
    { href: "/newsroom" as const, label: t("newsroom"), always: false },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-paper-3 bg-paper/85 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex min-h-[60px] max-w-[1200px] items-center justify-between gap-6 px-5 py-3 sm:min-h-[72px] sm:px-8">
        <Link href="/" aria-label="Jelly">
          <JellyWordmark className="w-[72px] text-red sm:w-[84px]" />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate sm:gap-5 lg:gap-7">
          {links.map((link, index) => (
            <Link
              key={`${link.label}-${index}`}
              href={link.href}
              className={`${link.always ? "hidden sm:inline" : "hidden lg:inline"} transition-colors duration-200 hover:text-red`}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/contactos" className="btn">
            {t("contact")} <span aria-hidden="true">→</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
