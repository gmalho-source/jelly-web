import { getImageProps } from "next/image";

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
 *
 * `<img>` com os atributos que o `getImageProps` calcula, e não o componente
 * `<Image>`: são 44 imagens, e cada `<Image>` é um componente do browser que o
 * React tem de hidratar — trabalho a meio do arranque para imagens que vivem no
 * fundo da página. E sem `sizes`: a fita tem sempre 168 px de altura, por isso
 * chegam dois tamanhos (1x e 2x) em vez dos dez que o `sizes` fazia escrever em
 * cada imagem. Eram 100 KB do HTML da homepage, lidos pelo telemóvel antes de
 * mostrar o que quer que fosse.
 */
export function Marquee({ images }: { images: string[] }) {
  const imagens = images.map(
    (src) =>
      getImageProps({ src, alt: "", width: 300, height: 168, loading: "lazy" }).props,
  );
  return (
    <div className="marquee overflow-hidden border-y border-paper/10">
      <div className="marquee-track flex w-max gap-3 py-3">
        {[0, 1].map((copia) =>
          imagens.map((props, index) => (
            // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
            <img
              key={`${copia}-${index}`}
              {...props}
              className="h-[168px] w-auto shrink-0 rounded-[12px] object-cover opacity-70"
            />
          )),
        )}
      </div>
    </div>
  );
}
