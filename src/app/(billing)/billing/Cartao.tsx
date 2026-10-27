import { JellyWordmark } from "@/components/JellyLogo";

/**
 * A moldura das páginas de entrada da área de prestadores: o cabeçalho e o
 * cartão branco do formulário do Monday, para quem chega daqui não mudar de
 * casa quando entra.
 */
export function Cartao({ area, children }: { area: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-paper-3">
        <div className="mx-auto flex w-full max-w-[920px] items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <JellyWordmark className="w-[72px] text-red" />
          <span className="eyebrow text-mute">{area}</span>
        </div>
      </header>
      <main className="flex flex-1 items-start justify-center px-5 py-12 sm:px-8 sm:py-16">
        <div className="w-full max-w-[560px] rounded-[16px] bg-white px-6 py-8 shadow-[0_1px_2px_rgba(21,23,25,0.04),0_8px_28px_rgba(21,23,25,0.06)] sm:px-10 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}

/** O aviso em caixa, com a barra vermelha à esquerda. */
export function Aviso({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 rounded-[12px] border-l-2 border-red bg-paper p-4 text-[13px] text-slate" role="alert">
      {children}
    </p>
  );
}
