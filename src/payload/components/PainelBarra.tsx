import Link from "next/link";

/**
 * A marca no topo da barra lateral.
 *
 * A barra do Payload começa directamente nos grupos de coleções, e uma barra
 * sem cabeça parece um menu solto. Aqui fica o azulejo vermelho, o nome da casa
 * e um fio a separar — e o azulejo leva ao painel, que é para onde se quer ir
 * quando se clica num logótipo.
 */
export function PainelBarra() {
  return (
    <Link href="/admin" className="painel-barra">
      <span className="painel-barra__azulejo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/jelly-wordmark-white.svg" alt="" width={22} height={10} />
      </span>
      <span className="painel-barra__nome">
        Jelly
        <span className="painel-barra__nota">Conteúdos do site</span>
      </span>
    </Link>
  );
}
