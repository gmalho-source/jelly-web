import type { Payload } from "payload";
import { regista } from "@/lib/assinaturas/base";
import { guardarPdf } from "@/lib/assinaturas/ficheiros";
import { enviar } from "@/lib/assinaturas/fluxo";
import { geraDocumento } from "@/lib/assinaturas/pdf";
import { assinaConvite, lerConvite } from "@/lib/assinaturas/segredo";
import { withinRateLimit } from "@/lib/billing/store";
import { enviaEmail } from "@/lib/email";
import { CASA, botao, escapa, p, papel, recibo } from "@/lib/email-papel";
import { blocosDoDebito, ibanCerto } from "./modelo";

/**
 * O caminho de uma autorização de débito direto:
 *
 *   enviarConvite → a Jelly manda ao contacto do cliente uma ligação para
 *                   preencher (válida 30 dias);
 *   abrirConvite  → o cliente abre-a (fica «Aberta»);
 *   preencher     → escreve a empresa, o NIF, a morada, o IBAN e quem assina;
 *                   sai o documento, com a referência, e segue para a página
 *                   de assinatura de sempre — ou, se quem assina é outra
 *                   pessoa, vai-lhe a ligação por email;
 *   aoAssinar     → chamado pelo motor das assinaturas quando fecha: a
 *                   autorização fica «Assinada», e uma anterior do mesmo NIF
 *                   fica «Substituída».
 */
const COLECAO = "debitos-diretos";
const VALIDADE_DIAS = 30;

export class ErroDeDebito extends Error {
  constructor(
    message: string,
    public estado = 400,
  ) {
    super(message);
  }
}

export type Autorizacao = {
  id: number | string;
  estado: string;
  tipo: "nova" | "alteracao";
  empresa: string;
  contactoNome: string;
  contactoEmail: string;
  mensagem?: string | null;
  referencia?: string | null;
  nif?: string | null;
  morada?: string | null;
  iban?: string | null;
  recorrente?: boolean | null;
  signatarioNome?: string | null;
  signatarioCargo?: string | null;
  signatarioEmail?: string | null;
  enviadaEm?: string | null;
  abertaEm?: string | null;
  validade?: string | null;
  via?: "painel" | "link" | null;
  pedido?: number | string | { id: number | string; estado?: string } | null;
};

const interno = { context: { debitoInterno: true } } as const;
const idDe = (valor: unknown) => (valor && typeof valor === "object" ? (valor as { id: number | string }).id : (valor as number | string | null | undefined));

async function ler(payload: Payload, id: string | number): Promise<Autorizacao> {
  const doc = (await payload.findByID({ collection: COLECAO, id, depth: 1, overrideAccess: true }).catch(() => null)) as unknown as Autorizacao | null;
  if (!doc) throw new ErroDeDebito("Esta autorização não existe.", 404);
  return doc;
}

const FECHADAS = ["assinada", "registada", "revogada", "substituida", "cancelada"];

/* ─────────────────────────────── enviar ─────────────────────────────── */

export async function enviarConvite(payload: Payload, id: string, origem: string): Promise<{ para: string }> {
  const a = await ler(payload, id);
  if (FECHADAS.includes(a.estado)) throw new ErroDeDebito("Esta autorização já não está à espera do cliente.");
  const validade = new Date(Date.now() + VALIDADE_DIAS * 86_400_000);
  const token = await assinaConvite("debito", String(a.id), validade);
  const resultado = await enviaEmail(convite(a, `${origem}/assinar/debito/${token}`, validade));
  if (!resultado.ok) throw new ErroDeDebito(`O email não saiu: ${resultado.erro ?? "sem razão"}`, 502);
  await payload.update({
    collection: COLECAO,
    id: a.id,
    data: {
      estado: a.estado === "aberta" ? "aberta" : "enviada",
      validade: validade.toISOString(),
      ...(a.enviadaEm ? {} : { enviadaEm: new Date().toISOString() }),
    } as never,
    overrideAccess: true,
    ...interno,
  });
  return { para: a.contactoEmail };
}

/* ─────────────────────────────── o lado do cliente ─────────────────────────────── */

/** A ligação → a autorização, ou a razão por que não abre. */
export async function abrirConvite(payload: Payload, token: string, marcarAberta = false): Promise<Autorizacao> {
  const id = await lerConvite(token, "debito");
  if (!id) throw new ErroDeDebito("Esta ligação já não é válida. Pode ter expirado — peça uma nova a quem lha enviou.", 410);
  const a = await ler(payload, id).catch(() => null);
  if (!a) throw new ErroDeDebito("Esta autorização já não existe.", 404);
  if (["cancelada", "revogada", "substituida"].includes(a.estado)) throw new ErroDeDebito("Esta autorização foi cancelada. Se precisar, peça uma nova.", 410);
  if (a.estado === "expirada") throw new ErroDeDebito("Esta ligação expirou. Peça uma nova a quem lha enviou.", 410);
  if (marcarAberta && !a.abertaEm && a.estado === "enviada") {
    await payload.update({ collection: COLECAO, id: a.id, data: { estado: "aberta", abertaEm: new Date().toISOString() } as never, overrideAccess: true, ...interno });
  }
  return a;
}

export type DadosDoCliente = {
  empresa: string;
  nif: string;
  morada: string;
  iban: string;
  recorrente: boolean;
  signatarioNome: string;
  signatarioCargo: string;
  signatarioEmail: string;
};

const limpa = (valor: unknown, limite: number) => String(valor ?? "").trim().replace(/\s+/g, " ").slice(0, limite);

/** O que veio do formulário, arrumado — ou o que está mal, campo a campo. */
export function lerDadosDoCliente(corpo: Record<string, unknown>): { dados: DadosDoCliente | null; erros: Partial<Record<keyof DadosDoCliente, string>> } {
  const dados: DadosDoCliente = {
    empresa: limpa(corpo.empresa, 200),
    nif: limpa(corpo.nif, 20).replace(/\s/g, "").toUpperCase().replace(/^PT(?=\d{9}$)/, ""),
    morada: String(corpo.morada ?? "").trim().replace(/[ \t]+/g, " ").slice(0, 400),
    iban: limpa(corpo.iban, 40).replace(/\s/g, "").toUpperCase(),
    recorrente: corpo.recorrente !== false && corpo.recorrente !== "false",
    signatarioNome: limpa(corpo.signatarioNome, 160),
    signatarioCargo: limpa(corpo.signatarioCargo, 120),
    signatarioEmail: limpa(corpo.signatarioEmail, 160).toLowerCase(),
  };
  const erros: Partial<Record<keyof DadosDoCliente, string>> = {};
  if (dados.empresa.length < 2) erros.empresa = "Indique o nome da empresa, como está na certidão.";
  if (!/^[A-Z0-9]{5,20}$/.test(dados.nif)) erros.nif = "Indique o NIF da empresa.";
  else if (/^\d{9}$/.test(dados.nif) && !nifCerto(dados.nif)) erros.nif = "Este NIF não é válido. Confirme os algarismos.";
  if (dados.morada.length < 10) erros.morada = "Indique a morada da sede, com código postal e localidade.";
  if (!ibanCerto(dados.iban)) erros.iban = "Este IBAN não é válido. Confirme os algarismos.";
  if (dados.signatarioNome.split(" ").length < 2) erros.signatarioNome = "Escreva o nome completo de quem assina.";
  if (dados.signatarioCargo.length < 2) erros.signatarioCargo = "Indique o cargo (por exemplo, gerente ou administrador).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(dados.signatarioEmail)) erros.signatarioEmail = "Este email não parece certo.";
  return { dados: Object.keys(erros).length ? null : dados, erros };
}

function nifCerto(nif: string): boolean {
  const soma = nif
    .slice(0, 8)
    .split("")
    .reduce((total, algarismo, i) => total + Number(algarismo) * (9 - i), 0);
  const resto = soma % 11;
  return (resto < 2 ? 0 : 11 - resto) === Number(nif[8]);
}

/** 501029938-ADD-0002: o NIF do cliente e o número da autorização dele. */
async function novaReferencia(payload: Payload, nif: string): Promise<string> {
  const { docs } = await payload.find({
    collection: COLECAO,
    where: { referencia: { like: `${nif}-ADD-` } },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  });
  const usados = (docs as unknown as { referencia?: string }[])
    .map((d) => Number(d.referencia?.match(new RegExp(`^${nif}-ADD-(\\d+)$`))?.[1] ?? 0))
    .filter(Boolean);
  return `${nif}-ADD-${String((usados.length ? Math.max(...usados) : 0) + 1).padStart(4, "0")}`;
}

/**
 * O cliente preencheu: sai o documento e o pedido de assinatura. Se já tinha
 * preenchido antes (para corrigir um IBAN, por exemplo), o pedido anterior é
 * cancelado — só o último documento se pode assinar.
 */
export async function preencher(
  payload: Payload,
  token: string,
  dados: DadosDoCliente,
  { ip, origem }: { ip: string; origem: string },
): Promise<{ ligacao?: string; enviadoPara?: string }> {
  const a = await abrirConvite(payload, token);
  if (FECHADAS.includes(a.estado)) throw new ErroDeDebito("Esta autorização já foi assinada.", 409);
  if (!(await withinRateLimit(`debito:${a.id}`, 8, 3600))) throw new ErroDeDebito("Demasiadas tentativas na última hora. Tente mais tarde.", 429);
  return preparaDocumento(payload, a, dados, { ip, origem });
}

/**
 * Pelo link único: não há convite antes — a autorização nasce aqui, com quem
 * preencheu como contacto, já «Aberta» e válida 48 horas. Se o NIF já tiver
 * uma autorização em vigor, esta é uma alteração (e substitui-a ao ser
 * assinada).
 */
export async function preencherPeloLink(
  payload: Payload,
  chave: string,
  dados: DadosDoCliente,
  quemPreenche: { nome: string; email: string },
  { ip, origem }: { ip: string; origem: string },
): Promise<{ ligacao?: string; enviadoPara?: string }> {
  const { chaveDoLinkValida } = await import("@/payload/globals/link-com-chave");
  if (!(await chaveDoLinkValida(payload, "debito-link", chave))) throw new ErroDeDebito("Este link já não está disponível. Peça o link atual à Jelly.", 404);
  const porIp = await withinRateLimit(`debito-link:ip:${ip}`, 6, 3600);
  const porEmail = await withinRateLimit(`debito-link:email:${quemPreenche.email}`, 3, 3600);
  if (!porIp || !porEmail) throw new ErroDeDebito("Já começou vários pedidos na última hora. Use o mais recente, ou tente outra vez mais tarde.", 429);

  // A mesma pessoa a corrigir o que preencheu (outro IBAN, um erro no nome):
  // reaproveita a autorização aberta que já tinha, em vez de criar outra.
  const aberta = (
    await payload.find({
      collection: COLECAO,
      where: {
        and: [
          { via: { equals: "link" } },
          { nif: { equals: dados.nif } },
          { contactoEmail: { equals: quemPreenche.email } },
          { estado: { equals: "aberta" } },
          { validade: { greater_than: new Date().toISOString() } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
  ).docs[0] as unknown as Autorizacao | undefined;
  if (aberta) return preparaDocumento(payload, aberta, dados, { ip, origem });

  const emVigor = await payload.find({
    collection: COLECAO,
    where: { and: [{ nif: { equals: dados.nif } }, { estado: { in: ["assinada", "registada"] } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const agora = new Date();
  const criada = (await payload.create({
    collection: COLECAO,
    overrideAccess: true,
    ...interno,
    data: {
      via: "link",
      estado: "aberta",
      tipo: emVigor.docs.length ? "alteracao" : "nova",
      empresa: dados.empresa,
      contactoNome: quemPreenche.nome,
      contactoEmail: quemPreenche.email,
      abertaEm: agora.toISOString(),
      validade: new Date(agora.getTime() + LINK_HORAS * 3_600_000).toISOString(),
    } as never,
  })) as unknown as Autorizacao;
  return preparaDocumento(payload, criada, dados, { ip, origem });
}

/** Quanto tempo uma autorização pedida pelo link espera pela assinatura. */
const LINK_HORAS = 48;

/** O documento, o pedido de assinatura, e para onde segue — nos dois caminhos. */
async function preparaDocumento(
  payload: Payload,
  a: Autorizacao,
  dados: DadosDoCliente,
  { ip, origem }: { ip: string; origem: string },
): Promise<{ ligacao?: string; enviadoPara?: string }> {
  const referencia = a.referencia && a.nif === dados.nif ? a.referencia : await novaReferencia(payload, dados.nif);

  const anterior = idDe(a.pedido);
  if (anterior) {
    await payload
      .update({ collection: "assinaturas", id: anterior, data: { estado: "cancelado" } as never, overrideAccess: true, context: { assinaturasInterno: true } })
      .catch(() => null);
    await regista(payload, anterior, "Cancelado: o cliente voltou a preencher a autorização", null).catch(() => null);
  }

  const titulo = `Autorização de débito direto — ${dados.empresa}`;
  const bytes = await geraDocumento(blocosDoDebito({ ...dados, referencia, tipo: a.tipo }), {
    cabecalho: `Autorização de débito direto SEPA · ${CASA.legal}`,
    referencia,
    titulo: "Autorização de Débito Direto SEPA",
    logo: true,
  });
  const pdf = await guardarPdf(payload, bytes, `${referencia}-documento`);

  const pedido = await payload.create({
    collection: "assinaturas",
    overrideAccess: true,
    context: { assinaturasInterno: true },
    data: {
      origem: "pdf",
      tipo: "debito-direto",
      via: "painel",
      estado: "rascunho",
      titulo,
      pdf,
      outraParte: { nome: dados.empresa, nif: dados.nif },
      signatarios: [{ nome: dados.signatarioNome, email: dados.signatarioEmail, cargo: dados.signatarioCargo, papel: "contraparte", estado: "pendente" }],
      validade: a.validade ?? new Date(Date.now() + VALIDADE_DIAS * 86_400_000).toISOString(),
    } as never,
  });
  await regista(payload, pedido.id, a.via === "link" ? "Pedido feito pelo link dos débitos diretos" : "Pedido feito pela autorização de débito direto", `${referencia} · ${ip}`);

  await payload.update({
    collection: COLECAO,
    id: a.id,
    data: {
      ...dados,
      referencia,
      pedido: pedido.id,
      estado: "aberta",
      ...(a.abertaEm ? {} : { abertaEm: new Date().toISOString() }),
    } as never,
    overrideAccess: true,
    ...interno,
  });

  // Quem preenche é quem assina: segue já para a assinatura. Se assina outra
  // pessoa (a gerência, por exemplo), é a ela que vai a ligação, por email.
  if (dados.signatarioEmail === a.contactoEmail.trim().toLowerCase()) {
    const { ligacao } = await enviar(payload, pedido.id, origem, { soLigacao: true });
    return { ligacao };
  }
  const resultado = await enviar(payload, pedido.id, origem);
  if (resultado.falhados.length) throw new ErroDeDebito("Não conseguimos enviar o email a quem assina. Confirme o endereço.", 502);
  return { enviadoPara: dados.signatarioEmail };
}

/* ─────────────────────────────── no fim ─────────────────────────────── */

export type DebitoAssinado = { referencia: string; empresa: string; substituidas: string[] };

/** Chamado quando o pedido de assinatura fecha. */
export async function aoAssinar(payload: Payload, pedidoId: string | number, momento: string): Promise<DebitoAssinado | null> {
  const { docs } = await payload.find({ collection: COLECAO, where: { pedido: { equals: pedidoId } }, limit: 1, depth: 0, overrideAccess: true });
  const a = docs[0] as unknown as Autorizacao | undefined;
  if (!a) return null;
  await payload.update({ collection: COLECAO, id: a.id, data: { estado: "assinada", assinadaEm: momento } as never, overrideAccess: true, ...interno });

  // Uma autorização anterior do mesmo cliente deixa de valer.
  const substituidas: string[] = [];
  if (a.nif) {
    const antigas = await payload.find({
      collection: COLECAO,
      where: { and: [{ nif: { equals: a.nif } }, { id: { not_equals: a.id } }, { estado: { in: ["assinada", "registada"] } }] },
      limit: 50,
      depth: 0,
      overrideAccess: true,
    });
    for (const antiga of antigas.docs as unknown as Autorizacao[]) {
      await payload.update({ collection: COLECAO, id: antiga.id, data: { estado: "substituida", substituidaPor: a.id } as never, overrideAccess: true, ...interno });
      if (antiga.referencia) substituidas.push(antiga.referencia);
    }
  }
  return { referencia: a.referencia ?? "", empresa: a.empresa, substituidas };
}

/* ─────────────────────────────── o email ─────────────────────────────── */

function convite(a: Autorizacao, ligacao: string, validade: Date) {
  const nome = a.contactoNome.split(/\s+/)[0];
  const ate = new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "long" }).format(validade);
  const corpo = [
    p(`Olá ${escapa(nome)},`),
    p(
      `Para os pagamentos à Jelly passarem a ser feitos por débito direto, pedimos-lhe a autorização de débito direto SEPA da <strong>${escapa(a.empresa)}</strong>.`,
    ),
    a.mensagem ? recibo("Mensagem da Jelly", [], a.mensagem) : "",
    botao(ligacao, "Preencher e assinar"),
    p(
      `Na página indica o NIF, a morada e o IBAN da empresa e quem a assina, com poderes para obrigar a empresa. Se não for consigo, indique o email de quem assina e enviamos-lhe o documento. A ligação é válida até ${escapa(ate)}.`,
      "18px 0 0",
    ),
    p('Alguma dúvida? Responda a este email ou escreva para <a href="mailto:hello@jelly.pt" style="color:#dd364a">hello@jelly.pt</a>.', "14px 0 0"),
  ].join("\n");
  return {
    to: a.contactoEmail,
    replyTo: CASA.email,
    subject: `Autorização de débito direto — ${a.empresa}`,
    html: papel({ locale: "pt", titulo: "Autorização de débito direto", antevisao: "Preencha e assine em poucos minutos.", sobretitulo: "Débito direto SEPA", cabeca: "Autorização de débito direto", corpo }),
    text: [
      `Olá ${nome},`,
      "",
      `Para os pagamentos à Jelly passarem a ser feitos por débito direto, pedimos-lhe a autorização de débito direto SEPA da ${a.empresa}.`,
      ...(a.mensagem ? ["", a.mensagem] : []),
      "",
      `Preencha e assine aqui: ${ligacao}`,
      "",
      `A ligação é válida até ${ate}.`,
      "",
      "Jelly · hello@jelly.pt",
    ].join("\n"),
  };
}
