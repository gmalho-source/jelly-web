"use client";

import { useEffect, useState } from "react";
import { useFormFields } from "@payloadcms/ui";

/**
 * O estado de um vídeo carregado: peso, codec, e se começa a tocar depressa.
 *
 * Não há aqui compressão nenhuma: o servidor nunca vê os bytes de um vídeo — é
 * essa a razão de ele poder ter 34 MB — e a Vercel não tem ffmpeg. Encolher um
 * MP4 é trabalho de quem o carrega, antes de o carregar, com `npm run
 * video:prep`. O que este painel faz é não deixar passar despercebido o que
 * está mal.
 *
 * O peso não era suficiente. O spot do Slide & Splash foi carregado em HEVC
 * (H.265) e ninguém soube: o Chrome e o Firefox não descodificam HEVC em MP4,
 * só o Safari, e no site o vídeo aparecia parado ou aos arrancos. Um aviso de
 * «43,8 MB» não diz isso. Por isso lê-se agora o próprio ficheiro.
 *
 * Como: um MP4 declara os seus codecs dentro do `moov`, e o `moov` de um
 * ficheiro bem feito está à cabeça. Pede-se o primeiro megabyte ao
 * armazenamento — que aceita pedidos por intervalo e responde a qualquer
 * origem — e procuram-se as quatro letras do codec. O mesmo megabyte diz
 * também se o `moov` vem antes do `mdat`, que é o que permite a um vídeo
 * começar a tocar antes de estar todo descarregado.
 *
 * Três réguas: dez megabytes de peso, H.264 de codec, e o índice à cabeça.
 */
const PESADO = 10 * 1024 * 1024;

const CODECS: Record<string, { nome: string; toca: boolean }> = {
  avc1: { nome: "H.264", toca: true },
  h264: { nome: "H.264", toca: true },
  hvc1: { nome: "HEVC (H.265)", toca: false },
  hev1: { nome: "HEVC (H.265)", toca: false },
  av01: { nome: "AV1", toca: true },
  vp09: { nome: "VP9", toca: true },
  vp08: { nome: "VP8", toca: true },
};

/**
 * A leitura traz consigo o endereço de que é. Sem isso, trocar de ficheiro
 * deixava o veredicto do anterior no ecrã até o novo chegar — e o caminho para
 * limpar isso era um `setState` no corpo do efeito, que provoca renders em
 * cascata. Assim compara-se e descarta-se.
 */
type Leitura =
  | { de: string; estado: "sem-resposta" }
  | { de: string; estado: "lido"; codec?: string; nome?: string; toca?: boolean; indiceACabeca?: boolean };

function comoSeLe(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

/** Percorre as caixas de topo de um MP4 à procura do `moov` e do `mdat`. */
function indiceACabeca(bytes: Uint8Array) {
  const vista = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let sitio = 0;
  while (sitio + 8 <= bytes.byteLength) {
    let tamanho = vista.getUint32(sitio);
    const tipo = String.fromCharCode(bytes[sitio + 4], bytes[sitio + 5], bytes[sitio + 6], bytes[sitio + 7]);
    if (tipo === "moov") return true;
    if (tipo === "mdat") return false;
    if (tamanho === 1) tamanho = Number(vista.getBigUint64(sitio + 8));
    if (tamanho < 8) return undefined;
    sitio += tamanho;
  }
  return undefined;
}

/**
 * As quatro letras do codec, tal como o `moov` as declara.
 *
 * Lê-se em pedaços porque `String.fromCharCode(...um milhão de bytes)` estoura
 * a pilha de chamadas. E ganha o codec que aparecer mais cedo, não o primeiro
 * da lista: as mesmas quatro letras podem cair por acidente no meio dos dados
 * de vídeo, e um ficheiro HEVC não pode passar por H.264 por causa disso.
 */
function procuraCodec(bytes: Uint8Array) {
  let letras = "";
  const passo = 32768;
  for (let i = 0; i < bytes.byteLength; i += passo) {
    letras += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + passo)));
  }
  let achado: string | undefined;
  let maisCedo = Infinity;
  for (const chave of Object.keys(CODECS)) {
    const onde = letras.indexOf(chave);
    if (onde !== -1 && onde < maisCedo) {
      maisCedo = onde;
      achado = chave;
    }
  }
  return achado;
}

export function PesoDoVideo() {
  const tamanho = useFormFields(([campos]) => campos?.filesize?.value);
  const endereco = useFormFields(([campos]) => campos?.url?.value);
  const tipo = useFormFields(([campos]) => campos?.mimeType?.value);

  const bytes = typeof tamanho === "number" ? tamanho : Number(tamanho ?? 0);
  const url = typeof endereco === "string" ? endereco : "";
  const mp4 = typeof tipo === "string" ? tipo.includes("mp4") || tipo.includes("quicktime") : false;

  const [leitura, setLeitura] = useState<Leitura>();

  useEffect(() => {
    if (!url || !mp4) return;
    let vivo = true;
    fetch(url, { headers: { Range: "bytes=0-1048575" } })
      .then((resposta) => (resposta.ok ? resposta.arrayBuffer() : Promise.reject(new Error(String(resposta.status)))))
      .then((buffer) => {
        if (!vivo) return;
        const dados = new Uint8Array(buffer);
        const codec = procuraCodec(dados);
        setLeitura({
          de: url,
          estado: "lido",
          codec,
          nome: codec ? CODECS[codec].nome : undefined,
          toca: codec ? CODECS[codec].toca : undefined,
          indiceACabeca: indiceACabeca(dados),
        });
      })
      .catch(() => vivo && setLeitura({ de: url, estado: "sem-resposta" }));
    return () => {
      vivo = false;
    };
  }, [url, mp4]);

  if (!bytes) return null;

  const pesado = bytes > PESADO;
  const lido = leitura?.de === url && leitura.estado === "lido" ? leitura : undefined;
  const codecMau = lido?.toca === false;
  const indiceAoFim = lido?.indiceACabeca === false;
  const algoMal = pesado || codecMau || indiceAoFim;

  const cor = codecMau ? "var(--theme-error-500)" : algoMal ? "var(--theme-warning-500)" : "var(--theme-elevation-500)";

  return (
    <div style={{ margin: "0 0 1.5rem", fontSize: "0.8rem", lineHeight: 1.6, color: cor }}>
      <p style={{ margin: 0 }}>
        <strong>{comoSeLe(bytes)}</strong>
        {lido?.nome ? <> · {lido.nome}</> : null}
        {!algoMal && lido ? " — bom tamanho e toca em todos os browsers." : null}
      </p>

      {codecMau ? (
        <p style={{ margin: "0.4rem 0 0" }}>
          <strong>Este vídeo não toca no Chrome nem no Firefox.</strong> Está em {lido?.nome}, que só o Safari
          descodifica em MP4 — na página pública aparece parado ou aos arrancos. Converte-o para H.264 com{" "}
          <code>npm run video:prep -- &lt;ficheiro&gt; --nome=… --filme</code> e volta a carregar por cima.
        </p>
      ) : null}

      {pesado ? (
        <p style={{ margin: "0.4rem 0 0" }}>
          Pesado para quem abrir a página num telemóvel. O <code>npm run video:prep</code> encolhe um MP4 sem se notar
          (o fundo da Imunidade foi de 6,1 MB para 407 KB).
        </p>
      ) : null}

      {indiceAoFim ? (
        <p style={{ margin: "0.4rem 0 0" }}>
          O índice do ficheiro está no fim, e por isso o browser tem de o descarregar todo antes de mostrar o primeiro
          fotograma. O <code>video:prep</code> põe-no à cabeça (<code>faststart</code>).
        </p>
      ) : null}
    </div>
  );
}

export default PesoDoVideo;
