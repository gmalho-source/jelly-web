/**
 * O retrato de quem deu um testemunho e não mandou fotografia.
 *
 * Um busto genérico em papel sobre o vermelho da casa, no mesmo círculo e no
 * mesmo tamanho das fotografias, para a assinatura não ficar coxa ao lado das
 * que têm cara. Decoração: o nome está escrito ao lado, e o leitor de ecrã não
 * precisa de ouvir «silhueta».
 *
 * As cores vêm das variáveis do tema e não de hexadecimais, para o vermelho
 * mudar com a marca se a marca mudar.
 */
export function AvatarPadrao({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={`shrink-0 rounded-full ${className}`}>
      <defs>
        <clipPath id="avatar-padrao-circulo">
          <circle cx="28" cy="28" r="28" />
        </clipPath>
      </defs>
      <g clipPath="url(#avatar-padrao-circulo)">
        <rect width="56" height="56" fill="var(--color-red)" />
        <circle cx="28" cy="22" r="9.5" fill="var(--color-paper)" />
        <path d="M7 58c1.8-11.5 10-18.5 21-18.5S47.2 46.5 49 58z" fill="var(--color-paper)" />
      </g>
    </svg>
  );
}
