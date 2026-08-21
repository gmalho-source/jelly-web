"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";

export type RailProject = {
  slug: string;
  client: string;
  year: string;
  subtitle?: string;
  disciplines: string[];
  cover: string;
};

/**
 * O carrossel de trabalho da homepage.
 *
 * A lista chega do servidor do mais recente para o mais antigo, e o desenho do
 * servidor mostra os primeiros — é o que o Google lê e o que aparece antes de o
 * javascript correr. Depois de montar, escolhe outros tantos ao acaso do mesmo
 * lote recente: quem volta ao site não vê sempre os mesmos casos.
 *
 * A página é estática e servida de cache, por isso a variação tem de acontecer
 * no browser; ordenar no servidor daria a mesma ordem a todos até ao próximo
 * deploy.
 */
export function ProjectRail({ projects, show, archiveLabel }: { projects: RailProject[]; show: number; archiveLabel: string }) {
  const [order, setOrder] = useState<RailProject[] | null>(null);

  useEffect(() => {
    // Depois do primeiro desenho, não durante: o servidor e o cliente têm de
    // concordar no HTML antes de a ordem mudar.
    const frame = requestAnimationFrame(() => {
      // Fisher-Yates sobre uma cópia: o lote recebido fica intacto.
      const pool = [...projects];
      for (let index = pool.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        [pool[index], pool[swap]] = [pool[swap], pool[index]];
      }
      setOrder(pool.slice(0, show));
    });
    return () => cancelAnimationFrame(frame);
  }, [projects, show]);

  const visible = order ?? projects.slice(0, show);

  return (
    <div className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8 [scrollbar-width:thin]">
      {visible.map((project) => (
        <Link
          key={project.slug}
          href={{ pathname: "/projetos/[slug]", params: { slug: project.slug } }}
          aria-label={`${project.client} — ${archiveLabel}`}
          className="group w-[80vw] shrink-0 snap-start sm:w-[46vw] lg:w-[32vw]"
        >
          <span className="block overflow-hidden">
            <Image
              src={project.cover}
              alt={project.client}
              width={1200}
              height={880}
              sizes="(max-width: 640px) 80vw, (max-width: 1024px) 46vw, 32vw"
              className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
            />
          </span>
          <span className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-3">
            <span className="font-display text-2xl">{project.client}</span>
            <span className="text-xs tabular-nums text-fg-soft">{project.year}</span>
          </span>
          <span className="mt-1 block text-sm text-fg-soft">
            {project.subtitle || project.disciplines.join(" · ")}
          </span>
        </Link>
      ))}
    </div>
  );
}
