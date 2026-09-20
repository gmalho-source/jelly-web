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
 */
export function FaixaDeParceiros({ eyebrow, logos }: { eyebrow: string; logos: LogoOnWall[] }) {
  if (!logos.length) return null;

  return (
    <div className="entra mt-12">
      <span className="eyebrow text-red">{eyebrow}</span>
      <ul className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
        {logos.map((logo) => (
          <li key={`${logo.name}|${logo.src ?? ""}`} className="flex items-center">
            {logo.src ? (
              <Image
                src={logo.src}
                alt={logo.name}
                width={240}
                height={96}
                sizes="140px"
                className="max-h-[26px] w-auto max-w-[124px] object-contain opacity-80 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
              />
            ) : (
              <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-fg-soft">{logo.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
