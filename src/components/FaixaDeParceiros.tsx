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
 * Anda, e não é uma grelha. Em grelha, onze marcas quebravam para uma segunda
 * linha com duas a boiar, e a faixa lia-se como uma sobra. A fita é a da casa —
 * `marquee` e `marquee-track`, as mesmas da fita de capas da homepage — com a
 * máscara a apagar as pontas, e pára quando o rato lá está, que é o que torna
 * os endereços clicáveis numa coisa que anda.
 *
 * São duas cópias da mesma lista, porque o laço da casa desliza até -50% e
 * volta ao princípio: sem a segunda cópia via-se a costura. A segunda está
 * escondida de quem lê por leitor de ecrã, e os seus links estão fora do
 * caminho do teclado — é a mesma lista outra vez, não são mais parceiros.
 * `min-w-full` em cada cópia é o que segura o laço quando as marcas não chegam
 * para encher o ecrã: sem isso, uma parede de quatro logos deixava um buraco a
 * atravessar a faixa.
 *
 * Uma marca sem imagem aparece escrita, como aparecia antes. Não é um estado
 * de erro: os selos de parceiro — o da Google, o da Meta — só o próprio
 * parceiro os emite, e até lá o nome vale mais do que um buraco na fila.
 *
 * Quem tiver endereço no painel fica clicável, em separador novo. Num selo de
 * certificação isto não é decoração: o endereço é a página onde a certificação
 * se confirma, e um selo que não se pode confirmar é só um desenho.
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

function Marca({ logo, escondida }: { logo: LogoOnWall; escondida: boolean }) {
  const marca = logo.src ? (
    <Image
      src={logo.src}
      alt={escondida ? "" : logo.name}
      width={240}
      height={96}
      sizes="140px"
      className={`w-auto object-contain opacity-80 transition duration-300 group-hover:opacity-100 group-hover:grayscale-0 ${
        eSelo(logo) ? "max-h-[72px] max-w-[72px]" : "max-h-[26px] max-w-[124px] grayscale"
      }`}
    />
  ) : (
    <span className="whitespace-nowrap text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-soft transition-colors duration-200 group-hover:text-red">
      {logo.name}
    </span>
  );

  return (
    <li className="group flex shrink-0 items-center">
      {logo.link ? (
        <a
          href={logo.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center"
          {...(escondida ? { tabIndex: -1, "aria-hidden": true } : {})}
        >
          {marca}
        </a>
      ) : (
        marca
      )}
    </li>
  );
}

export function FaixaDeParceiros({ eyebrow, logos }: { eyebrow: string; logos: LogoOnWall[] }) {
  if (!logos.length) return null;

  return (
    <div className="entra mt-12">
      <span className="eyebrow text-red">{eyebrow}</span>
      <div className="marquee mt-6 overflow-hidden">
        <div className="marquee-track flex w-max">
          {[0, 1].map((copia) => (
            <ul
              key={copia}
              {...(copia === 1 ? { "aria-hidden": true } : {})}
              className="flex min-w-full shrink-0 items-center justify-around gap-x-10 pr-10"
            >
              {logos.map((logo) => (
                <Marca key={`${logo.name}|${logo.src ?? ""}`} logo={logo} escondida={copia === 1} />
              ))}
            </ul>
          ))}
        </div>
      </div>
    </div>
  );
}
