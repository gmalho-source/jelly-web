"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/*
 * Sair da página de uma pessoa é voltar à grelha — e voltar pelo histórico,
 * para a grelha ficar onde estava e o retrato voar de volta ao mosaico de onde
 * saiu. Mas só se a grelha estiver mesmo por baixo no histórico. Quem chegou
 * por um link partilhado ou pelo Google tem por baixo outro site, e o «voltar»
 * levava-o para fora da Jelly.
 *
 * O `history.length` não serve para saber: conta as entradas do separador
 * inteiro, e não diz de onde se veio. Por isso a grelha deixa marca quando está
 * no ecrã, e a marca dura enquanto se anda de pessoa em pessoa (as setas
 * substituem a entrada em vez de empilhar, e a grelha continua logo por baixo).
 * Apaga-se quando se sai para outra coisa qualquer.
 *
 * A verificação espera um tique: quando um componente sai, o que entra no lugar
 * dele ainda não está no documento.
 */
let grelhaPorBaixo = false;

const noEcra = (seletor: string) => !!document.querySelector(seletor);
const reavaliar = () =>
  window.setTimeout(() => {
    grelhaPorBaixo = noEcra("[data-grelha-equipa]") || (grelhaPorBaixo && noEcra("[data-sair-no-clique]"));
  }, 0);

/** Posta na página da grelha: diz à página da pessoa que é para lá que se volta. */
export function MarcaGrelha() {
  useEffect(() => {
    grelhaPorBaixo = true;
    return () => void reavaliar();
  }, []);
  return null;
}

/**
 * Esc, ou um clique em qualquer zona livre, fecha a página da pessoa.
 *
 * A apresentação era um diálogo, e num diálogo o Esc é do browser. Passou a
 * página, e uma página não fecha com Esc nem com um clique ao lado — mas esta
 * lê-se como uma folha que se abriu por cima da grelha, e quem a abriu com um
 * clique espera sair da mesma maneira: com a tecla, ou carregando fora do que
 * se lê. Quem não souber sai pelo link, que está lá em cima.
 *
 * «Zona livre» é tudo o que está dentro do `[data-sair-no-clique]` e não é uma
 * ligação ou um botão: o retrato, a cor à volta dele, o texto, o espaço vazio.
 * O cabeçalho e o rodapé do site ficam de fora — são da casa, não da folha.
 *
 * Duas guardas para não fechar a quem está a ler:
 * - o clique tem de começar e acabar numa zona livre. Quem arrasta a partir de
 *   uma ligação e larga ao lado não pediu para sair;
 * - se ficou texto seleccionado, o clique foi para seleccionar. Quem quer
 *   copiar uma frase da apresentação não deve perder a página a meio. Em cima
 *   do texto a saída espera um quarto de segundo, que é o que um duplo clique
 *   demora: o primeiro clique de quem selecciona uma palavra ainda não deixou
 *   nada seleccionado, e sem a espera era esse que fechava a página. No retrato
 *   e no espaço vazio não há o que seleccionar, e a saída é imediata.
 */
export function SairDaPessoa() {
  const router = useRouter();

  useEffect(() => {
    const sair = () => {
      if (grelhaPorBaixo) router.back();
      else router.push("/equipa");
    };

    const livre = (alvo: EventTarget | null) =>
      alvo instanceof Element &&
      !!alvo.closest("[data-sair-no-clique]") &&
      !alvo.closest("a, button, input, textarea, select, label, summary");

    let comecouLivre = false;
    let espera: number | undefined;
    const baixou = (evento: PointerEvent) => (comecouLivre = livre(evento.target));
    const clique = (evento: MouseEvent) => {
      window.clearTimeout(espera);
      if (evento.defaultPrevented || !comecouLivre || !livre(evento.target)) return;
      if (evento.detail > 1 || window.getSelection()?.toString()) return;
      const emTexto = (evento.target as Element).closest("h1, h2, h3, p, li, blockquote");
      if (!emTexto) return sair();
      espera = window.setTimeout(() => {
        if (!window.getSelection()?.toString()) sair();
      }, 250);
    };
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || evento.defaultPrevented) return;
      sair();
    };

    document.addEventListener("pointerdown", baixou);
    document.addEventListener("click", clique);
    window.addEventListener("keydown", tecla);
    return () => {
      window.clearTimeout(espera);
      document.removeEventListener("pointerdown", baixou);
      document.removeEventListener("click", clique);
      window.removeEventListener("keydown", tecla);
      reavaliar();
    };
  }, [router]);

  return null;
}
