import Image from "next/image";

/**
 * Fita de capas em movimento contínuo. Duas cópias, para o laço não ter costura.
 * Passa pelo optimizador do Next como o resto: 22 imagens em bruto seriam
 * megabytes a mais na primeira dobra.
 */
export function Marquee({ images }: { images: string[] }) {
  const strip = [...images, ...images];
  return (
    <div className="marquee overflow-hidden border-y border-paper/10">
      <div className="marquee-track flex w-max gap-3 py-3">
        {strip.map((src, index) => (
          <Image
            key={`${src}-${index}`}
            src={src}
            alt=""
            width={300}
            height={168}
            sizes="240px"
            priority={index < 8}
            className="h-[168px] w-auto shrink-0 rounded-[12px] object-cover opacity-70"
          />
        ))}
      </div>
    </div>
  );
}
