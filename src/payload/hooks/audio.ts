import type { CollectionAfterChangeHook } from "payload";

/**
 * Publicar um artigo manda gravá-lo em voz alta.
 *
 * Não é aqui que ele se grava. Ler um artigo leva dezenas de minutos — o inglês
 * na ElevenLabs, o português em pedaços de mil e quinhentos caracteres que o
 * Gemini lê e que são conferidos um a um — e isto corre dentro do Next, onde
 * uma função tem segundos para responder. Carregar em Publicar e esperar não é
 * uma opção que exista. O que se faz é um pedido de milissegundos ao GitHub, e
 * o trabalho pesado corre no workflow `audio`, lá fora, com o slug deste artigo.
 *
 * Sem isto, um artigo novo esperava pela corrida da madrugada.
 *
 * Nunca dispara em rascunho: o que ainda não está publicado ainda vai mudar, e
 * cada gravação custa — créditos de uma quota mensal em inglês, cêntimos ao
 * consumo em português.
 */

const ENDERECO = "https://api.github.com";
const WORKFLOW = "audio.yml";

type Doc = Record<string, unknown>;

/**
 * O que vai ser lido em voz alta: o título e o corpo, nas duas línguas.
 *
 * Serve para duas coisas. Saber se vale a pena regravar — mudar uma legenda ou
 * um bloco de código não muda a leitura, e não paga uma gravação nova. E travar
 * a volta ao princípio: quando o script acaba, escreve o endereço do áudio no
 * artigo, e essa escrita chega aqui como mais uma alteração. Como ele não toca
 * no título nem no corpo, a comparação dá igual e o ciclo morre aqui.
 */
const oQueSeLe = (doc: Doc | undefined) =>
  JSON.stringify([doc?.titlePt, doc?.titleEn, doc?.body, doc?.bodyEn]);

/**
 * Se vale a pena mandar gravar. Fica à parte para se poder verificar: são
 * quatro ramos, e o que está do outro lado deles é dinheiro.
 */
export function valeAPenaGravar(doc: Doc | undefined, previousDoc?: Doc) {
  if (doc?._status !== "published") return false;
  if (!doc?.audioPt || !doc?.audioEn) return true;
  return oQueSeLe(doc) !== oQueSeLe(previousDoc);
}

export const gravaOArtigoFalado: CollectionAfterChangeHook = async ({ doc, previousDoc }) => {
  const token = process.env.GITHUB_DISPATCH_TOKEN?.trim();
  const repo = process.env.GITHUB_REPO?.trim();
  const ramo = process.env.GITHUB_BRANCH?.trim();
  // Sem as três não há nada a fazer, e o painel não é sítio para dar erros de
  // configuração a quem está a escrever: o artigo fica para a corrida da noite.
  if (!token || !repo || !ramo) return doc;
  if (!valeAPenaGravar(doc, previousDoc)) return doc;

  try {
    const resposta = await fetch(`${ENDERECO}/repos/${repo}/actions/workflows/${WORKFLOW}/dispatches`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        accept: "application/vnd.github+json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ ref: ramo, inputs: { so: String(doc.slug ?? "") } }),
    });
    if (!resposta.ok) {
      console.warn(`áudio de ${doc.slug}: o GitHub respondeu ${resposta.status} ${await resposta.text()}`);
    }
  } catch (erro) {
    // Publicar não pode falhar por causa disto. O artigo fica publicado, e a
    // corrida da madrugada apanha-o à mesma.
    console.warn(`áudio de ${doc.slug}: ${erro instanceof Error ? erro.message : erro}`);
  }

  return doc;
};
