import type { ComponentProps, ReactNode } from "react";
import { Link } from "@/i18n/navigation";

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
type Celula = {
  titulo: ReactNode;
  corpo: ReactNode;
  chave: string;
  /** Quando existe, a célula inteira é um link para lá. */
  href?: ComponentProps<typeof Link>["href"];
};

export function Grelha({ colunas, celulas, className = "" }: { colunas: 2 | 3; celulas: Celula[]; className?: string }) {
  const largura = colunas === 3 ? "grelha-3 sm:grid-cols-2 lg:grid-cols-3" : "grelha-2 sm:grid-cols-2";
  return (
    <div className={`grelha grid ${largura} ${className}`}>
      {celulas.map((c, i) => (
        <article key={c.chave} className="celula group relative px-0 py-7 sm:px-7 lg:py-8">
          {/* A coluna da esquerda chega primeiro; as outras, um compasso depois. */}
          <div className={i % colunas ? "entra-tarde" : "entra"}>
            <span aria-hidden="true" className="block h-0.5 w-8 origin-left scale-x-0 bg-red transition-transform duration-300 ease-out group-hover:scale-x-100" />
            {/* Quando a célula leva a outro sítio, o link é o título: é ele que
                dá o nome ao alvo, e é ele que o teclado encontra. A seta diz que
                isto sai daqui — sem ela, uma célula clicável no meio de oito que
                o não são não se descobre. */}
            <h3 className="editorial mt-4 max-w-[26ch] text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
              {c.href ? (
                <Link href={c.href}>
                  {c.titulo}
                  <span aria-hidden="true" className="ml-2 inline-block text-red transition-transform duration-200 group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              ) : (
                c.titulo
              )}
            </h3>
            <p className="mt-3 max-w-[44ch] text-[15px] text-fg-soft lg:text-md">{c.corpo}</p>
          </div>
          {/* A área de clique, sobre a célula inteira.
              Tinha-a posto no `after` do título, que é o feitio habitual, e não
              funcionava: o `entra` anima `transform`, e um elemento transformado
              passa a ser o bloco de referência dos filhos absolutos — o `after`
              cobria o texto e não a célula. Medido: clicar no canto da célula não
              ia a lado nenhum. Aqui fora do `entra`, o `relative` que conta é o
              da célula.
              Escondida de quem lê por leitor de ecrã e fora do caminho do
              teclado: o alvo é o título, este é só a mão. */}
          {c.href ? (
            <Link href={c.href} aria-hidden="true" tabIndex={-1} className="absolute inset-0" />
          ) : null}
        </article>
      ))}
    </div>
  );
}
