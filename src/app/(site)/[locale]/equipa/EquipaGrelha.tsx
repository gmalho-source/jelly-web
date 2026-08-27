import Image from "next/image";
import { ViewTransition } from "react";
import { Link } from "@/i18n/navigation";
import { coresDaEquipa, slugDaPessoa } from "@/lib/equipa";

export type Pessoa = {
  nome: string;
  funcao?: string;
  pb?: { src: string; alt?: string };
};

/**
 * A grelha da equipa, com o gesto da página antiga traduzido.
 *
 * Lá, os retratos estavam a preto e branco, separados por dez pixels, e ao
 * passar o rato acendia-se uma cor por trás e subiam o nome e a função. É isso
 * que está aqui, com a paleta desta casa: a cor não é decoração do mosaico, é a
 * cor da pessoa — sai do nome dela e é a mesma na página dela.
 *
 * A cor chega por multiplicação sobre o retrato a preto e branco, e não por
 * baixo dele: um fundo colorido atrás de uma fotografia que ocupa o mosaico
 * inteiro nunca se veria. Multiplicar dá um duotone — os brancos do retrato
 * tomam a cor, os negros ficam negros — e é o que faz a cor parecer estar
 * dentro da pessoa e não atrás dela.
 *
 * O que se anima é a opacidade da camada e não o modo de mistura: `mix-blend`
 * muda de um valor para o outro sem passar pelo meio, e a cor entrava de golpe.
 *
 * O nome e a função ficam no documento mesmo quando não se vêem — é deles que
 * sai o nome do link para quem navega por leitor de ecrã, e por isso o retrato
 * vai com `alt` vazio, para o nome não ser dito duas vezes.
 */
export function EquipaGrelha({ pessoas }: { pessoas: Pessoa[] }) {
  const cores = coresDaEquipa(pessoas.map((pessoa) => pessoa.nome));

  return (
    <ul className="grid grid-cols-1 gap-[10px] sm:grid-cols-2 lg:grid-cols-3">
      {pessoas.map((pessoa) => {
        const slug = slugDaPessoa(pessoa.nome);
        const cor = cores.get(pessoa.nome);

        return (
          <li key={pessoa.nome}>
            <Link
              href={{ pathname: "/equipa/[slug]", params: { slug } }}
              className="group relative isolate block aspect-[3/2] overflow-clip rounded-[10px] bg-paper-3"
            >
              <ViewTransition name={`retrato-${slug}`} share="retrato" default="none">
                <span className="absolute inset-0 block">
                  {pessoa.pb ? (
                    <Image
                      src={pessoa.pb.src}
                      alt=""
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover grayscale transition-transform duration-[820ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                    />
                  ) : null}
                </span>
              </ViewTransition>

              {/* A cor da pessoa, multiplicada sobre o retrato. */}
              <span
                aria-hidden="true"
                style={{ backgroundColor: cor }}
                className="absolute inset-0 mix-blend-multiply opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100"
              />

              {/* O nome, a função e a seta: escuro por baixo para se lerem. */}
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent px-5 pb-5 pt-20 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 group-focus-visible:opacity-100 sem-rato:opacity-100">
                <span className="block">
                  <span className="block translate-y-2 font-display text-lg text-paper transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 sem-rato:translate-y-0 lg:text-xl">
                    {pessoa.nome}
                  </span>
                  {pessoa.funcao ? (
                    <span className="mt-1 block translate-y-3 text-xs uppercase tracking-[0.08em] text-paper/75 transition-transform duration-500 ease-out group-hover:translate-y-0 group-focus-visible:translate-y-0 sem-rato:translate-y-0">
                      {pessoa.funcao}
                    </span>
                  ) : null}
                </span>
                <span
                  aria-hidden="true"
                  className="-translate-x-2 pb-1 text-paper transition-transform duration-500 ease-out group-hover:translate-x-0 group-focus-visible:translate-x-0"
                >
                  →
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
