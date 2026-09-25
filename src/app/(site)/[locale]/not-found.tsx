import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export const metadata: Metadata = { robots: { index: false, follow: true } };

/**
 * A página de quem se perdeu.
 *
 * Quem chega aqui vem quase sempre de um endereço do site antigo, de um link
 * partilhado há anos ou de uma letra trocada — e o que precisa é de um sítio
 * para onde ir, não de uma piada. Por isso a frase diz o que aconteceu, o
 * número fica grande e em fundo, e o resto da página são saídas: o início, as
 * cinco portas que mais se usam, e o índice, que já está no canto de cima e
 * encontra qualquer projeto ou artigo à primeira letra.
 *
 * Serve dois casos: o endereço que não existe (pela rota `[...resto]`) e a
 * página que existe mas não tem aquilo que se pediu — um projeto ou artigo
 * apagado, que chama `notFound()`.
 */
export default async function NaoEncontrada() {
  const t = await getTranslations("notFound");
  const nav = await getTranslations("nav");

  const caminhos = [
    { href: "/projetos", label: nav("work") },
    { href: "/servicos", label: nav("services") },
    { href: "/sobre", label: nav("about") },
    { href: "/blog", label: nav("blog") },
    { href: "/contactos", label: nav("contact") },
  ] as const;

  return (
    <section className="surface-ink relative isolate overflow-clip">
      {/* O número em fundo, como a palavra do bloco da ação na homepage: diz o
          que é à primeira vista e não disputa a leitura com a frase. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-[4vw] top-1/2 -z-10 -translate-y-1/2 select-none font-display text-[clamp(220px,34vw,560px)] leading-none tracking-[-0.05em] text-paper/[0.05]"
      >
        404
      </span>

      <div className="mx-auto flex min-h-[calc(100svh-6rem)] max-w-[1200px] flex-col justify-center px-5 py-20 sm:px-8">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="mt-5 max-w-[16ch] font-display text-[clamp(40px,6.4vw,92px)] leading-[0.95] tracking-[-0.03em] text-paper">
          {t("title")}
        </h1>
        <p className="mt-6 max-w-[52ch] text-md leading-relaxed text-paper/75">{t("lead")}</p>

        <div className="mt-10">
          <Link href="/" className="btn-pill w-fit">
            {t("home")}
          </Link>
        </div>

        <nav aria-label={t("paths")} className="mt-16 border-t border-line pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fg-soft">{t("paths")}</p>
          <ul className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
            {caminhos.map((caminho) => (
              <li key={caminho.href}>
                <Link href={caminho.href} className="font-display text-xl text-paper transition-colors hover:text-red">
                  {caminho.label} <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-sm text-fg-soft">{t("search")}</p>
        </nav>
      </div>
    </section>
  );
}
