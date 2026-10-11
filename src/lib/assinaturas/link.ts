import { timingSafeEqual } from "node:crypto";
import type { Payload } from "payload";
import { withinRateLimit } from "@/lib/billing/store";
import { regista } from "./base";
import { enviar, ErroDeAssinatura, type Pedido } from "./fluxo";

/**
 * O link fixo do NDA: o prestador escreve os seus dados, confirma o email com
 * um código e assina. É o mesmo motor dos pedidos feitos no painel — o pedido
 * nasce aqui, «via link», com os dados que ele escreveu, e segue para a página
 * de assinatura de sempre.
 *
 * A ficha do prestador só é tocada no fim, quando o NDA está assinado (ver
 * `ligaAoPrestador`): até lá, alguém que preencha o formulário e desista não
 * deixa fichas a meio.
 */
export type DadosDoLink = { nome: string; email: string; telefone: string; nif: string; morada: string; documento: string };

const VALIDADE_HORAS = 48;

/** A chave do link, comparada sem dar pistas pelo tempo que demora. */
export async function chaveValida(payload: Payload, chave: string): Promise<boolean> {
  const global = (await payload.findGlobal({ slug: "nda-link", overrideAccess: true }).catch(() => null)) as { ativo?: boolean | null; chave?: string | null } | null;
  if (!global?.ativo || !global.chave || !chave) return false;
  const a = Buffer.from(global.chave);
  const b = Buffer.from(chave);
  return a.length === b.length && timingSafeEqual(a, b);
}

const limpa = (valor: unknown, limite: number) => String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, limite);

/** O que veio do formulário, arrumado — ou o que está mal, campo a campo. */
export function lerDados(corpo: Record<string, unknown>): { dados: DadosDoLink | null; erros: Partial<Record<keyof DadosDoLink, string>> } {
  const dados: DadosDoLink = {
    nome: limpa(corpo.nome, 160),
    email: limpa(corpo.email, 160).toLowerCase(),
    telefone: limpa(corpo.telefone, 40),
    nif: limpa(corpo.nif, 20).replace(/\s/g, "").toUpperCase(),
    morada: String(corpo.morada ?? "").trim().replace(/[ \t]+/g, " ").slice(0, 400),
    documento: limpa(corpo.documento, 40).toUpperCase(),
  };
  const erros: Partial<Record<keyof DadosDoLink, string>> = {};
  if (dados.nome.split(" ").length < 2) erros.nome = "Escreva o nome completo, como no documento de identificação.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.email)) erros.email = "Este email não parece certo.";
  if (dados.telefone.replace(/\D/g, "").length < 9) erros.telefone = "Indique um telefone com indicativo, se não for português.";
  if (!/^[A-Z0-9]{5,20}$/.test(dados.nif)) erros.nif = "Indique o NIF (só algarismos e, se for estrangeiro, letras).";
  else if (/^\d{9}$/.test(dados.nif) && !nifPortuguesCerto(dados.nif)) erros.nif = "Este NIF não é válido. Confirme os algarismos.";
  if (dados.morada.length < 10) erros.morada = "Indique a morada completa, com código postal e localidade.";
  if (dados.documento.length < 5) erros.documento = "Indique o número do cartão de cidadão ou do passaporte.";
  return { dados: Object.keys(erros).length ? null : dados, erros };
}

/** O algarismo de controlo do NIF português (módulo 11). */
function nifPortuguesCerto(nif: string): boolean {
  const soma = nif
    .slice(0, 8)
    .split("")
    .reduce((total, algarismo, i) => total + Number(algarismo) * (9 - i), 0);
  const resto = soma % 11;
  const controlo = resto < 2 ? 0 : 11 - resto;
  return controlo === Number(nif[8]);
}

/**
 * Cria o pedido com os dados do formulário, congela o NDA e devolve a ligação
 * da página de assinatura — para onde o prestador segue logo, sem esperar por
 * um email. O código de confirmação, esse, vai para o email que ele escreveu:
 * é o que prova que o email é dele.
 */
export async function comecarPeloLink(
  payload: Payload,
  chave: string,
  dados: DadosDoLink,
  { ip, origem }: { ip: string; origem: string },
): Promise<{ ligacao: string }> {
  if (!(await chaveValida(payload, chave))) throw new ErroDeAssinatura("Este link já não está disponível. Peça um novo a quem lho enviou.", 404);

  // Um formulário público manda emails: travões por IP e por email.
  const porIp = await withinRateLimit(`nda-link:ip:${ip}`, 6, 3600);
  const porEmail = await withinRateLimit(`nda-link:email:${dados.email}`, 3, 3600);
  if (!porIp || !porEmail) throw new ErroDeAssinatura("Já começou vários pedidos na última hora. Use o mais recente, ou tente outra vez mais tarde.", 429);

  const criado = (await payload.create({
    collection: "assinaturas",
    overrideAccess: true,
    context: { assinaturasInterno: true },
    data: {
      origem: "modelo-nda",
      tipo: "nda",
      via: "link",
      estado: "rascunho",
      titulo: `NDA — ${dados.nome}`,
      dadosDoPrestador: dados,
      signatarios: [{ nome: dados.nome, email: dados.email, papel: "contraparte", estado: "pendente" }],
      validade: new Date(Date.now() + VALIDADE_HORAS * 3_600_000).toISOString(),
    } as never,
  })) as unknown as Pedido;
  await regista(payload, criado.id, "Pedido feito pelo link do NDA", `${dados.email} · ${ip}`);

  const { ligacao } = await enviar(payload, criado.id, origem, { soLigacao: true });
  if (!ligacao) throw new ErroDeAssinatura("Não foi possível preparar o documento. Tente outra vez dentro de instantes.", 500);
  return { ligacao };
}

/* ───────────────────────── no fim: a ficha do prestador ───────────────────────── */

const CAMPOS: [keyof Omit<DadosDoLink, "email">, string][] = [
  ["nome", "Nome"],
  ["telefone", "Telefone"],
  ["nif", "NIF"],
  ["morada", "Morada"],
  ["documento", "Cartão de cidadão / passaporte"],
];

const igual = (a: string, b: string) => a.trim().replace(/\s+/g, " ").toLowerCase() === b.trim().replace(/\s+/g, " ").toLowerCase();

export type FichaDoLink = { prestadorId: number | string; criado: boolean; diferencas: string[]; nome: string };

/**
 * O NDA assinado pelo link vai para a ficha do prestador, encontrada pelo
 * email (que o código acabou de confirmar ser dele).
 *
 * Sem ficha, cria-se uma em «Parado»: só quem a Jelly qualifica entra na
 * faturação. Com ficha, preenche-se só o que estava vazio. O que ele escreveu
 * diferente do que a ficha tinha não substitui nada — uma ficha que já serve
 * para pagar não muda por um formulário público — e fica nas notas, com a
 * ficha marcada «Dados a rever».
 */
export async function ligaAoPrestador(payload: Payload, pedido: Pedido, momento: string): Promise<FichaDoLink | null> {
  const d = pedido.dadosDoPrestador;
  if (!d?.email) return null;
  const email = d.email.trim().toLowerCase();
  const dia = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "short" }).format(new Date(momento));

  const existente = (
    await payload.find({ collection: "prestadores", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })
  ).docs[0] as unknown as (Record<string, unknown> & { id: number | string; nome?: string; notas?: string | null }) | undefined;

  if (!existente) {
    const novo = await payload.create({
      collection: "prestadores",
      overrideAccess: true,
      data: {
        nome: d.nome,
        email,
        telefone: d.telefone || undefined,
        nif: d.nif || undefined,
        morada: d.morada || undefined,
        documento: d.documento || undefined,
        estado: "parado",
        tipo: "singular",
        ndaAssinado: true,
        ndaData: momento,
        notas: `Ficha criada pelo link do NDA em ${dia}.`,
      } as never,
    });
    return { prestadorId: novo.id, criado: true, diferencas: [], nome: d.nome ?? "" };
  }

  const mudancas: Record<string, unknown> = { ndaAssinado: true, ndaData: momento };
  const diferencas: string[] = [];
  const linhas: string[] = [];
  for (const [campo, rotulo] of CAMPOS) {
    const novo = String(d[campo] ?? "").trim();
    const atual = String(existente[campo] ?? "").trim();
    if (!novo) continue;
    if (!atual) mudancas[campo] = novo;
    else if (!igual(novo, atual)) {
      diferencas.push(rotulo);
      linhas.push(`• ${rotulo}: na ficha «${atual}»; no NDA «${novo}»`);
    }
  }
  if (diferencas.length) {
    mudancas.dadosARever = true;
    const nota = `NDA assinado pelo link em ${dia}, com dados diferentes dos da ficha (a ficha não mudou):\n${linhas.join("\n")}`;
    mudancas.notas = existente.notas ? `${existente.notas}\n\n${nota}` : nota;
  }
  await payload.update({ collection: "prestadores", id: existente.id, data: mudancas as never, overrideAccess: true });
  return { prestadorId: existente.id, criado: false, diferencas, nome: existente.nome ?? d.nome ?? "" };
}
