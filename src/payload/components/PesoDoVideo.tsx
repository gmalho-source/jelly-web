"use client";

import { useFormFields } from "@payloadcms/ui";

/**
 * O peso do vídeo, e um aviso quando é muito.
 *
 * Não há aqui nenhuma compressão: o servidor nunca vê os bytes de um vídeo — é
 * essa a razão de ele poder ter 34 MB — e a Vercel não tem ffmpeg. Encolher um
 * MP4 é trabalho de quem o carrega, antes de o carregar, com `npm run
 * video:prep`. O que este aviso faz é não deixar isso passar despercebido.
 *
 * A régua: dez megabytes. Acima disso, quem abre a página num telemóvel com
 * rede fraca paga a diferença, e ninguém no painel tinha como saber.
 */
const PESADO = 10 * 1024 * 1024;

function comoSeLe(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export function PesoDoVideo() {
  const tamanho = useFormFields(([campos]) => campos?.filesize?.value);
  const bytes = typeof tamanho === "number" ? tamanho : Number(tamanho ?? 0);
  if (!bytes) return null;

  const pesado = bytes > PESADO;

  return (
    <p
      style={{
        margin: "0 0 1.5rem",
        fontSize: "0.8rem",
        lineHeight: 1.5,
        color: pesado ? "var(--theme-error-500)" : "var(--theme-elevation-500)",
      }}
    >
      <strong>{comoSeLe(bytes)}</strong>
      {pesado ? (
        <>
          {" "}— pesado para quem abrir a página num telemóvel. O <code>npm run video:prep</code> encolhe um MP4 sem se
          notar (o fundo da Imunidade foi de 6,1 MB para 407 KB): encolhe e volta a carregar por cima.
        </>
      ) : (
        " — bom tamanho."
      )}
    </p>
  );
}

export default PesoDoVideo;
