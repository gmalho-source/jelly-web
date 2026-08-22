import Image from "next/image";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";

/**
 * Cabeçalho de largura total com a capa por baixo do título.
 *
 * A capa passa de ilustração a cenário: ocupa o ecrã todo, escurece por
 * degradê, e o título assenta em cima dela. O degradê é vertical e mais denso
 * em baixo, onde está o texto — é o que garante que se lê sobre uma fotografia
 * clara sem apagar a imagem toda. Uma segunda camada, da esquerda, protege a
 * coluna de texto nos ecrãs largos.
 *
 * Sem capa não há cabeçalho escuro: um artigo sem imagem receberia uma faixa
 * preta vazia, que é pior do que a versão clara. Nesse caso desenha-se sobre
 * papel, com o mesmo desenho de tipos.
 */
export function CoverHeader({
  image,
  crumbs,
  eyebrow,
  title,
  lead,
  meta,
}: {
  image?: { src: string; alt?: string };
  crumbs: Crumb[];
  eyebrow?: string;
  title: string;
  /** Uma frase debaixo do título, quando a página é um índice. */
  lead?: string;
  /** Autor, data, minutos — a linha fina debaixo do título. */
  meta?: React.ReactNode;
}) {
  const corpo = (
    <div className="mx-auto flex w-full max-w-[1200px] flex-1 flex-col px-5 sm:px-8">
      <Breadcrumbs items={crumbs} />
      <div className="mt-auto pt-16">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className={`editorial max-w-[26ch] text-display ${eyebrow ? "mt-4" : ""}`}>{title}</h1>
        {lead ? <p className="subtitle mt-5 max-w-[54ch]">{lead}</p> : null}
        {meta ? (
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-4 text-sm text-fg-soft">
            {meta}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (!image?.src) {
    return <header className="surface-paper flex min-h-[42svh] flex-col pb-12 pt-[104px]">{corpo}</header>;
  }

  return (
    <header className="surface-cover relative isolate flex min-h-[clamp(460px,74svh,860px)] flex-col overflow-hidden bg-ink pb-14 pt-[104px]">
      <Image
        src={image.src}
        alt={image.alt ?? ""}
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      {/* Escurecer, não apagar: denso onde está o texto, leve no resto. */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/92 via-ink/55 to-ink/25" />
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/70 via-ink/10 to-transparent"
      />
      {corpo}
    </header>
  );
}
