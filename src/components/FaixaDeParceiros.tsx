import Image from "next/image";
import type { LogoOnWall } from "@/content/types";

/**
 * A faixa de parceiros e certificações, no fim de uma página de serviço.
 *
 * Os nomes estavam escritos no código, uma lista em `marketing.ts` e outra em
 * `tecnologia.ts`. Passaram a ser uma parede do painel — a de Marketing e a de
 * Tecnologia — e é por isso que isto recebe logos e não texto: quem acrescenta
 * um parceiro acrescenta-o onde acrescenta tudo o resto.
 *
 * Uma marca sem imagem aparece escrita, como aparecia antes. Não é um estado
 * de erro: os selos de parceiro — o da Google, o da Meta — só o próprio
 * parceiro os emite, e até lá o nome vale mais do que um buraco na fila.
 *
 * Quem tiver endereço no painel fica clicável, em separador novo. Num selo de
 * certificação isto não é decoração: o endereço é a página onde a certificação
 * se confirma, e um selo que não se pode confirmar é só um desenho. Em
 * separador novo porque ninguém veio a esta página para sair dela.
 */
/**
 * Um selo é quase quadrado; um logótipo é uma tira. Travados à mesma altura, a
 * tira fica bem e o selo fica uma migalha ilegível — o «Google Partner» escrito
 * por baixo do G tem sete pixéis a vinte e seis de altura. Por isso a forma do
 * ficheiro decide a altura: abaixo de 1,6 de largura por altura é selo, e um
 * selo tem o dobro do espaço. Sem medidas — o conteúdo local não as tem — trata-se
 * como tira, que é o que quase tudo é.
 */
const SELO = 1.6;
const eSelo = (logo: LogoOnWall) => Boolean(logo.width && logo.height && logo.width / logo.height < SELO);

export function FaixaDeParceiros({ eyebrow, logos }: { eyebrow: string; logos: LogoOnWall[] }) {
  if (!logos.length) return null;

  return (
    <div className="entra mt-12">
      <span className="eyebrow text-red">{eyebrow}</span>
      <ul className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
        {logos.map((logo) => {
          const marca = logo.src ? (
            <Image
              src={logo.src}
              alt={logo.name}
              width={240}
              height={96}
              sizes="140px"
              className={`w-auto object-contain opacity-80 transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 ${
                eSelo(logo) ? "max-h-[72px] max-w-[72px]" : "max-h-[26px] max-w-[124px] grayscale"
              }`}
            />
          ) : (
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-soft transition-colors duration-200 group-hover:text-red">
              {logo.name}
            </span>
          );

          return (
            <li key={`${logo.name}|${logo.src ?? ""}`} className="group flex items-center">
              {logo.link ? (
                <a href={logo.link} target="_blank" rel="noopener noreferrer" className="flex items-center">
                  {marca}
                </a>
              ) : (
                marca
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
