"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export type WallLogo = { src: string; name: string; width?: number; height?: number };

const INTERVALO = 5200;

/**
 * A parede de marcas da homepage.
 *
 * A grelha fica quieta e é o conteúdo que roda: a cada cinco segundos as marcas
 * dão lugar às seguintes, célula a célula, com um atraso por célula que faz o
 * bloco desfazer-se e refazer-se em onda em vez de piscar todo ao mesmo tempo.
 * Em três voltas passam as sessenta.
 *
 * Porque não rolar como os créditos de um filme: um bloco em movimento
 * permanente no meio da página rouba a leitura ao texto ao lado, e a secção
 * acima já tem uma banda a andar na horizontal. Parado, isto lê-se; e quem tem
 * "menos movimento" ligado no sistema fica com a primeira volta, quieta, que é
 * exactamente o que o site mostrava antes.
 */
export function LogoWall({ logos, perPage = 24 }: { logos: WallLogo[]; perPage?: number }) {
  const paginas = Math.max(1, Math.ceil(logos.length / perPage));
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    if (paginas < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      // Não gasta ciclos nem confunde quem volta ao separador: só roda à vista.
      if (document.visibilityState !== "visible") return;
      setPagina((atual) => (atual + 1) % paginas);
    }, INTERVALO);

    return () => window.clearInterval(timer);
  }, [paginas]);

  // A célula mantém o seu lugar; o que muda é a marca que lá está.
  const visiveis = Array.from({ length: perPage }, (unused, index) => {
    const posicao = pagina * perPage + index;
    return logos[posicao % logos.length];
  });

  return (
    <div className="mt-8 grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-6">
      {visiveis.map((logo, index) => (
        <span key={index} className="grid aspect-[5/2] place-items-center overflow-hidden bg-paper px-4">
          <Image
            // A chave muda com a marca: é o que faz o React desenhar a nova em
            // vez de reaproveitar a antiga, e o CSS anima a entrada.
            key={logo.src}
            src={logo.src}
            alt={logo.name}
            width={logo.width ?? 260}
            height={logo.height ?? 104}
            sizes="(max-width: 640px) 45vw, (max-width: 1024px) 24vw, 15vw"
            style={{ animationDelay: `${(index % 6) * 60 + Math.floor(index / 6) * 90}ms` }}
            className="logo-in max-h-[56px] w-auto max-w-full object-contain opacity-85 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
          />
        </span>
      ))}
    </div>
  );
}
