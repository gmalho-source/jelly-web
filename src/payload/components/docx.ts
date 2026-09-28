import { htmlParaMarkdown, MAPA_DE_ESTILOS } from "@/lib/docx-markdown";
import { tiraFicha, type Ficha } from "@/lib/ficha-tecnica";
import { encolhe, TECTO } from "./EncolheImagem";
import { leResposta } from "./resposta";

/**
 * Um .docx → o Markdown que a importação já sabe ler, com as imagens já na
 * biblioteca.
 *
 * Corre no browser, e não no servidor, por causa das imagens: um Word com
 * fotografias passa facilmente dos 4,5 MB que a Vercel deixa entrar numa função,
 * e mandado inteiro não chegava lá. Aqui o documento abre-se, e cada imagem sobe
 * sozinha para a biblioteca — encolhida antes, se for preciso, como no
 * carregamento normal. No Markdown fica `media:ID`, que o servidor reconhece e
 * não volta a carregar. O que segue para o servidor é só texto.
 *
 * As imagens sobem uma de cada vez: um Word com trinta fotografias não abre
 * trinta pedidos de uma vez contra o servidor.
 *
 * A ficha técnica do fim (ver `lib/ficha-tecnica.ts`) é lida aqui e sai do
 * corpo antes de o documento passar a Markdown. A imagem da célula «Capa» já
 * subiu com as outras, e vai na ficha como `media:ID`.
 */

export type Falha = { origem: string; erro?: string };

// O Word guarda desenhos e gráficos em EMF e WMF. Nem o browser os desenha nem
// o servidor os converte: ficam na lista, para serem exportados à mão.
const SEM_CONVERSAO = /x-emf|x-wmf|emf|wmf/i;

async function sobe(ficheiro: File, alt: string): Promise<number | string> {
  const forma = new FormData();
  forma.append("file", ficheiro);
  forma.append("_payload", JSON.stringify({ alt }));
  const resposta = await fetch("/api/media", { method: "POST", credentials: "include", body: forma });
  const corpo = await leResposta<{ doc?: { id?: number | string }; errors?: { message?: string }[] }>(resposta);
  if (!resposta.ok || corpo.doc?.id == null) {
    throw new Error(corpo.errors?.[0]?.message ?? `o servidor respondeu ${resposta.status}`);
  }
  return corpo.doc.id;
}

export type LidoDoWord = {
  markdown: string;
  falharam: Falha[];
  ficha: Ficha | null;
  /** As imagens que subiram sem texto alternativo do Word — ficaram com um genérico. */
  semAlt: (number | string)[];
};

export async function docxParaMarkdown(documento: File): Promise<LidoDoWord> {
  const mammoth = (await import("mammoth")).default;
  const base = documento.name.replace(/\.[^.]+$/, "") || "word";
  const falharam: Falha[] = [];
  let n = 0;
  let fila: Promise<unknown> = Promise.resolve();
  const semAlt: (number | string)[] = [];

  const imagem = mammoth.images.imgElement((img) => {
    n += 1;
    const indice = n;
    const doWord = ((img as { altText?: string }).altText ?? "").trim();
    const alt = doWord || `${base} — imagem ${indice}`;
    const tipo = img.contentType || "image/png";
    const extensao = tipo.split("/")[1]?.replace(/^x-/, "").replace("jpeg", "jpg") ?? "png";
    const origem = `imagem ${indice} do Word (${extensao})`;

    const vez = fila.then(async () => {
      if (SEM_CONVERSAO.test(tipo)) throw new Error("formato do Word (EMF/WMF) — exporta-a como PNG ou JPEG");
      let ficheiro = new File([await img.readAsArrayBuffer()], `${base}-${indice}.${extensao}`, { type: tipo });
      if (ficheiro.size > TECTO) {
        const menor = await encolhe(ficheiro).catch(() => null);
        if (!menor || menor.size > TECTO) throw new Error("grande demais para o servidor, e não deu para encolher");
        ficheiro = menor;
      }
      return sobe(ficheiro, alt);
    });
    fila = vez.catch(() => undefined);

    return vez.then(
      (id) => {
        if (!doWord) semAlt.push(id);
        return { src: `media:${id}` };
      },
      (erro: unknown) => {
        falharam.push({ origem, erro: erro instanceof Error ? erro.message : "não subiu" });
        // Sem endereço, a imagem sai do texto: não fica um buraco no artigo.
        return { src: "" };
      },
    );
  });

  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer: await documento.arrayBuffer() },
    { styleMap: MAPA_DE_ESTILOS, convertImage: imagem },
  );
  const corpo = new DOMParser().parseFromString(html, "text/html").body;
  const ficha = tiraFicha(corpo);
  return { markdown: htmlParaMarkdown(corpo), falharam, ficha, semAlt };
}
