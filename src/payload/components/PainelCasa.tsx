"use client";

import { useAuth } from "@payloadcms/ui";
import Link from "next/link";

/**
 * A faixa que abre o painel.
 *
 * O painel do Payload começa numa lista de coleções, que é uma boa lista e uma
 * má primeira linha: não diz onde se está nem o que se costuma fazer aqui. Esta
 * faixa dá as duas coisas — a casa, e os quatro caminhos que se percorrem
 * noventa por cento das vezes.
 *
 * O nome vem da sessão, pelo `useAuth` do painel — e não de uma propriedade que
 * o Payload pode ou não passar a um componente de cliente. Sem nome, a frase
 * ainda faz sentido: um painel não devia depender disso para abrir direito.
 */
const ATALHOS = [
  { href: "/admin/collections/posts/create", label: "Escrever artigo" },
  { href: "/admin/collections/projects/create", label: "Novo projeto" },
  { href: "/admin/collections/messages", label: "Briefings recebidos" },
  { href: "/", label: "Ver o site ↗" },
];

export function PainelCasa() {
  const { user } = useAuth<{ name?: string | null }>();
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
