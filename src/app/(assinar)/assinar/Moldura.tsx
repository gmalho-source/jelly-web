import { JellyWordmark } from "@/components/JellyLogo";

/** O quadro das páginas de assinatura: o logo do site no topo, e o conteúdo. */
export function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[920px] px-5 py-10 sm:px-8 sm:py-14">
      {/* O logo do site, como no site: a etiqueta vermelha encostada ao topo. */}
      <a
        href="https://www.jelly.pt"
        aria-label="Jelly"
        className="-mt-10 mb-10 grid h-[88px] w-[88px] place-items-center bg-red transition-colors duration-200 hover:bg-red-deep sm:-mt-14"
      >
        <JellyWordmark className="w-[68px] text-paper" />
      </a>
      {children}
    </main>
  );
}
