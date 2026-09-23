import Image from "next/image";

/**
 * Fita de capas em movimento contínuo. Duas cópias, para o laço não ter costura.
 * Passa pelo optimizador do Next como o resto: 22 imagens em bruto seriam
 * megabytes a mais na primeira dobra.
 *
 * Sem `priority`. Tinha-o nas oito primeiras, e o `priority` do Next não é um
 * pedido educado: escreve um `preload` na cabeça do documento. A homepage subia
 * com nove imagens pré-carregadas, e oito eram esta fita — que vive no fundo da
 * página e nem sequer está no ecrã quando alguém chega. Num telemóvel em 4G
 * lento, essas oito disputavam a largura de banda com a fotografia do topo, que
 * é o que o Google mede como LCP. Medido pelo Lighthouse: LCP de 8,9s.
 *
 * Aqui em baixo o que serve é o contrário — chegar quando a página já está de
 * pé, sem tirar nada a ninguém.
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
            className="h-[168px] w-auto shrink-0 rounded-[12px] object-cover opacity-70"
          />
        ))}
      </div>
    </div>
  );
}
