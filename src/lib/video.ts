/**
 * De um endereço para um vídeo.
 *
 * Serve o corpo dos artigos: quem escreve cola o endereço que tem à mão — a
 * barra do browser, o botão «partilhar», um ficheiro nosso — e é aqui que se
 * decide o que isso é. As formas que o YouTube usa são todas: `watch?v=`,
 * `youtu.be`, `embed`, `shorts` e as transmissões.
 *
 * Fica fora dos componentes de propósito: o servidor precisa de saber se é
 * ficheiro ou plataforma para escolher quem desenha, e o cliente precisa do
 * mesmo endereço para carregar o vídeo ao clique. Uma expressão em dois sítios
 * é uma expressão que se desencontra.
 */
export type FonteDeVideo =
  | { tipo: "youtube"; id: string; poster: string }
  | { tipo: "vimeo"; id: string }
  | { tipo: "ficheiro"; src: string };

const YOUTUBE =
  /(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([\w-]{6,})/i;
const VIMEO = /vimeo\.com\/(?:video\/)?(\d{6,})/i;
const FICHEIRO = /^https?:\/\/[^\s]+\.(?:mp4|webm|mov)(?:\?[^\s]*)?$/i;

export function fonteDeVideo(url: string | undefined): FonteDeVideo | undefined {
  const limpo = (url ?? "").trim();
  if (!limpo) return undefined;

  const youtube = YOUTUBE.exec(limpo);
  if (youtube) {
    // A miniatura vem pelo nosso otimizador, não pelo browser de quem lê: até
    // ao clique, o YouTube não sabe que alguém abriu a página.
    return { tipo: "youtube", id: youtube[1]!, poster: `https://i.ytimg.com/vi/${youtube[1]}/maxresdefault.jpg` };
  }

  const vimeo = VIMEO.exec(limpo);
  if (vimeo) return { tipo: "vimeo", id: vimeo[1]! };

  if (FICHEIRO.test(limpo)) return { tipo: "ficheiro", src: limpo };

  return undefined;
}

/**
 * Um parágrafo que não é mais do que o endereço de um vídeo é um vídeo.
 *
 * É o que permite colar o endereço numa linha e ficar feito — no painel, num
 * ficheiro Markdown importado, ou nos artigos que vieram do site antigo com o
 * endereço do ficheiro escrito a nu no meio do texto.
 */
export function videoDeParagrafo(texto: string | undefined): FonteDeVideo | undefined {
  const limpo = (texto ?? "").trim();
  if (!/^https?:\/\/\S+$/.test(limpo)) return undefined;
  return fonteDeVideo(limpo);
}
