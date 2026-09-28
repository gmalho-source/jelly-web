import { htmlParaMarkdown, MAPA_DE_ESTILOS } from "@/lib/docx-markdown";
import { tiraFicha, type Ficha } from "@/lib/ficha-tecnica";
import { comImpressao, impressao } from "@/lib/impressao";
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

/** A imagem com esta impressão, se já estiver na biblioteca (ver `lib/impressao.ts`). */
async function jaNaBiblioteca(marca: string): Promise<number | string | undefined> {
  const resposta = await fetch(`/api/media?where[filename][contains]=${marca}&limit=1&depth=0`, {
    credentials: "include",
  });
  if (!resposta.ok) return undefined;
  const corpo = (await resposta.json()) as { docs?: { id: number | string }[] };
  return corpo.docs?.[0]?.id;
}

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
  /** Quantas subiram agora, e quantas já estavam na biblioteca e não voltaram a subir. */
  novas: number;
  reaproveitadas: number;
};

export async function docxParaMarkdown(documento: File): Promise<LidoDoWord> {
  const mammoth = (await import("mammoth")).default;
  const base = documento.name.replace(/\.[^.]+$/, "") || "word";
  const falharam: Falha[] = [];
  let n = 0;
  let fila: Promise<unknown> = Promise.resolve();
  const semAlt: (number | string)[] = [];
  let reaproveitadas = 0;
  let novas = 0;

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
      const bytes = await img.readAsArrayBuffer();
      // A impressão é dos bytes do Word, antes de encolher: é o que se repete
      // de uma versão do documento para a outra.
      const marca = await impressao(bytes);
      const existente = await jaNaBiblioteca(marca).catch(() => undefined);
      if (existente !== undefined) {
        reaproveitadas += 1;
        return { id: existente, nova: false };
      }
      let ficheiro = new File([bytes], comImpressao(`${base}.${extensao}`, marca), { type: tipo });
      if (ficheiro.size > TECTO) {
        const menor = await encolhe(ficheiro).catch(() => null);
        if (!menor || menor.size > TECTO) throw new Error("grande demais para o servidor, e não deu para encolher");
        ficheiro = menor;
      }
      const id = await sobe(ficheiro, alt);
      novas += 1;
      return { id, nova: true };
    });
    fila = vez.catch(() => undefined);

    return vez.then(
      ({ id, nova }) => {
        // Só a que acabou de subir tem o texto alternativo genérico; a que já lá
        // estava fica com o dela.
        if (nova && !doWord) semAlt.push(id);
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
  return { markdown: htmlParaMarkdown(corpo), falharam, ficha, semAlt, novas, reaproveitadas };
}
