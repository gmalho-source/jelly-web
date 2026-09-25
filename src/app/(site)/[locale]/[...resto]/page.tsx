import { notFound } from "next/navigation";

/**
 * Qualquer endereço que o site não conhece cai aqui, e daqui vai para o
 * `not-found.tsx` da língua — com o cabeçalho, o índice e o rodapé da casa.
 *
 * Sem esta rota, um endereço desconhecido não chegava a entrar no layout do
 * site: o Next respondia com a página dele, em inglês e sem nada da Jelly. As
 * rotas que existem ganham sempre a esta, porque um segmento que apanha tudo é
 * o último a ser tentado.
 */
export default function Desconhecido() {
  notFound();
}
