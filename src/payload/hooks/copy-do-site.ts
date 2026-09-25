import { randomBytes } from "node:crypto";
import type { CollectionAfterReadHook, CollectionBeforeChangeHook } from "payload";
import en from "../../messages/en.json";
import pt from "../../messages/pt.json";

/*
 * O caderno de copy de uma página mostra o que está no site — e não o que lá
 * estava no dia em que o caderno foi criado.
 *
 * Antes, o caderno era uma fotografia: a migração copiava as mensagens do
 * repositório para o painel uma vez, e daí em diante as duas coisas andavam
 * cada uma para seu lado. A página Sobre foi redesenhada depois, com chaves
 * novas, e o painel ficou com dez textos que o site já não usava e sem os vinte
 * e três que usava. Quem abria o painel via uma página que não era a do site.
 *
 * Agora o texto do repositório é a base e o painel guarda só o que difere dela:
 *
 * - ao ler, cada chave que o site usa aparece com o texto que está online: o do
 *   painel, se lá houver um, ou o do repositório. As chaves que o site deixou
 *   de usar não aparecem.
 * - ao gravar, um texto igual ao do repositório não se guarda. É o que deixa
 *   uma alteração feita no código chegar ao site sem ficar tapada por uma cópia
 *   antiga dela no painel — que foi o que aconteceu a «anos de casa».
 *
 * Um texto mudado no painel continua a mandar sobre o do código, como sempre.
 * A escolha de quem edita não é desfeita por um deploy.
 */

/** Chaves que são interface e não copy: ficam fora do caderno. */
const FORA = new Set([
  "home.headlineStrike",
  "home.headlineEm",
  "home.headlineRest",
  "home.headlineLead",
  "home.signature",
  "work.briefing",
  "services.ctaLead",
  "blog.featured",
  "newsroom.all",
  "contact.providers",
  "contact.providersBody",
]);

type Arvore = { [chave: string]: string | Arvore };
type Linha = { id?: string | null; key?: string | null; pt?: string | null; en?: string | null };

const achatar = (no: Arvore | string | undefined, prefixo = ""): [string, string][] =>
  no && typeof no === "object"
    ? Object.entries(no).flatMap(([chave, valor]) =>
        typeof valor === "object" ? achatar(valor, `${prefixo}${chave}.`) : [[`${prefixo}${chave}`, valor]],
      )
    : [];

/** As chaves de uma página, pela ordem do ficheiro, com o texto nas duas línguas. */
function doRepositorio(pagina: string) {
  const ingles = new Map(achatar((en as unknown as Arvore)[pagina]));
  return achatar((pt as unknown as Arvore)[pagina])
    .filter(([chave]) => !FORA.has(`${pagina}.${chave}`))
    .map(([chave, texto]) => ({ key: chave, pt: texto, en: ingles.get(chave) ?? "" }));
}

const limpo = (valor?: string | null) => (valor ?? "").trim();

export const mostrarCopyDoSite: CollectionAfterReadHook = ({ doc, context }) => {
  // O site lê com `soGuardado`: quer as edições, e junta-lhes ele o
  // repositório. Se recebesse o caderno cheio e o guardasse em cache, o texto
  // de hoje do repositório passava a valer como edição.
  if (context?.soGuardado) return doc;
  const base = doRepositorio(String(doc.key ?? ""));
  if (!base.length) return doc;

  const guardadas = new Map<string, Linha>(
    ((doc.entries ?? []) as Linha[]).map((linha) => [limpo(linha.key), linha]),
  );
  doc.entries = base.map((linha) => {
    const guardada = guardadas.get(linha.key);
    return {
      // O formulário do painel precisa de um id por linha; as que não estão
      // guardadas ganham um novo, que só vive até à gravação.
      id: guardada?.id ?? randomBytes(12).toString("hex"),
      key: linha.key,
      pt: limpo(guardada?.pt) || linha.pt,
      en: limpo(guardada?.en) || linha.en,
    };
  });
  return doc;
};

export const guardarSoOQueMuda: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const pagina = String(data.key ?? originalDoc?.key ?? "");
  const base = new Map(doRepositorio(pagina).map((linha) => [linha.key, linha]));
  if (!base.size || !Array.isArray(data.entries)) return data;

  data.entries = (data.entries as Linha[]).flatMap((linha) => {
    const doCodigo = base.get(limpo(linha.key));
    if (!doCodigo) return [];
    // Cada língua à parte: mudar só o inglês não prende o português ao texto
    // de hoje.
    const ptProprio = limpo(linha.pt) && limpo(linha.pt) !== doCodigo.pt.trim() ? linha.pt : null;
    const enProprio = limpo(linha.en) && limpo(linha.en) !== doCodigo.en.trim() ? linha.en : null;
    return ptProprio || enProprio ? [{ ...linha, pt: ptProprio, en: enProprio }] : [];
  });
  return data;
};
