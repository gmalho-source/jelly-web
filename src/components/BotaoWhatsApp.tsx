"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/i18n/routing";
import { WHATSAPP, ligacaoWhatsApp } from "@/content/whatsapp";
import { LigacaoWhatsApp } from "./LigacaoWhatsApp";

/**
 * O botão de WhatsApp que acompanha as páginas do site, no canto de baixo à
 * direita.
 *
 * No verde do WhatsApp e não nas cores da casa: é um botão que se reconhece
 * pela cor antes de se ler, e em vermelho Jelly passava por mais um elemento
 * da página. Abre a conversa numa janela nova (no telemóvel, na aplicação),
 * com uma mensagem já escrita que a pessoa pode mudar.
 *
 * Aparece quando se começa a descer, e não à chegada: os topos têm os seus
 * próprios botões nesse canto (o da homepage ficava por baixo deste). Numa
 * página que mal tem para onde descer, aparece logo. Fica por baixo da barra
 * dos cookies, e não se imprime.
 */
const A_PARTIR_DE = 0.5; // da altura do ecrã

export function BotaoWhatsApp({ locale }: { locale: Locale }) {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const ver = () => {
      const curta = document.documentElement.scrollHeight <= window.innerHeight * 1.5;
      setVisivel(curta || window.scrollY > window.innerHeight * A_PARTIR_DE);
    };
    ver();
    window.addEventListener("scroll", ver, { passive: true });
    window.addEventListener("resize", ver);
    return () => {
      window.removeEventListener("scroll", ver);
      window.removeEventListener("resize", ver);
    };
  }, []);

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 transition-[opacity,transform] duration-300 motion-reduce:transition-none print:hidden sm:bottom-8 sm:right-8 ${
        visivel ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
      aria-hidden={!visivel}
      inert={!visivel}
    >
      <LigacaoWhatsApp
        href={ligacaoWhatsApp(locale)}
        origem="botao_flutuante"
        rotulo={WHATSAPP.rotulo[locale]}
        className="grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] transition-transform duration-200 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#25D366]"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-7 w-7">
          <path d={WHATSAPP.glifo} />
        </svg>
      </LigacaoWhatsApp>
    </div>
  );
}
