"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Esc fecha a página da pessoa.
 *
 * A apresentação era um diálogo, e num diálogo o Esc é do browser. Passou a
 * página, e uma página não fecha com Esc — mas esta lê-se como uma folha que se
 * abriu por cima da grelha, e quem a abriu com um clique espera sair com a
 * tecla. Custa cinco linhas e não tira nada a ninguém: quem não souber sai pelo
 * link, que está lá em baixo.
 *
 * Volta pelo histórico quando há histórico, para a grelha ficar onde estava e o
 * retrato voltar ao mosaico de onde saiu. Sem histórico — quem chegou a esta
 * página por um link de fora — vai para a grelha.
 */
export function SairComEsc() {
  const router = useRouter();

  useEffect(() => {
    const tecla = (evento: KeyboardEvent) => {
      if (evento.key !== "Escape" || evento.defaultPrevented) return;
      if (window.history.length > 1) router.back();
      else router.push("/equipa");
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [router]);

  return null;
}
