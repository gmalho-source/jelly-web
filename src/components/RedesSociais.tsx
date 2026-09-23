import { REDES } from "@/content/redes";

/**
 * Os ícones das contas da casa, no rodapé.
 *
 * Desenhos e não palavras: são quatro, são reconhecíveis à distância de um
 * olhar, e uma lista escrita repetia a coluna do lado. Cada um leva o nome da
 * rede como etiqueta para quem não vê o desenho, e abre em janela nova — sair
 * do site para uma rede social não devia custar o caminho de volta.
 */
export function RedesSociais({ rotulo }: { rotulo: (rede: string) => string }) {
  return (
    <ul className="mt-5 flex items-center gap-4">
      {REDES.map((rede) => (
        <li key={rede.nome}>
          <a
            href={rede.url}
            target="_blank"
            rel="noreferrer"
            aria-label={rotulo(rede.nome)}
            className="block text-paper/70 transition-colors duration-200 hover:text-red"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-5 w-5">
              <path d={rede.glifo} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
