import type { Access, CollectionBeforeChangeHook, CollectionBeforeValidateHook, CollectionConfig } from "payload";
import { temPerfil, type ComPerfis } from "./recruitment";
import { enviarAssinatura, imagemJelly, novoParaPrestador } from "../endpoints/assinaturas";

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

/**
 * Quem recebe, na casa, o aviso e a cópia de cada documento assinado. As
 * propostas só ao Gonçalo; os NDA, os contratos e o resto, a ele e à Marta
 * Costa. Quem já recebeu a cópia por ter assinado não recebe o aviso.
 */
export const AVISOS: Record<"nda" | "contrato" | "proposta" | "outro", readonly string[]> = {
  nda: ["gmalho@jelly.pt", "mcosta@jelly.pt"],
  contrato: ["gmalho@jelly.pt", "mcosta@jelly.pt"],
  proposta: ["gmalho@jelly.pt"],
  outro: ["gmalho@jelly.pt", "mcosta@jelly.pt"],
};

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
    // Pelo painel é sempre «painel»: só o link do NDA cria pedidos «link».
    data.via = "painel";
    delete data.dadosDoPrestador;
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
  data.via = antes.via;
  data.dadosDoPrestador = antes.dadosDoPrestador;

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

/**
 * Um pedido é uma de duas coisas, e não as duas: o NDA de um prestador, gerado
 * a partir da ficha dele, ou outro documento — um PDF carregado, para uma
 * entidade que não é um prestador. Enquanto é rascunho, o que pertence à outra
 * escolha limpa-se ao guardar, para não ficar um «NDA» com um PDF carregado ou
 * um contrato preso a um prestador. Depois de enviado, quem manda é o
 * `protegeAProva`.
 */
const arrumaOPedido: CollectionBeforeValidateHook = async ({ data, originalDoc, operation, req, context }) => {
  if (!data || context?.assinaturasInterno) return data;
  const antes = (originalDoc ?? {}) as Record<string, unknown>;
  if (operation === "update" && antes.estado && antes.estado !== "rascunho") return data;
  const origem = data.origem ?? antes.origem;

  if (origem === "modelo-nda") {
    data.tipo = "nda";
    data.jellyAssina = false;
    data.pdf = null;
    data.outraParte = { nome: null, nif: null };
    const prestador = data.prestador ?? antes.prestador;
    const id = typeof prestador === "object" && prestador ? (prestador as { id: number }).id : prestador;
    if (!String(data.titulo ?? antes.titulo ?? "").trim() && id) {
      const ficha = (await req.payload.findByID({ collection: "prestadores", id: id as number, depth: 0, overrideAccess: true, req }).catch(() => null)) as { nome?: string } | null;
      if (ficha?.nome) data.titulo = `NDA — ${ficha.nome}`;
    }
  }
  if (origem === "pdf") data.prestador = null;
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
/** O resto da ficha só aparece depois de escolhido o que se envia. */
const escolhido = (dados: Record<string, unknown> | undefined) => Boolean(dados?.origem);

export const Assinaturas: CollectionConfig = {
  slug: "assinaturas",
  labels: { singular: "Pedido de assinatura", plural: "Pedidos de assinatura" },
  admin: {
    useAsTitle: "titulo",
    group: "Assinaturas",
    defaultColumns: ["titulo", "tipo", "estado", "prestador", "enviadoEm", "concluidoEm"],
    listSearchableFields: ["titulo"],
    description:
      "Documentos para assinar. Ao criar, escolhe-se primeiro: o NDA de um prestador (sai preenchido com a ficha dele) ou outro documento (um PDF que se carrega, para uma entidade que não é prestador). Quem assina recebe uma ligação por email e confirma com um código.",
  },
  access: { read: so, create: so, update: so, delete: so },
  hooks: { beforeValidate: [arrumaOPedido], beforeChange: [protegeAProva] },
  endpoints: [
    { path: "/:id/enviar", method: "post", handler: enviarAssinatura },
    { path: "/para-prestador/:prestador", method: "post", handler: novoParaPrestador },
    { path: "/imagem-jelly", method: "get", handler: imagemJelly },
  ],
  fields: [
    {
      name: "acoes",
      type: "ui",
      admin: { components: { Field: "@/payload/components/EnviarAssinatura#EnviarAssinatura" } },
    },
    {
      // A primeira pergunta. Sem resposta, o resto da ficha não aparece.
      name: "origem",
      label: "O que vai enviar?",
      type: "radio",
      required: true,
      options: [
        { label: "O NDA a um prestador — preenchido com a ficha dele", value: "modelo-nda" },
        { label: "Outro documento — um PDF que carrega, para um cliente, parceiro ou fornecedor", value: "pdf" },
      ],
      admin: { description: "Enquanto o pedido é rascunho, pode trocar-se; depois de enviado, fica." },
    },
    {
      name: "titulo",
      label: "Título",
      type: "text",
      required: true,
      // No NDA pode ficar vazio: ao guardar, passa a «NDA — nome do prestador».
      validate: (valor: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        Boolean(String(valor ?? "").trim()) || siblingData?.origem === "modelo-nda" || "Dê um título ao documento.",
      admin: {
        condition: escolhido,
        description: "Como o documento aparece no email e no certificado. No NDA, se ficar vazio, fica «NDA — nome do prestador».",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "tipo",
          label: "Tipo de documento",
          type: "select",
          required: true,
          options: [
            { label: "NDA", value: "nda" },
            { label: "Contrato", value: "contrato" },
            { label: "Proposta", value: "proposta" },
            { label: "Outro", value: "outro" },
          ],
          // No NDA de prestador é sempre «NDA»: não se pergunta.
          admin: { condition: (dados) => dados?.origem === "pdf", description: "Decide quem recebe o aviso: as propostas só o Gonçalo; o resto, também a Marta." },
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
          // Num pedido por gravar é sempre «Rascunho»: não vale a pena mostrar.
          admin: { condition: (dados) => Boolean(dados?.id), description: "Muda sozinho: «Enviado» ao enviar, «Assinado» quando o último assina. «Cancelado» fecha as ligações." },
        },
      ],
    },
    {
      name: "pdf",
      label: "PDF para assinar",
      type: "upload",
      relationTo: "assinaturas-ficheiros",
      validate: (valor: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        siblingData?.origem !== "pdf" || Boolean(valor) || "Carregue o PDF a assinar.",
      admin: { condition: (dados) => dados?.origem === "pdf", description: "O documento tal como vai ser assinado. Depois de enviado, já não se troca." },
    },
    {
      name: "prestador",
      label: "Prestador",
      type: "relationship",
      relationTo: "prestadores",
      index: true,
      // Pelo link do NDA o prestador ainda não existe quando o pedido nasce:
      // liga-se no fim, quando assina.
      validate: (valor: unknown, { siblingData }: { siblingData: Record<string, unknown> }) =>
        siblingData?.origem !== "modelo-nda" || siblingData?.via === "link" || Boolean(valor) || "Escolha o prestador.",
      admin: {
        condition: (dados) => dados?.origem === "modelo-nda" && (dados?.via !== "link" || Boolean(dados?.prestador)),
        description: "O NDA sai preenchido com a ficha dele (nome, morada, documento, NIF) e, assinado, fica marcado nela.",
      },
    },
    {
      name: "via",
      label: "Pedido feito",
      type: "select",
      defaultValue: "painel",
      options: [
        { label: "No painel", value: "painel" },
        { label: "Pelo link do NDA (preenchido pelo prestador)", value: "link" },
      ],
      admin: { readOnly: true, position: "sidebar", condition: (dados) => dados?.via === "link" },
    },
    {
      // O que o prestador escreveu no formulário do link do NDA. É com isto que
      // o NDA sai preenchido e que a ficha dele é criada ou completada.
      name: "dadosDoPrestador",
      label: "Dados que o prestador preencheu",
      type: "group",
      admin: { readOnly: true, condition: (dados) => dados?.via === "link" },
      fields: [
        {
          type: "row",
          fields: [
            { name: "nome", label: "Nome", type: "text" },
            { name: "email", label: "Email", type: "email" },
            { name: "telefone", label: "Telefone", type: "text" },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "nif", label: "NIF", type: "text" },
            { name: "documento", label: "Cartão de cidadão / passaporte", type: "text" },
          ],
        },
        { name: "morada", label: "Morada", type: "textarea" },
      ],
    },
    {
      name: "outraParte",
      label: "Outra entidade",
      type: "group",
      admin: {
        condition: (dados) => dados?.origem === "pdf",
        description: "Cliente, parceiro ou fornecedor: a entidade que assina o documento.",
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
      admin: { condition: (dados) => dados?.origem === "pdf", description: "Se marcado, recebe também a ligação para assinar." },
    },
    {
      name: "signatarios",
      label: "Quem assina",
      type: "array",
      labels: { singular: "Signatário", plural: "Signatários" },
      admin: {
        // No NDA, o prestador entra sozinho ao enviar: só se mostra a lista
        // depois, com o registo de prova de quem assinou.
        condition: (dados) => dados?.origem === "pdf" || (Boolean(dados?.estado) && dados?.estado !== "rascunho"),
        description: "Um ou mais representantes da entidade. Se a Jelly assinar, entra sozinha ao enviar.",
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
      admin: { condition: escolhido, description: "Opcional. Aparece no email do convite, antes do botão." },
    },
    {
      name: "validade",
      label: "Válido até",
      type: "date",
      admin: { condition: escolhido, date: { pickerAppearance: "dayOnly" }, description: "Depois desta data a ligação deixa de abrir. Por omissão, 30 dias depois do envio." },
    },
    {
      type: "collapsible",
      label: "Documento e prova",
      admin: { initCollapsed: false, condition: (dados) => Boolean(dados?.enviadoEm) },
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
