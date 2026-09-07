import type { ReactNode } from "react";

/**
 * Uma grelha de células de texto sobre papel — as áreas de um serviço, o que
 * fazemos num serviço de Marketing ou de Tecnologia.
 *
 * A primeira versão era `gap-px` sobre `bg-line`, com cada célula a repor o
 * fundo e a entrar com `entra`. Enquanto uma célula subia e acendia, via-se o
 * fundo cinzento da grelha por trás, e quatro células a chegar em tempos
 * diferentes faziam um tabuleiro desalinhado. O movimento desenhava a
 * estrutura em vez de a revelar.
 *
 * Aqui a estrutura está sempre inteira e no lugar. O que se mexe são as linhas
 * e o texto, em separado: as linhas horizontais nascem da esquerda, a vertical
 * entre colunas cresce de cima para baixo, e dentro de cada célula o texto sobe
 * e acende — a célula não. A da direita chega um compasso depois da da
 * esquerda, e a leitura faz-se em Z. Ao passar o rato, um fio vermelho
 * desenha-se por cima do título e o título toma a cor da casa.
 *
 * As linhas são pseudo-elementos com a coreografia em `globals.css` (`.grelha`),
 * para a grelha de duas e a de três colunas partilharem a mesma regra.
 */
type Celula = { titulo: ReactNode; corpo: ReactNode; chave: string };

export function Grelha({ colunas, celulas, className = "" }: { colunas: 2 | 3; celulas: Celula[]; className?: string }) {
  const largura = colunas === 3 ? "grelha-3 sm:grid-cols-2 lg:grid-cols-3" : "grelha-2 sm:grid-cols-2";
  return (
    <div className={`grelha grid ${largura} ${className}`}>
      {celulas.map((c, i) => (
        <article key={c.chave} className="celula group relative px-0 py-7 sm:px-7 lg:py-8">
          {/* A coluna da esquerda chega primeiro; as outras, um compasso depois. */}
          <div className={i % colunas ? "entra-tarde" : "entra"}>
            <span aria-hidden="true" className="block h-0.5 w-8 origin-left scale-x-0 bg-red transition-transform duration-300 ease-out group-hover:scale-x-100" />
            <h3 className="editorial mt-4 max-w-[26ch] text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{c.titulo}</h3>
            <p className="mt-3 max-w-[44ch] text-[15px] text-fg-soft lg:text-md">{c.corpo}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
