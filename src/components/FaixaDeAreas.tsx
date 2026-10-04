import type { Locale } from "@/i18n/routing";
import type { Area } from "@/content/marketing";
import { servicoDeMarketing } from "@/content/marketing-servicos";
import { CartaoDeArea } from "./CartaoDeArea";

/**
 * As quatro áreas de Marketing numa faixa de ponta a ponta.
 *
 * Quatro quadrados, cada um com uma cor da casa — vermelho, lavanda, coral e
 * chartreuse, a mesma ordem das áreas em todo o site — e o texto em tinta,
 * que é o que se lê sobre as quatro. Cada quadrado vira e mostra no verso as
 * páginas dos serviços da área: quem chega escolhe para onde vai.
 */
const CORES: Record<Area["chave"], string> = {
  performance: "surface-red",
  conteudo: "surface-accent-lavender",
  influencia: "surface-accent-coral",
  dados: "surface-accent-chartreuse",
};

export function FaixaDeAreas({
  areas,
  locale,
  titulo,
  rotulos,
}: {
  areas: Area[];
  locale: Locale;
  titulo: string;
  rotulos: { ver: string; voltar: string };
}) {
  return (
    <section aria-label={titulo}>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
        {areas.map((area, i) => (
          <li key={area.chave}>
            <CartaoDeArea
              numero={String(i + 1).padStart(2, "0")}
              nome={area.nome[locale]}
              resumo={area.resumo[locale]}
              servicos={area.servicos.flatMap((s) => {
                const pagina = s.sub ? servicoDeMarketing(s.sub) : undefined;
                return pagina ? [{ nome: s.nome[locale], sub: pagina.slug[locale] }] : [];
              })}
              cor={CORES[area.chave]}
              rotulos={rotulos}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
