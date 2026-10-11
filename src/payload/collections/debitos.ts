import type { CollectionAfterReadHook, CollectionBeforeChangeHook, CollectionConfig, PayloadHandler } from "payload";
import { doModulo, escondeDe, podeNoPedido } from "../acesso";

/**
 * Autorizações de débito direto SEPA (CORE) dos clientes.
 *
 * A Jelly cria a autorização com o contacto do cliente e envia-lhe uma
 * ligação. O cliente preenche a empresa, o NIF, a morada, o IBAN e quem
 * assina, e assina com o mesmo motor dos NDA (código por email, certificado).
 * O documento e a prova ficam num pedido de assinatura ligado a esta ficha.
 *
 * O IBAN é um dado bancário: só a administração vê esta lista, e o IBAN não
 * aparece nas colunas nem nos emails.
 */
const so = doModulo(["debitos"]).read;

export const ESTADOS_DEBITO = [
  { label: "Rascunho", value: "rascunho" },
  { label: "Enviada", value: "enviada" },
  { label: "Aberta pelo cliente", value: "aberta" },
  { label: "Assinada", value: "assinada" },
  { label: "Registada no banco", value: "registada" },
  { label: "Expirada", value: "expirada" },
  { label: "Revogada", value: "revogada" },
  { label: "Substituída", value: "substituida" },
  { label: "Cancelada", value: "cancelada" },
] as const;

/** O que o cliente escreve e o que o código regista: o painel não reescreve. */
const DO_CLIENTE = [
  "via",
  "referencia",
  "nif",
  "morada",
  "iban",
  "recorrente",
  "signatarioNome",
  "signatarioCargo",
  "signatarioEmail",
  "enviadaEm",
  "abertaEm",
  "assinadaEm",
  "validade",
  "pedido",
  "substituidaPor",
] as const;

/**
 * À mão, o estado só anda para onde faz sentido: uma assinada fica
 * «Registada no banco» (quando se carrega no banco) ou «Revogada» (quando o
 * cliente a cancela); uma que ainda não foi assinada pode ser «Cancelada».
 * O resto muda sozinho.
 */
const MANUAIS: Record<string, string[]> = {
  assinada: ["registada", "revogada"],
  registada: ["revogada"],
  rascunho: ["cancelada"],
  enviada: ["cancelada"],
  aberta: ["cancelada"],
  expirada: ["cancelada"],
};

const protege: CollectionBeforeChangeHook = ({ data, originalDoc, operation, context }) => {
  if (context?.debitoInterno) return data;
  if (operation === "create") {
    for (const campo of DO_CLIENTE) delete data[campo];
    data.estado = "rascunho";
    return data;
  }
  const antes = (originalDoc ?? {}) as Record<string, unknown>;
  for (const campo of DO_CLIENTE) data[campo] = antes[campo];
  const pedido = String(data.estado ?? antes.estado);
  const atual = String(antes.estado);
  if (pedido !== atual && (MANUAIS[atual] ?? []).includes(pedido)) {
    data.estado = pedido;
    if (pedido === "registada") data.registadaEm = new Date().toISOString();
    if (pedido === "revogada") data.revogadaEm = new Date().toISOString();
  } else data.estado = atual;
  // Depois de assinada, a empresa é a que está no documento.
  if (["assinada", "registada", "revogada", "substituida"].includes(atual)) data.empresa = antes.empresa;
  return data;
};

/** Uma ligação que passou o prazo sem assinatura mostra-se «Expirada». */
const mostraExpiradas: CollectionAfterReadHook = ({ doc }) => {
  if ((doc.estado === "enviada" || doc.estado === "aberta") && doc.validade && new Date(doc.validade).getTime() < Date.now()) {
    return { ...doc, estado: "expirada" };
  }
  return doc;
};

const enviarDebito: PayloadHandler = async (req) => {
  if (!podeNoPedido(req, "debitos")) return Response.json({ error: "Sem acesso aos débitos diretos." }, { status: 403 });
  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Falta a autorização." }, { status: 400 });
  const { enviarConvite, ErroDeDebito } = await import("@/lib/debitos/fluxo");
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "www.jelly.pt";
    const origem = `${host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https"}://${host}`;
    return Response.json(await enviarConvite(req.payload, String(id), origem));
  } catch (erro) {
    if (erro instanceof ErroDeDebito) return Response.json({ error: erro.message }, { status: erro.estado });
    const mensagem = erro instanceof Error ? erro.message : "erro desconhecido";
    req.payload.logger.error(`debitos: enviar ${id}: ${mensagem}`);
    return Response.json({ error: `Não foi possível enviar: ${mensagem}` }, { status: 500 });
  }
};

const lerSo = { readOnly: true } as const;
const dia = { date: { pickerAppearance: "dayOnly" as const } };

export const DebitosDiretos: CollectionConfig = {
  slug: "debitos-diretos",
  labels: { singular: "Autorização de débito direto", plural: "Débitos diretos" },
  admin: {
    useAsTitle: "empresa",
    group: "Faturação",
    hidden: escondeDe("debitos"),
    defaultColumns: ["empresa", "referencia", "estado", "via", "assinadaEm"],
    listSearchableFields: ["empresa", "nif", "referencia", "contactoEmail"],
    description:
      "Autorizações de débito direto SEPA dos clientes. Cria-se com o contacto do cliente e envia-se: o cliente preenche a empresa, o NIF e o IBAN, e assina. Depois de assinada, carrega-se no banco e marca-se «Registada no banco».",
  },
  access: { read: so, create: so, update: so, delete: so },
  hooks: { beforeChange: [protege], afterRead: [mostraExpiradas] },
  endpoints: [{ path: "/:id/enviar", method: "post", handler: enviarDebito }],
  fields: [
    { name: "acoes", type: "ui", admin: { components: { Field: "@/payload/components/EnviarDebito#EnviarDebito" } } },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      required: true,
      defaultValue: "rascunho",
      index: true,
      options: [...ESTADOS_DEBITO],
      admin: {
        position: "sidebar",
        description: "Muda sozinho até «Assinada». À mão: «Registada no banco» depois de a carregar no banco, «Revogada» se o cliente a cancelar, «Cancelada» se já não for precisa.",
      },
    },
    {
      name: "via",
      label: "Pedida",
      type: "select",
      defaultValue: "painel",
      options: [
        { label: "Pelo painel (convite ao contacto)", value: "painel" },
        { label: "Pelo link único", value: "link" },
      ],
      admin: { readOnly: true, position: "sidebar", condition: (dados) => dados?.via === "link" },
    },
    { name: "referencia", label: "Referência da autorização", type: "text", unique: true, index: true, admin: { ...lerSo, position: "sidebar", description: "NIF do cliente + ADD + número. Sai quando o cliente preenche." } },
    {
      name: "tipo",
      label: "Tipo",
      type: "radio",
      required: true,
      defaultValue: "nova",
      options: [
        { label: "Nova autorização", value: "nova" },
        { label: "Alteração de uma autorização (por exemplo, outro IBAN)", value: "alteracao" },
      ],
      admin: { description: "Quando o cliente assina, uma autorização anterior do mesmo NIF passa a «Substituída»." },
    },
    {
      type: "row",
      fields: [
        { name: "empresa", label: "Empresa", type: "text", required: true, admin: { description: "O cliente pode corrigir ao preencher." } },
        { name: "contactoNome", label: "Nome do contacto", type: "text", required: true },
        { name: "contactoEmail", label: "Email do contacto", type: "email", required: true, admin: { description: "Recebe a ligação para preencher. Pelo link único, é quem preencheu." } },
      ],
    },
    { name: "mensagem", label: "Mensagem no email", type: "textarea", admin: { description: "Opcional. Aparece no email, antes do botão." } },
    {
      type: "collapsible",
      label: "Preenchido pelo cliente",
      admin: { initCollapsed: false, condition: (dados) => Boolean(dados?.referencia) },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nif", label: "NIF", type: "text", index: true, admin: lerSo },
            { name: "iban", label: "IBAN", type: "text", admin: lerSo },
            { name: "recorrente", label: "Pagamento recorrente", type: "checkbox", admin: lerSo },
          ],
        },
        { name: "morada", label: "Morada", type: "textarea", admin: lerSo },
        {
          type: "row",
          fields: [
            { name: "signatarioNome", label: "Assina", type: "text", admin: lerSo },
            { name: "signatarioCargo", label: "Cargo", type: "text", admin: lerSo },
            { name: "signatarioEmail", label: "Email de quem assina", type: "email", admin: lerSo },
          ],
        },
      ],
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        { name: "enviadaEm", label: "Enviada em", type: "date", admin: { ...lerSo, ...dia } },
        { name: "abertaEm", label: "Aberta em", type: "date", admin: { ...lerSo, ...dia } },
      ],
    },
    {
      type: "row",
      admin: { position: "sidebar" },
      fields: [
        { name: "assinadaEm", label: "Assinada em", type: "date", index: true, admin: { ...lerSo, ...dia } },
        { name: "registadaEm", label: "Registada no banco em", type: "date", admin: { ...lerSo, ...dia } },
      ],
    },
    { name: "revogadaEm", label: "Revogada em", type: "date", admin: { ...lerSo, ...dia, position: "sidebar", condition: (dados) => Boolean(dados?.revogadaEm) } },
    { name: "validade", label: "Ligação válida até", type: "date", admin: { ...lerSo, ...dia, position: "sidebar" } },
    {
      name: "ultimoDebito",
      label: "Último débito",
      type: "date",
      admin: {
        ...dia,
        position: "sidebar",
        description: "Pelas regras SEPA, uma autorização caduca 36 meses depois do último débito. Atualizar quando houver débitos.",
      },
    },
    { name: "pedido", label: "Documento e prova da assinatura", type: "relationship", relationTo: "assinaturas", admin: { ...lerSo, condition: (dados) => Boolean(dados?.pedido) } },
    { name: "substituidaPor", label: "Substituída por", type: "relationship", relationTo: "debitos-diretos", admin: { ...lerSo, position: "sidebar", condition: (dados) => Boolean(dados?.substituidaPor) } },
    { name: "notas", label: "Notas", type: "textarea" },
  ],
};
