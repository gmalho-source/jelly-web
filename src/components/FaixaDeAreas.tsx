import type { LigacaoDeArea } from "./CartaoDeArea";
import { CartaoDeArea } from "./CartaoDeArea";

/**
 * As quatro áreas de uma disciplina numa faixa de ponta a ponta — no Marketing
 * e na Tecnologia.
 *
 * Quatro quadrados, cada um com uma cor da casa — vermelho, lavanda, coral e
 * chartreuse, a mesma ordem das áreas em todo o site — e o texto em tinta,
 * que é o que se lê sobre as quatro. Cada quadrado vira e mostra no verso para
 * onde se pode ir dentro da área: quem chega escolhe.
 */
const CORES = ["surface-red", "surface-accent-lavender", "surface-accent-coral", "surface-accent-chartreuse"];

export type CartaoDaFaixa = { chave: string; nome: string; resumo: string; ligacoes: LigacaoDeArea[] };

export function FaixaDeAreas({
  cartoes,
  titulo,
  rotulos,
}: {
  cartoes: CartaoDaFaixa[];
  titulo: string;
  rotulos: { ver: string; voltar: string };
}) {
  return (
    <section aria-label={titulo}>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
        {cartoes.map((cartao, i) => (
          <li key={cartao.chave}>
            <CartaoDeArea
              numero={String(i + 1).padStart(2, "0")}
              nome={cartao.nome}
              resumo={cartao.resumo}
              ligacoes={cartao.ligacoes}
              cor={CORES[i % CORES.length]}
              rotulos={rotulos}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
