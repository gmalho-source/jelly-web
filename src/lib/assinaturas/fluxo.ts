import type { Payload } from "payload";
import { enviaEmail } from "@/lib/email";
import { CASA, botao, escapa, p, papel, recibo } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";
import { AVISOS, SIGNATARIO_JELLY } from "@/payload/collections/assinaturas";
import { contaTentativa, ficaComOFecho, gravaLinha, largaOFecho, marcaVisto, porAssinar, regista } from "./base";
import { guardarPdf, lerPdf } from "./ficheiros";
import { blocosDoNda, faltaNaFicha } from "./nda";
import { imagemDaJelly } from "./imagem";
import { geraDocumento, juntaCertificado, paginasDe } from "./pdf";
import { assinaLigacao, codigoCerto, lerLigacao, novoCodigo, resumoDoCodigo, sha256 } from "./segredo";

/**
 * O caminho de um pedido de assinatura, do envio ao PDF assinado.
 *
 *   enviar  → congela o documento (gera o NDA ou lê o PDF), guarda a impressão
 *             digital, e manda a cada signatário a sua ligação pessoal;
 *   abrir   → quem chega com a ligação vê o documento (fica registado);
 *   código  → recebe no email um código de seis algarismos, válido 10 minutos;
 *   assinar → escreve o nome e confirma com o código;
 *   concluir→ quando o último assina: o PDF com o certificado no fim, as
 *             cópias por email, e o NDA marcado na ficha do prestador.
 */
const COLECAO = "assinaturas";
const VALIDADE_DIAS = 30;
const CODIGO_MINUTOS = 10;
const CODIGO_TENTATIVAS = 5;
const CODIGO_INTERVALO_S = 60;

type Linha = {
  id?: string | null;
  nome: string;
  email: string;
  cargo?: string | null;
  papel?: "contraparte" | "jelly" | null;
  estado?: "pendente" | "assinado" | null;
  assinadoEm?: string | null;
  enviadoEm?: string | null;
  vistoEm?: string | null;
  codigoVerificadoEm?: string | null;
  nomeEscrito?: string | null;
  ip?: string | null;
  navegador?: string | null;
  codigoHash?: string | null;
  codigoExpira?: string | null;
  codigoTentativas?: number | null;
  codigoEnviadoEm?: string | null;
};

type Registo = { quando: string; evento: string; detalhe?: string | null };

type Prestador = { id: number | string; nome?: string | null; email?: string | null; morada?: string | null; documento?: string | null; nif?: string | null };

export type Pedido = {
  id: number | string;
  titulo: string;
  tipo: "nda" | "contrato" | "proposta" | "outro";
  estado: "rascunho" | "enviado" | "concluido" | "cancelado";
  origem: "modelo-nda" | "pdf";
  pdf?: number | string | { id: number | string } | null;
  prestador?: number | string | Prestador | null;
  outraParte?: { nome?: string | null; nif?: string | null } | null;
  jellyAssina?: boolean | null;
  signatarios?: Linha[] | null;
  mensagem?: string | null;
  validade?: string | null;
  enviadoEm?: string | null;
  concluidoEm?: string | null;
  original?: number | string | { id: number | string } | null;
  hashOriginal?: string | null;
  assinado?: number | string | { id: number | string } | null;
  hashFinal?: string | null;
  registo?: Registo[] | null;
  via?: "painel" | "link" | null;
  dadosDoPrestador?: { nome?: string | null; email?: string | null; telefone?: string | null; nif?: string | null; morada?: string | null; documento?: string | null } | null;
};

export class ErroDeAssinatura extends Error {
  constructor(
    message: string,
    public estado = 400,
  ) {
    super(message);
  }
}

const idDe = (valor: unknown): string | number | null =>
  valor && typeof valor === "object" ? ((valor as { id: string | number }).id ?? null) : (valor as string | number | null) ?? null;

const agora = () => new Date().toISOString();

/** «12/10/2026, 14:03:22 (Lisboa)» — a hora que quem lê reconhece. */
export function quando(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const lisboa = new Intl.DateTimeFormat("pt-PT", {
    timeZone: "Europe/Lisbon",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(d);
  return `${lisboa} (Lisboa) · ${d.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC")}`;
}

const dia = (iso?: string | null) =>
  iso ? new Intl.DateTimeFormat("pt-PT", { timeZone: "Europe/Lisbon", dateStyle: "long" }).format(new Date(iso)) : "—";

async function lerPedido(payload: Payload, id: string | number): Promise<Pedido> {
  const pedido = (await payload.findByID({ collection: COLECAO, id, depth: 1, overrideAccess: true })) as unknown as Pedido | null;
  if (!pedido) throw new ErroDeAssinatura("Este pedido de assinatura não existe.", 404);
  return pedido;
}

function quemEaOutraParte(pedido: Pedido): string {
  const prestador = pedido.prestador && typeof pedido.prestador === "object" ? pedido.prestador : null;
  return prestador?.nome || pedido.dadosDoPrestador?.nome || pedido.outraParte?.nome || "";
}

/** A referência curta que aparece no rodapé dos PDFs e nos emails. */
const referencia = (pedido: Pedido, hash?: string | null) => `JLY-${pedido.id}${hash ? `-${hash.slice(0, 8).toUpperCase()}` : ""}`;

/* ─────────────────────────────── enviar ─────────────────────────────── */

/**
 * `soLigacao`: o pedido nasceu no link do NDA e quem assina está do outro lado
 * do ecrã — em vez de lhe mandar a ligação por email, devolve-se a ligação.
 */
export async function enviar(
  payload: Payload,
  id: string | number,
  origem: string,
  { soLigacao = false }: { soLigacao?: boolean } = {},
): Promise<{ enviados: number; falhados: string[]; ligacao?: string }> {
  let pedido = await lerPedido(payload, id);
  if (pedido.estado === "concluido") throw new ErroDeAssinatura("Este documento já foi assinado por todos.");
  if (pedido.estado === "cancelado") throw new ErroDeAssinatura("Este pedido foi cancelado. Cria um novo.");

  const mudancas: Partial<Pedido> = {};
  const eventos: [string, string][] = [];

  // Os signatários: o prestador entra sozinho; a Jelly entra se assinar.
  let linhas: Linha[] = (pedido.signatarios ?? []).map((l) => ({ ...l }));
  const prestador = pedido.prestador && typeof pedido.prestador === "object" ? (pedido.prestador as Prestador) : null;
  if (prestador?.email && !linhas.some((l) => l.email?.toLowerCase() === prestador.email?.toLowerCase())) {
    linhas.unshift({ nome: prestador.nome ?? "", email: prestador.email, papel: "contraparte", estado: "pendente" });
  }
  const jellyAssina = pedido.tipo !== "nda" && Boolean(pedido.jellyAssina);
  if (!jellyAssina) linhas = linhas.filter((l) => l.papel !== "jelly" || l.estado === "assinado");
  else if (!linhas.some((l) => l.papel === "jelly")) {
    linhas.push({ nome: SIGNATARIO_JELLY.nome, email: SIGNATARIO_JELLY.email, cargo: SIGNATARIO_JELLY.cargo, papel: "jelly", estado: "pendente" });
  }
  if (!linhas.some((l) => l.papel !== "jelly")) throw new ErroDeAssinatura("Falta quem assine pela outra parte: um prestador ou pelo menos um signatário.");
  for (const l of linhas) if (!l.nome?.trim() || !l.email?.trim()) throw new ErroDeAssinatura("Cada signatário precisa de nome e email.");
  const mudouALista =
    linhas.length !== (pedido.signatarios ?? []).length || linhas.some((l, i) => l.id !== (pedido.signatarios ?? [])[i]?.id);
  if (mudouALista) mudancas.signatarios = linhas;

  // O documento congela no primeiro envio: o que se assina é o que se enviou.
  if (pedido.estado === "rascunho") {
    let bytes: Uint8Array;
    if (pedido.origem === "modelo-nda") {
      if (pedido.tipo !== "nda") throw new ErroDeAssinatura("O modelo da Jelly é o NDA: escolhe o tipo «NDA», ou carrega um PDF.");
      // Pelo link, os dados são os que o prestador escreveu; pelo painel, os da ficha.
      const fonte = pedido.via === "link" ? pedido.dadosDoPrestador : prestador;
      if (!fonte) throw new ErroDeAssinatura("O NDA da Jelly preenche-se com a ficha de um prestador: escolhe o prestador.");
      const dados = { nome: fonte.nome ?? "", morada: fonte.morada ?? "", documento: fonte.documento ?? "", nif: fonte.nif ?? "" };
      const falta = faltaNaFicha(dados);
      if (falta.length) throw new ErroDeAssinatura(`Falta na ficha do prestador: ${falta.join(", ")}. Preenche e volta a enviar.`);
      bytes = await geraDocumento(blocosDoNda(dados), {
        cabecalho: `Acordo de confidencialidade · ${CASA.legal}`,
        referencia: referencia(pedido),
        titulo: pedido.titulo,
      });
    } else {
      const pdf = idDe(pedido.pdf);
      if (!pdf) throw new ErroDeAssinatura("Carrega o PDF a assinar.");
      bytes = await lerPdf(payload, pdf);
      try {
        await paginasDe(bytes);
      } catch {
        throw new ErroDeAssinatura("Este PDF não se deixa abrir (pode estar protegido por palavra-passe). Exporta-o outra vez sem proteção.");
      }
    }
    const hash = sha256(bytes);
    mudancas.original = await guardarPdf(payload, bytes, `${referencia(pedido, hash)}-enviado`);
    mudancas.hashOriginal = hash;
    mudancas.estado = "enviado";
    mudancas.enviadoEm = agora();
    mudancas.validade = pedido.validade ?? new Date(Date.now() + VALIDADE_DIAS * 86_400_000).toISOString();
    eventos.push(["Documento congelado", `SHA-256 ${hash}`]);
  }

  if (Object.keys(mudancas).length) {
    await payload.update({ collection: COLECAO, id, data: mudancas as never, overrideAccess: true, context: { assinaturasInterno: true } });
  }
  for (const [evento, detalhe] of eventos) await regista(payload, id, evento, detalhe);
  pedido = await lerPedido(payload, id);

  // As ligações, só a quem ainda não assinou. Reenviar é isto outra vez.
  const validade = new Date(pedido.validade ?? Date.now() + VALIDADE_DIAS * 86_400_000);
  if (soLigacao) {
    const linha = (pedido.signatarios ?? []).find((l) => l.estado !== "assinado" && l.id);
    if (!linha?.id) return { enviados: 0, falhados: [] };
    const token = await assinaLigacao({ pedido: String(pedido.id), signatario: linha.id }, validade);
    return { enviados: 0, falhados: [], ligacao: `/assinar/${token}` };
  }
  const falhados: string[] = [];
  let enviados = 0;
  for (const linha of pedido.signatarios ?? []) {
    if (linha.estado === "assinado" || !linha.id) continue;
    const token = await assinaLigacao({ pedido: String(pedido.id), signatario: linha.id }, validade);
    const resultado = await enviaEmail(convite(pedido, linha, `${origem}/assinar/${token}`, validade));
    if (resultado.ok) {
      enviados += 1;
      // A primeira vez que a ligação saiu: um reenvio não reescreve a prova.
      if (!linha.enviadoEm) await gravaLinha(payload, linha.id, { enviadoEm: agora() });
      await regista(payload, id, "Ligação enviada", linha.email);
    } else {
      falhados.push(linha.email);
      await regista(payload, id, "Email não saiu", `${linha.email}: ${resultado.erro ?? "sem razão"}`);
    }
  }
  return { enviados, falhados };
}

/* ─────────────────────────── o lado de quem assina ─────────────────────────── */

export type Sessao = { pedido: Pedido; linha: Linha };

/** A ligação → o pedido e o signatário, ou a razão por que não abre. */
export async function abrir(payload: Payload, token: string, marcarVisto = false): Promise<Sessao> {
  const portador = await lerLigacao(token);
  if (!portador) throw new ErroDeAssinatura("Esta ligação já não é válida. Pode ter expirado — peça uma nova a quem lha enviou.", 410);
  const pedido = await lerPedido(payload, portador.pedido).catch(() => null);
  if (!pedido) throw new ErroDeAssinatura("Este documento já não existe.", 404);
  if (pedido.estado === "cancelado") throw new ErroDeAssinatura("Este pedido de assinatura foi cancelado.", 410);
  if (pedido.estado === "rascunho") throw new ErroDeAssinatura("Este documento ainda não foi enviado.", 409);
  const linha = (pedido.signatarios ?? []).find((l) => l.id === portador.signatario);
  if (!linha) throw new ErroDeAssinatura("Esta ligação já não corresponde a nenhum signatário.", 410);
  if (marcarVisto && !linha.vistoEm && linha.id && (await marcaVisto(payload, linha.id))) {
    await regista(payload, pedido.id, "Documento aberto", linha.email);
  }
  return { pedido, linha };
}

export async function pedirCodigo(payload: Payload, token: string): Promise<{ email: string }> {
  const { pedido, linha } = await abrir(payload, token);
  if (pedido.estado === "concluido" || linha.estado === "assinado") throw new ErroDeAssinatura("Este documento já está assinado.", 409);
  if (linha.codigoEnviadoEm && Date.now() - new Date(linha.codigoEnviadoEm).getTime() < CODIGO_INTERVALO_S * 1000) {
    throw new ErroDeAssinatura("Acabámos de enviar um código. Espere um minuto antes de pedir outro.", 429);
  }
  const codigo = novoCodigo();
  const resultado = await enviaEmail(emailDoCodigo(pedido, linha, codigo));
  if (!resultado.ok) throw new ErroDeAssinatura("Não conseguimos enviar o código agora. Tente outra vez dentro de instantes.", 502);
  await gravaLinha(payload, linha.id!, {
    codigoHash: resumoDoCodigo(codigo, linha.id!),
    codigoExpira: new Date(Date.now() + CODIGO_MINUTOS * 60_000).toISOString(),
    codigoTentativas: 0,
    codigoEnviadoEm: agora(),
  });
  await regista(payload, pedido.id, "Código enviado", linha.email);
  return { email: linha.email };
}

export async function assinar(
  payload: Payload,
  token: string,
  { codigo, nome, ip, navegador }: { codigo: string; nome: string; ip: string; navegador: string },
): Promise<{ concluido: boolean }> {
  const { pedido, linha } = await abrir(payload, token);
  if (pedido.estado === "concluido" || linha.estado === "assinado") throw new ErroDeAssinatura("Este documento já está assinado.", 409);
  const nomeLimpo = nome.trim().replace(/\s+/g, " ");
  if (nomeLimpo.length < 3) throw new ErroDeAssinatura("Escreva o seu nome completo.");
  if (!linha.codigoHash || !linha.codigoExpira) throw new ErroDeAssinatura("Peça primeiro o código de confirmação.");
  if (new Date(linha.codigoExpira).getTime() < Date.now()) throw new ErroDeAssinatura("O código expirou. Peça um novo.");
  if ((linha.codigoTentativas ?? 0) >= CODIGO_TENTATIVAS) throw new ErroDeAssinatura("Demasiadas tentativas. Peça um novo código.", 429);

  if (!codigoCerto(codigo, linha.id!, linha.codigoHash)) {
    await contaTentativa(payload, linha.id!);
    await regista(payload, pedido.id, "Código errado", `${linha.email} · ${ip}`);
    throw new ErroDeAssinatura("O código não está certo. Confirme o último email que recebeu.");
  }

  const momento = agora();
  const gravou = await gravaLinha(
    payload,
    linha.id!,
    {
      estado: "assinado",
      assinadoEm: momento,
      codigoVerificadoEm: momento,
      nomeEscrito: nomeLimpo.slice(0, 160),
      ip: ip.slice(0, 64),
      navegador: navegador.slice(0, 300),
      codigoHash: null,
      codigoExpira: null,
    },
    { soSePendente: true },
  );
  if (!gravou) throw new ErroDeAssinatura("Este documento já está assinado.", 409);
  await regista(payload, pedido.id, "Assinado", `${linha.email} · ${nomeLimpo} · ${ip}`);

  const todos = (await porAssinar(payload, pedido.id)) === 0;
  if (todos) await concluir(payload, pedido.id);
  return { concluido: todos };
}

/* ─────────────────────────────── concluir ─────────────────────────────── */

async function concluir(payload: Payload, pedidoId: string | number) {
  const momento = agora();
  // Só um fecha: se dois acabarem juntos, o segundo sai aqui.
  if (!(await ficaComOFecho(payload, pedidoId, momento))) return;
  try {
    await fecha(payload, await lerPedido(payload, pedidoId), momento);
  } catch (erro) {
    await largaOFecho(payload, pedidoId);
    await regista(payload, pedidoId, "Fecho falhou", erro instanceof Error ? erro.message.slice(0, 200) : "erro desconhecido");
    throw erro;
  }
}

async function fecha(payload: Payload, pedido: Pedido, momento: string) {
  const original = idDe(pedido.original);
  if (!original || !pedido.hashOriginal) throw new ErroDeAssinatura("Falta o documento original.", 500);
  const bytes = await lerPdf(payload, original);
  const paginas = await paginasDe(bytes);
  const outraParte = quemEaOutraParte(pedido);
  // A imagem da assinatura da Jelly só entra se a Jelly assinou mesmo — com a
  // ligação dela e o código que lhe chegou. Nunca por defeito.
  const jellyAssinou = (pedido.signatarios ?? []).some((l) => l.papel === "jelly" && l.estado === "assinado");
  const imagem = jellyAssinou ? await imagemDaJelly() : null;

  const { bytes: final, naUltimaPagina } = await juntaCertificado(bytes, {
    titulo: pedido.titulo,
    referencia: referencia(pedido, pedido.hashOriginal),
    emitente: CASA.legal,
    documento: [
      { rotulo: "Documento", valor: pedido.titulo },
      { rotulo: "Referência", valor: referencia(pedido, pedido.hashOriginal) },
      { rotulo: "Partes", valor: [CASA.legal, outraParte].filter(Boolean).join(" · ") },
      { rotulo: "Páginas do documento", valor: String(paginas) },
      { rotulo: "SHA-256 do documento", valor: pedido.hashOriginal },
      { rotulo: "Enviado para assinatura", valor: quando(pedido.enviadoEm) },
      { rotulo: "Assinado por todos", valor: quando(momento) },
    ],
    signatarios: (pedido.signatarios ?? []).map((l) => ({
      ...(l.papel === "jelly" && l.estado === "assinado" && imagem ? { imagem } : {}),
      cabeca: `${l.nomeEscrito || l.nome}${l.papel === "jelly" ? ` — pela ${CASA.legal}` : outraParte && outraParte !== l.nome ? ` — por ${outraParte}` : ""}`,
      linhas: [
        { rotulo: "Email (verificado)", valor: l.email },
        ...(l.cargo ? [{ rotulo: "Cargo", valor: l.cargo }] : []),
        { rotulo: "Ligação enviada", valor: quando(l.enviadoEm) },
        { rotulo: "Documento aberto", valor: quando(l.vistoEm) },
        { rotulo: "Código confirmado", valor: quando(l.codigoVerificadoEm) },
        { rotulo: "Assinado", valor: quando(l.assinadoEm) },
        { rotulo: "IP", valor: l.ip || "—" },
        { rotulo: "Browser", valor: l.navegador || "—" },
      ],
    })),
    nota:
      "Assinatura eletrónica simples, nos termos do artigo 25.º do Regulamento (UE) n.º 910/2014 (eIDAS). Cada signatário abriu o documento através de uma ligação pessoal enviada para o seu endereço de email, confirmou esse endereço com um código de uso único enviado para ele, escreveu o seu nome e declarou aceitar o documento acima identificado. A impressão digital SHA-256 identifica o documento enviado: qualquer alteração ao seu conteúdo produz uma impressão diferente. As páginas anteriores a este certificado são esse documento, sem alterações.",
    naUltimaPagina: imagem ?? undefined,
    notaDaUltimaPagina:
      "Exceção: na última página do documento foi aposta a imagem da assinatura da Jelly, depois de o seu representante assinar; o resto da página e as demais páginas ficaram como foram enviados.",
  });

  const hashFinal = sha256(final);
  const assinado = await guardarPdf(payload, final, `${referencia(pedido, pedido.hashOriginal)}-assinado`);
  await payload.update({
    collection: COLECAO,
    id: pedido.id,
    data: { assinado, hashFinal } as never,
    overrideAccess: true,
    context: { assinaturasInterno: true },
  });
  await regista(payload, pedido.id, "Concluído", `SHA-256 do assinado ${hashFinal}`);
  if (jellyAssinou) {
    await regista(
      payload,
      pedido.id,
      imagem ? (naUltimaPagina ? "Assinatura da Jelly aposta na última página e no certificado" : "Assinatura da Jelly aposta no certificado (última página rodada)") : "Sem imagem da assinatura da Jelly",
      null,
    );
  }

  // Pelo link do NDA, a ficha é criada ou encontrada agora, pelo email que o
  // código confirmou, e o pedido fica ligado a ela.
  let ficha: import("./link").FichaDoLink | null = null;
  if (pedido.via === "link") {
    const { ligaAoPrestador } = await import("./link");
    ficha = await ligaAoPrestador(payload, pedido, momento);
    if (ficha) {
      await payload.update({ collection: COLECAO, id: pedido.id, data: { prestador: ficha.prestadorId } as never, overrideAccess: true, context: { assinaturasInterno: true } });
      await regista(
        payload,
        pedido.id,
        ficha.criado ? "Prestador criado em «Parado»" : "NDA ligado à ficha do prestador que já existia",
        ficha.diferencas.length ? `Dados diferentes da ficha: ${ficha.diferencas.join(", ")} — ficha marcada «Dados a rever»` : null,
      );
    }
  }

  // O NDA fica marcado na ficha do prestador, com a data da assinatura.
  const prestadorId = ficha ? null : idDe(pedido.prestador);
  if (pedido.tipo === "nda" && prestadorId) {
    await payload.update({ collection: "prestadores", id: prestadorId, data: { ndaAssinado: true, ndaData: momento } as never, overrideAccess: true });
    await regista(payload, pedido.id, "NDA marcado na ficha do prestador", null);
  }

  // As cópias: a cada signatário, e à casa. Em anexo enquanto cabe (a Brevo
  // aceita 4 MB por anexo); acima disso, por ligação — o signatário volta à
  // página de assinatura, que lhe dá o PDF assinado, e a casa vai ao painel.
  const cabe = final.length <= ANEXO_MAXIMO;
  const anexo = cabe
    ? { nome: `${pedido.titulo.replace(/[^\p{L}\p{N} ._-]+/gu, " ").replace(/\s+/g, " ").trim() || "documento"} - assinado.pdf`, base64: Buffer.from(final).toString("base64") }
    : null;
  if (!cabe) await regista(payload, pedido.id, "Cópia por ligação, não em anexo", `${(final.length / 1024 / 1024).toFixed(1)} MB`);
  const manda = async (carta: Parameters<typeof enviaEmail>[0]) => {
    const resultado = await enviaEmail(carta);
    if (!resultado.ok) await regista(payload, pedido.id, "Email não saiu", `${carta.to}: ${resultado.erro ?? "sem razão"}`.slice(0, 300));
  };
  const jaTem = new Set<string>();
  for (const l of pedido.signatarios ?? []) {
    const ligacao = cabe || !l.id ? null : `${SITE_URL}/assinar/${await assinaLigacao({ pedido: String(pedido.id), signatario: l.id }, new Date(Date.now() + COPIA_DIAS * 86_400_000))}`;
    await manda(copiaAssinada(pedido, l, { anexo, ligacao }, hashFinal));
    jaTem.add(l.email.toLowerCase());
  }
  // A casa recebe o aviso — menos quem já recebeu a cópia por ter assinado.
  const noPainel = cabe ? null : `${SITE_URL}/admin/collections/${COLECAO}/${pedido.id}`;
  for (const destino of AVISOS[pedido.tipo] ?? AVISOS.outro) {
    if (!jaTem.has(destino)) await manda(avisoInterno(pedido, destino, { anexo, ligacao: noPainel }, hashFinal, outraParte, ficha));
  }
}

/** Até aqui o PDF assinado segue em anexo; acima, por ligação. */
const ANEXO_MAXIMO = Math.floor(3.8 * 1024 * 1024);
/** Quanto tempo vale a ligação da cópia, quando não segue em anexo. */
const COPIA_DIAS = 365;
type Entrega = { anexo: { nome: string; base64: string } | null; ligacao: string | null };

/* ─────────────────────────────── os emails ─────────────────────────────── */

function convite(pedido: Pedido, linha: Linha, ligacao: string, validade: Date) {
  const nome = linha.nome.split(/\s+/)[0];
  const corpo = [
    p(`Olá ${escapa(nome)},`),
    p(`A Jelly enviou-lhe o documento <strong>${escapa(pedido.titulo)}</strong> para assinar.`),
    pedido.mensagem ? recibo("Mensagem da Jelly", [], pedido.mensagem) : "",
    botao(ligacao, "Ler e assinar"),
    p(
      `Na página vai poder ler o documento inteiro antes de assinar. Para confirmar a assinatura, enviamos um código para este email. A ligação é pessoal e é válida até ${escapa(dia(validade.toISOString()))}.`,
      "18px 0 0",
    ),
    p('Alguma dúvida? Responda a este email ou escreva para <a href="mailto:hello@jelly.pt" style="color:#dd364a">hello@jelly.pt</a>.', "14px 0 0"),
  ].join("\n");
  return {
    to: linha.email,
    replyTo: CASA.email,
    subject: `Para assinar: ${pedido.titulo}`,
    html: papel({ locale: "pt", titulo: `Para assinar: ${pedido.titulo}`, antevisao: "Leia o documento e assine em poucos minutos.", sobretitulo: "Assinatura digital", cabeca: "Um documento para assinar", corpo }),
    text: [
      `Olá ${nome},`,
      "",
      `A Jelly enviou-lhe o documento «${pedido.titulo}» para assinar.`,
      ...(pedido.mensagem ? ["", pedido.mensagem] : []),
      "",
      `Leia e assine aqui: ${ligacao}`,
      "",
      `Para confirmar a assinatura, enviamos um código para este email. A ligação é pessoal e é válida até ${dia(validade.toISOString())}.`,
      "",
      "Jelly · hello@jelly.pt",
    ].join("\n"),
  };
}

function emailDoCodigo(pedido: Pedido, linha: Linha, codigo: string) {
  const corpo = [
    p(`O seu código para assinar <strong>${escapa(pedido.titulo)}</strong> é:`),
    `<p style="margin:0 0 22px;font:600 34px/1.2 Poppins,Helvetica,Arial,sans-serif;letter-spacing:.18em;color:#151719">${codigo}</p>`,
    p(`É válido durante ${CODIGO_MINUTOS} minutos e só serve para este documento. Se não foi a si que o pediu, ignore este email — sem o código, nada é assinado.`),
  ].join("\n");
  return {
    to: linha.email,
    subject: `O seu código de assinatura: ${codigo}`,
    html: papel({ locale: "pt", titulo: "O seu código de assinatura", antevisao: `Código ${codigo}, válido ${CODIGO_MINUTOS} minutos.`, sobretitulo: "Assinatura digital", cabeca: "Código de confirmação", corpo }),
    text: `O seu código para assinar «${pedido.titulo}» é ${codigo}. É válido durante ${CODIGO_MINUTOS} minutos.`,
  };
}

function copiaAssinada(pedido: Pedido, linha: Linha, { anexo, ligacao }: Entrega, hash: string) {
  const ate = dia(new Date(Date.now() + COPIA_DIAS * 86_400_000).toISOString());
  const corpo = [
    p(`Olá ${escapa(linha.nome.split(/\s+/)[0])},`),
    anexo
      ? p(`O documento <strong>${escapa(pedido.titulo)}</strong> foi assinado por todas as partes. Segue em anexo a cópia assinada, com o certificado de assinatura na última página.`)
      : [
          p(`O documento <strong>${escapa(pedido.titulo)}</strong> foi assinado por todas as partes. O PDF assinado, com o certificado de assinatura na última página, é grande demais para seguir em anexo: descarregue-o aqui.`),
          ligacao ? botao(ligacao, "Descarregar o documento assinado") : "",
          p(`A ligação é pessoal e é válida até ${escapa(ate)}. Guarde o PDF depois de o descarregar.`, "18px 0 0"),
        ].join("\n"),
    p(`Impressão digital (SHA-256) do documento assinado:<br><span style="font-family:monospace;font-size:12px;word-break:break-all">${hash}</span>`, "0 0 18px"),
    p("Guarde este email: é a sua cópia."),
  ].join("\n");
  return {
    to: linha.email,
    replyTo: CASA.email,
    subject: `Assinado: ${pedido.titulo}`,
    html: papel({ locale: "pt", titulo: `Assinado: ${pedido.titulo}`, antevisao: "A sua cópia do documento assinado.", sobretitulo: "Assinatura digital", cabeca: "Documento assinado", corpo }),
    text: anexo
      ? `O documento «${pedido.titulo}» foi assinado por todas as partes. Segue em anexo a cópia assinada.\nSHA-256: ${hash}`
      : `O documento «${pedido.titulo}» foi assinado por todas as partes. Descarregue a cópia assinada aqui (válido até ${ate}): ${ligacao ?? ""}\nSHA-256: ${hash}`,
    ...(anexo ? { anexos: [anexo] } : {}),
  };
}

function avisoInterno(
  pedido: Pedido,
  destino: string,
  { anexo, ligacao }: Entrega,
  hash: string,
  outraParte: string,
  ficha: import("./link").FichaDoLink | null = null,
) {
  const sobreAFicha = ficha
    ? ficha.criado
      ? `Assinado pelo link do NDA. A ficha de ${ficha.nome} foi criada em «Parado», com os dados que escreveu: revê-a e passa-a a «Qualificado» quando puder faturar.`
      : ficha.diferencas.length
        ? `Assinado pelo link do NDA. O NDA ficou na ficha que já existia; os dados escritos têm diferenças (${ficha.diferencas.join(", ")}), que estão nas notas — a ficha ficou marcada «Dados a rever».`
        : "Assinado pelo link do NDA. O NDA ficou na ficha que já existia, marcado com a data de hoje."
    : null;
  const assunto = pedido.tipo === "nda" ? `NDA assinado: ${outraParte || pedido.titulo}` : `Assinado: ${pedido.titulo}`;
  const corpo = [
    recibo(
      "Documento assinado",
      [
        { rotulo: "Documento", valor: pedido.titulo },
        { rotulo: "Outra parte", valor: outraParte },
        ...(pedido.signatarios ?? []).map((l) => ({ rotulo: l.papel === "jelly" ? "Pela Jelly" : "Assinou", valor: `${l.nomeEscrito || l.nome} <${l.email}> · ${quando(l.assinadoEm)}` })),
        { rotulo: "SHA-256", valor: hash },
      ],
      [
        sobreAFicha ?? (pedido.tipo === "nda" ? "O NDA ficou marcado na ficha do prestador, com a data de hoje." : "A cópia assinada está guardada no pedido, no painel."),
        anexo ? "" : "O PDF assinado é grande demais para seguir em anexo: está no pedido, no painel.",
      ]
        .filter(Boolean)
        .join(" "),
    ),
    ligacao ? botao(ligacao, "Abrir o pedido no painel") : "",
  ].join("\n");
  return {
    to: destino,
    subject: assunto,
    html: papel({ locale: "pt", titulo: assunto, antevisao: anexo ? "Cópia assinada em anexo." : "O documento assinado está no painel.", sobretitulo: "Assinaturas", cabeca: assunto, corpo, rodape: "interno" }),
    text: `${assunto}${ligacao ? `\nNo painel: ${ligacao}` : ""}\nSHA-256: ${hash}`,
    ...(anexo ? { anexos: [anexo] } : {}),
  };
}
