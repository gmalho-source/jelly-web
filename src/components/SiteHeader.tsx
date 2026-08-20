import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JellyWordmark } from "./JellyLogo";

export async function SiteHeader() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/" as const, label: t("about") },
    { href: "/" as const, label: t("services") },
    { href: "/projetos" as const, label: t("work") },
    { href: "/" as const, label: t("clients") },
    { href: "/" as const, label: t("blog") },
    { href: "/" as const, label: t("newsroom") },
  ];

  return (
    <header className="flex items-center justify-between gap-6 border-b border-line px-5 py-5 sm:px-8 lg:px-14">
      <Link href="/" aria-label="Jelly">
        <JellyWordmark className="w-[68px] text-red sm:w-[84px]" />
      </Link>
      <nav className="flex items-center gap-4 text-[13px] text-navy sm:gap-5 lg:gap-7">
        {links.map((link, index) => (
          <Link
            key={`${link.label}-${index}`}
            href={link.href}
            className={index > 2 ? "hidden hover:text-ink lg:inline" : "hidden hover:text-ink sm:inline"}
          >
            {link.label}
          </Link>
        ))}
        <Link href="/" className="border-b border-red pb-0.5 text-red">
          {t("contact")}
        </Link>
      </nav>
    </header>
  );
}
