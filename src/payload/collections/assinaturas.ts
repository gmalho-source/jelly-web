import type { Access, CollectionBeforeChangeHook, CollectionConfig } from "payload";
import { temPerfil, type ComPerfis } from "./recruitment";
import { enviarAssinatura, novoParaPrestador } from "../endpoints/assinaturas";

/**
 * Assinatura digital de documentos: NDA, propostas, contratos.
 *
 * Assinatura eletrónica simples, no sentido do regulamento europeu (eIDAS):
 * quem assina recebe uma ligação pessoal por email, lê o documento, confirma um
 * código que chega a esse mesmo email e escreve o nome. Fica o registo de prova
 * — quem, quando, de que IP e browser, e a impressão digital (SHA-256) do PDF
 * que leu — e no fim um PDF com o documento e uma página de certificado.
 *
 * Os documentos são dados de clientes e de prestadores: só a administração os
 * vê, e os ficheiros ficam atrás do controlo de acesso do Payload, como os CV.
 */
export const soAdministracao: Access = ({ req }) => temPerfil(req.user as ComPerfis);

/**
 * Quem assina pela Jelly quando a Jelly assina. Um NDA de prestador não leva a
 * assinatura da Jelly: o compromisso é só de quem recebe a informação.
 */
export const SIGNATARIO_JELLY = {
  nome: "Fernando Gonçalo Rosa Malho Rodrigues",
  nif: "204460069",
  cargo: "Sócio-gerente",
  email: "gmalho@jelly.pt",
} as const;

/** Quem recebe a confirmação e a cópia de cada NDA assinado. */
export const AVISOS_NDA = ["gmalho@jelly.pt", "mcosta@jelly.pt"] as const;

const so = soAdministracao;

/**
 * O painel não reescreve a prova.
 *
 * O formulário do pedido manda de volta todos os campos, incluindo os que só
 * se leem — e com os valores de quando a página abriu. Sem isto, guardar uma
 * correção de título enquanto alguém assina apagava a assinatura, o histórico,
 * ou trocava o documento já enviado. Só o código das assinaturas (com
 * `context.assinaturasInterno`) escreve estes campos.
 */
const PROVA_DA_LINHA = [
  "papel",
  "estado",
  "assinadoEm",
  "enviadoEm",
  "vistoEm",
  "codigoVerificadoEm",
  "nomeEscrito",
  "ip",
  "navegador",
  "codigoHash",
  "codigoExpira",
  "codigoTentativas",
  "codigoEnviadoEm",
] as const;
const PROVA_DO_PEDIDO = ["original", "hashOriginal", "assinado", "hashFinal", "enviadoEm", "concluidoEm", "registo"] as const;
const CONGELADO_AO_ENVIAR = ["titulo", "tipo", "origem", "pdf", "prestador", "outraParte", "jellyAssina"] as const;

type Linha = Record<string, unknown> & { id?: string };

const protegeAProva: CollectionBeforeChangeHook = ({ data, originalDoc, operation, context }) => {
  if (context?.assinaturasInterno) return data;

  if (operation === "create") {
    for (const campo of PROVA_DO_PEDIDO) delete data[campo];
    data.estado = "rascunho";
    data.signatarios = ((data.signatarios ?? []) as Linha[]).map((linha) => {
      const limpa: Linha = { ...linha };
      for (const campo of PROVA_DA_LINHA) delete limpa[campo];
      return { ...limpa, papel: "contraparte", estado: "pendente" };
    });
    return data;
  }

  const antes = (originalDoc ?? {}) as Record<string, unknown>;
  for (const campo of PROVA_DO_PEDIDO) data[campo] = antes[campo];

  // O estado só muda à mão para «Cancelado», e só antes de estar assinado.
  const podeCancelar = antes.estado === "rascunho" || antes.estado === "enviado";
  data.estado = data.estado === "cancelado" && podeCancelar ? "cancelado" : antes.estado;

  const enviado = antes.estado !== "rascunho";
  if (enviado) for (const campo of CONGELADO_AO_ENVIAR) data[campo] = antes[campo];

  const linhasAntes = new Map(((antes.signatarios ?? []) as Linha[]).map((linha) => [linha.id, linha]));
  const vindas = ((data.signatarios ?? []) as Linha[]).map((linha) => {
    const anterior = linha.id ? linhasAntes.get(linha.id) : undefined;
    if (!anterior) {
      const nova: Linha = { ...linha };
      for (const campo of PROVA_DA_LINHA) delete nova[campo];
      return { ...nova, papel: "contraparte", estado: "pendente" };
    }
    // Quem já assinou fica exatamente como assinou, nome e email incluídos.
    if (anterior.estado === "assinado") return anterior;
    const mantida: Linha = { ...linha };
    for (const campo of PROVA_DA_LINHA) mantida[campo] = anterior[campo];
    return mantida;
  });
  // E não se apaga quem já assinou.
  const ficam = new Set(vindas.map((linha) => linha.id));
  for (const anterior of linhasAntes.values()) if (anterior.estado === "assinado" && !ficam.has(anterior.id)) vindas.push(anterior);
  data.signatarios = vindas;
  return data;
};

/** Os PDFs: os que se carregam para assinar, os gerados, e os assinados. */
export const AssinaturasFicheiros: CollectionConfig = {
  slug: "assinaturas-ficheiros",
  labels: { singular: "Ficheiro para assinatura", plural: "Ficheiros para assinatura" },
  admin: { useAsTitle: "filename", group: "Assinaturas", hidden: true },
  access: { read: so, create: so, update: so, delete: so },
  upload: { mimeTypes: ["application/pdf"], filesRequiredOnCreate: true },
  fields: [],
};

const lerSo = { readOnly: true } as const;

export const Assinaturas: CollectionConfig = {
  slug: "assinaturas",
  labels: { singular: "Pedido de assinatura", plural: "Pedidos de assinatura" },
  admin: {
    useAsTitle: "titulo",
    group: "Assinaturas",
    defaultColumns: ["titulo", "tipo", "estado", "prestador", "enviadoEm", "concluidoEm"],
    listSearchableFields: ["titulo"],
    description:
      "Documentos para assinar. O NDA dos prestadores sai preenchido com a ficha; qualquer outro documento é um PDF que se carrega. Quem assina recebe uma ligação por email e confirma com um código.",
  },
  access: { read: so, create: so, update: so, delete: so },
  hooks: { beforeChange: [protegeAProva] },
  endpoints: [
    { path: "/:id/enviar", method: "post", handler: enviarAssinatura },
    { path: "/para-prestador/:prestador", method: "post", handler: novoParaPrestador },
  ],
  fields: [
    {
      name: "acoes",
      type: "ui",
      admin: { components: { Field: "@/payload/components/EnviarAssinatura#EnviarAssinatura" } },
    },
    { name: "titulo", label: "Título", type: "text", required: true, admin: { description: "Como o documento aparece no email e no certificado. Por exemplo «NDA — Ana Silva»." } },
    {
      type: "row",
      fields: [
        {
          name: "tipo",
          label: "Tipo",
          type: "select",
          required: true,
          defaultValue: "nda",
          options: [
            { label: "NDA", value: "nda" },
            { label: "Contrato", value: "contrato" },
            { label: "Proposta", value: "proposta" },
            { label: "Outro", value: "outro" },
          ],
        },
        {
          name: "estado",
          label: "Estado",
          type: "select",
          defaultValue: "rascunho",
          index: true,
          options: [
            { label: "Rascunho", value: "rascunho" },
            { label: "Enviado", value: "enviado" },
            { label: "Assinado", value: "concluido" },
            { label: "Cancelado", value: "cancelado" },
          ],
          admin: { description: "Muda sozinho: «Enviado» ao enviar, «Assinado» quando o último assina. «Cancelado» fecha as ligações." },
        },
      ],
    },
    {
      name: "origem",
      label: "Documento",
      type: "radio",
      required: true,
      defaultValue: "modelo-nda",
      options: [
        { label: "NDA da Jelly, preenchido com a ficha do prestador", value: "modelo-nda" },
        { label: "Um PDF carregado", value: "pdf" },
      ],
    },
    {
      name: "pdf",
      label: "PDF para assinar",
      type: "upload",
      relationTo: "assinaturas-ficheiros",
      admin: { condition: (dados) => dados?.origem === "pdf", description: "O documento tal como vai ser assinado. Depois de enviado, já não se troca." },
    },
    {
      name: "prestador",
      label: "Prestador",
      type: "relationship",
      relationTo: "prestadores",
      index: true,
      admin: { description: "Se for um prestador. O NDA assinado fica marcado na ficha dele." },
    },
    {
      name: "outraParte",
      label: "Outra entidade",
      type: "group",
      admin: {
        condition: (dados) => !dados?.prestador,
        description: "Cliente, parceiro ou fornecedor, quando não é um prestador.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nome", label: "Nome", type: "text" },
            { name: "nif", label: "NIF", type: "text" },
          ],
        },
      ],
    },
    {
      name: "jellyAssina",
      label: `A Jelly também assina (${SIGNATARIO_JELLY.nome}, ${SIGNATARIO_JELLY.cargo.toLowerCase()})`,
      type: "checkbox",
      defaultValue: false,
      admin: { condition: (dados) => dados?.tipo !== "nda", description: "Num NDA de prestador só o prestador assina." },
    },
    {
      name: "signatarios",
      label: "Quem assina",
      type: "array",
      labels: { singular: "Signatário", plural: "Signatários" },
      admin: {
        description: "Um ou mais representantes da outra parte. Se a Jelly assinar, entra sozinha ao enviar.",
        initCollapsed: false,
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nome", label: "Nome", type: "text", required: true },
            { name: "email", label: "Email", type: "email", required: true },
            { name: "cargo", label: "Cargo", type: "text" },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "papel",
              label: "Assina por",
              type: "select",
              defaultValue: "contraparte",
              options: [
                { label: "A outra parte", value: "contraparte" },
                { label: "A Jelly", value: "jelly" },
              ],
              admin: lerSo,
            },
            {
              name: "estado",
              label: "Estado",
              type: "select",
              defaultValue: "pendente",
              options: [
                { label: "Por assinar", value: "pendente" },
                { label: "Assinado", value: "assinado" },
              ],
              admin: lerSo,
            },
            { name: "assinadoEm", label: "Assinou em", type: "date", admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
          ],
        },
        {
          type: "collapsible",
          label: "Registo de prova",
          admin: { initCollapsed: true },
          fields: [
            {
              type: "row",
              fields: [
                { name: "enviadoEm", label: "Ligação enviada", type: "date", admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
                { name: "vistoEm", label: "Abriu", type: "date", admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
                { name: "codigoVerificadoEm", label: "Código confirmado", type: "date", admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "nomeEscrito", label: "Nome escrito", type: "text", admin: lerSo },
                { name: "ip", label: "IP", type: "text", admin: lerSo },
              ],
            },
            { name: "navegador", label: "Browser", type: "text", admin: lerSo },
          ],
        },
        // O código de confirmação: só o resumo, nunca o código. Nada disto se vê.
        { name: "codigoHash", type: "text", admin: { hidden: true } },
        { name: "codigoExpira", type: "date", admin: { hidden: true } },
        { name: "codigoTentativas", type: "number", admin: { hidden: true } },
        { name: "codigoEnviadoEm", type: "date", admin: { hidden: true } },
      ],
    },
    {
      name: "mensagem",
      label: "Mensagem no email",
      type: "textarea",
      admin: { description: "Opcional. Aparece no email do convite, antes do botão." },
    },
    {
      name: "validade",
      label: "Válido até",
      type: "date",
      admin: { date: { pickerAppearance: "dayOnly" }, description: "Depois desta data a ligação deixa de abrir. Por omissão, 30 dias depois do envio." },
    },
    {
      type: "collapsible",
      label: "Documento e prova",
      admin: { initCollapsed: false },
      fields: [
        {
          type: "row",
          fields: [
            { name: "enviadoEm", label: "Enviado em", type: "date", index: true, admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
            { name: "concluidoEm", label: "Assinado por todos em", type: "date", index: true, admin: { ...lerSo, date: { pickerAppearance: "dayAndTime" } } },
          ],
        },
        { name: "original", label: "Documento enviado", type: "upload", relationTo: "assinaturas-ficheiros", admin: { ...lerSo, condition: (dados) => Boolean(dados?.original), description: "O PDF exato que foi enviado para assinar." } },
        { name: "hashOriginal", label: "SHA-256 do documento enviado", type: "text", admin: { ...lerSo, condition: (dados) => Boolean(dados?.hashOriginal) } },
        { name: "assinado", label: "Documento assinado", type: "upload", relationTo: "assinaturas-ficheiros", admin: { ...lerSo, condition: (dados) => Boolean(dados?.assinado), description: "O documento com a página de certificado no fim." } },
        { name: "hashFinal", label: "SHA-256 do documento assinado", type: "text", admin: { ...lerSo, condition: (dados) => Boolean(dados?.hashFinal) } },
        {
          name: "registo",
          label: "Histórico",
          type: "array",
          admin: { readOnly: true, initCollapsed: true },
          fields: [
            {
              type: "row",
              fields: [
                { name: "quando", label: "Quando", type: "date", admin: { date: { pickerAppearance: "dayAndTime" } } },
                { name: "evento", label: "O quê", type: "text" },
              ],
            },
            { name: "detalhe", label: "Detalhe", type: "text" },
          ],
        },
      ],
    },
  ],
};
