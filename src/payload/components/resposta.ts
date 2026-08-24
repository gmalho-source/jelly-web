/**
 * Ler a resposta de um pedido do painel sem perder a razão do erro.
 *
 * Os botões que falam com um modelo — ler um CV, escrever o resumo, descrever
 * uma imagem, preparar o email — recebiam a resposta com um `.json()` directo.
 * Serve enquanto quem responde é o nosso servidor: ele responde sempre JSON,
 * mesmo a dizer que não. Mas entre o browser e o servidor há a Vercel, e quando
 * um pedido passa do tempo é ela que responde — com uma página de erro em HTML.
 * O `.json()` estoura no primeiro «<», e o aviso que chegava a quem editava era
 * «Unexpected token '<'», que não diz nada a ninguém.
 *
 * Aqui lê-se o texto primeiro. Se for JSON, é a nossa resposta. Se não for, é
 * de outra pessoa, e o que se diz é o número e o que ele significa.
 */
const RECADOS: Record<number, string> = {
  413: "o ficheiro é grande demais para o servidor o aceitar de uma vez",
  429: "há demasiados pedidos ao mesmo tempo — tenta dentro de um minuto",
  502: "o serviço não respondeu",
  504: "o pedido passou do tempo que o servidor dá",
};

export async function leResposta<T>(resposta: Response): Promise<T> {
  const texto = await resposta.text();
  try {
    return JSON.parse(texto) as T;
  } catch {
    const recado = RECADOS[resposta.status];
    throw new Error(
      recado
        ? `${recado} (${resposta.status})`
        : `o servidor respondeu ${resposta.status} sem ser em JSON`,
    );
  }
}
