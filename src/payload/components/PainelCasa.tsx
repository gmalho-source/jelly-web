import Link from "next/link";

/**
 * A faixa que abre o painel.
 *
 * O painel do Payload começa numa lista de coleções, que é uma boa lista e uma
 * má primeira linha: não diz onde se está nem o que se costuma fazer aqui. Esta
 * faixa dá as duas coisas — a casa, e os quatro caminhos que se percorrem
 * noventa por cento das vezes.
 *
 * O nome vem do utilizador da sessão quando o Payload o passa; sem ele, a frase
 * ainda faz sentido. Um painel não devia depender de uma propriedade para não
 * abrir torto.
 */
const ATALHOS = [
  { href: "/admin/collections/posts/create", label: "Escrever artigo" },
  { href: "/admin/collections/projects/create", label: "Novo projeto" },
  { href: "/admin/collections/messages", label: "Briefings recebidos" },
  { href: "/", label: "Ver o site ↗" },
];

export function PainelCasa({ user }: { user?: { name?: string | null; email?: string | null } }) {
  const primeiro = (user?.name ?? "").trim().split(/\s+/)[0];

  return (
    <div className="painel-casa">
      <div className="painel-casa__texto">
        <p className="painel-casa__etiqueta">Painel da Jelly</p>
        <p className="painel-casa__titulo">
          {primeiro ? `Olá, ${primeiro}.` : "Olá."} O que vamos mudar hoje?
        </p>
      </div>
      <div className="painel-casa__atalhos">
        {ATALHOS.map((atalho) => (
          <Link key={atalho.href} href={atalho.href} className="painel-casa__atalho">
            {atalho.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
