import Image from "next/image";

/**
 * Topo de página de serviço com vídeo de fundo.
 *
 * O vídeo é decoração: escuro, sem som, sete segundos em ciclo, e o que se lê é
 * o título por cima. Por isso entra como fundo e não como conteúdo — quem usa
 * leitor de ecrã não perde nada, e quem tem a rede fraca vê o primeiro
 * fotograma até o resto chegar.
 *
 * A quem pediu menos movimento fica o fotograma e mais nada. O ficheiro chega
 * ao browser de qualquer maneira; para o poupar de vez era preciso decidir no
 * cliente, e isso trocava 400 KB por um topo que só aparece depois do
 * javascript. Não vale a troca.
 */
export function ServiceHero({
  eyebrow,
  title,
  claim,
  video,
  poster,
  cta,
}: {
  eyebrow: string;
  title: string;
  claim: string;
  video?: string;
  poster?: { src: string; alt?: string };
  cta: React.ReactNode;
}) {
  return (
    <header className="surface-cover relative isolate flex min-h-[clamp(480px,78svh,900px)] flex-col justify-end overflow-hidden bg-ink pb-14 pt-[104px]">
      {poster?.src ? (
        <Image src={poster.src} alt="" fill priority sizes="100vw" className="-z-30 object-cover" />
      ) : null}

      {video ? (
        <video
          className="video-fundo absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={poster?.src}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={video} type="video/mp4" />
        </video>
      ) : null}

      {/* Escurecer, não apagar: o vídeo é tipografia em movimento e ainda se
          tem de ver por baixo do título. */}
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/94 via-ink/70 to-ink/45" />

      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="editorial mt-5 max-w-[30ch] font-display text-[clamp(32px,5.2vw,76px)] leading-[1.02] tracking-[-0.025em]">
          {title}
        </h1>
        <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-line pt-6">
          <p className="subtitle max-w-[52ch]">{claim}</p>
          <div className="ms-auto">{cta}</div>
        </div>
      </div>
    </header>
  );
}
