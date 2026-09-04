import type { CollectionConfig } from "payload";

/**
 * Prestadores: quem fatura à Jelly e entra em billing.jelly.pt.
 *
 * Vieram de um quadro do Monday com 24 colunas e 470 linhas — 303 pessoas, o
 * resto repetições entre grupos. Os campos são os do quadro, com dois cuidados:
 *
 * O primeiro é o acesso. Aqui há IBAN, NIF, morada, número de identificação e
 * de segurança social: nada disto é público e nada disto é para quem só edita
 * o blog. Só quem tem sessão no painel lê; e o site, para deixar entrar um
 * prestador, só precisa de saber duas coisas — o email existe e o estado é
 * «qualificado». É o que o `isRegisteredProvider` pergunta, e mais nada.
 *
 * O segundo é o estado. No Monday havia «qualified», «disqualified» e «Parado».
 * Ficam os três, porque são três situações diferentes: um desqualificado não
 * volta, um parado pode voltar. Só o qualificado entra em billing — desmarcar
 * é fechar-lhe a porta no clique seguinte, porque o registo é verificado no
 * momento em que o link é usado, não só quando é pedido.
 */
export const Prestadores: CollectionConfig = {
  slug: "prestadores",
  labels: { singular: "Prestador", plural: "Prestadores" },
  admin: {
    useAsTitle: "nome",
    group: "Faturação",
    defaultColumns: ["nome", "email", "estado", "pool"],
    description:
      "Quem fatura à Jelly. Só um prestador «qualificado» consegue entrar em billing.jelly.pt — o link de acesso verifica isto no momento em que é usado.",
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "nome", label: "Nome", type: "text", required: true },
    {
      name: "email",
      label: "Email",
      type: "email",
      required: true,
      unique: true,
      index: true,
      admin: { description: "É com este email que pede o link de acesso." },
      hooks: {
        // Maiúsculas e espaços não são outra pessoa. Guarda-se normalizado para
        // a procura no acesso ser uma igualdade e não uma adivinha.
        beforeValidate: [({ value }) => (typeof value === "string" ? value.trim().toLowerCase() : value)],
      },
    },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      required: true,
      defaultValue: "qualificado",
      options: [
        { label: "Qualificado — pode faturar", value: "qualificado" },
        { label: "Parado — sem trabalho de momento", value: "parado" },
        { label: "Desqualificado", value: "desqualificado" },
      ],
      admin: { position: "sidebar", description: "Só «qualificado» entra em billing.jelly.pt." },
    },
    {
      name: "pool",
      label: "Pool",
      type: "select",
      options: [
        { label: "Design", value: "design" },
        { label: "Development", value: "development" },
        { label: "Marketing", value: "marketing" },
        { label: "Multimedia", value: "multimedia" },
        { label: "Video", value: "video" },
      ],
      admin: { position: "sidebar" },
    },
    {
      name: "tipo",
      label: "Fatura como",
      type: "select",
      options: [
        { label: "Pessoa singular", value: "singular" },
        { label: "Empresa", value: "empresa" },
      ],
      admin: { position: "sidebar" },
    },
    { name: "mondayId", label: "Id no Monday", type: "text", index: true, admin: { position: "sidebar", readOnly: true } },
    {
      name: "emailNotificacao",
      label: "Quem avisar na Jelly",
      type: "email",
      admin: { description: "A pessoa da casa que acompanha este prestador." },
    },
    { name: "rateHora", label: "Rate à hora (€)", type: "number", min: 0 },
    {
      type: "collapsible",
      label: "Dados fiscais e de pagamento",
      admin: { initCollapsed: true },
      fields: [
        { name: "nif", label: "NIF", type: "text" },
        { name: "iban", label: "IBAN", type: "text" },
        {
          name: "regimeFiscal",
          label: "Regime fiscal",
          type: "select",
          options: [
            { label: "IVA", value: "iva" },
            { label: "Isento", value: "isento" },
            { label: "Retenção na fonte", value: "retencao" },
          ],
        },
      ],
    },
    {
      type: "collapsible",
      label: "Dados pessoais",
      admin: { initCollapsed: true },
      fields: [
        { name: "telefone", label: "Telefone", type: "text" },
        { name: "morada", label: "Morada", type: "textarea" },
        { name: "nacionalidade", label: "Nacionalidade", type: "text" },
        { name: "dataNascimento", label: "Data de nascimento", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
        { name: "documento", label: "Cartão de cidadão / passaporte", type: "text" },
        { name: "segurancaSocial", label: "Segurança Social", type: "text" },
        {
          name: "estadoCivil",
          label: "Estado civil",
          type: "select",
          options: [
            { label: "Solteiro/a", value: "solteiro" },
            { label: "Casado/a", value: "casado" },
            { label: "União de facto", value: "uniao" },
            { label: "Divorciado/a", value: "divorciado" },
            { label: "Viúvo/a", value: "viuvo" },
          ],
        },
        { name: "dependentes", label: "Dependentes", type: "number", min: 0 },
      ],
    },
    { name: "notas", label: "Notas", type: "textarea" },
  ],
};

/**
 * Duas coleções escondidas que guardam o estado curto do magic link.
 *
 * Um link gasto não pode abrir duas vezes, e um email não pode pedir dez links
 * por minuto. Isto vivia em memória do processo — e na Vercel cada pedido pode
 * cair numa instância diferente, com uma memória diferente: um link usado numa
 * podia ser usado outra vez noutra dentro dos quinze minutos. Fica na base de
 * dados, que já lá está, em vez de se acrescentar um Redis à casa.
 *
 * Sem painel, sem trancas de edição, sem acesso por API: só o código lhes toca,
 * pela API local, que passa por cima do controlo de acesso.
 */
const fechado = { read: () => false, create: () => false, update: () => false, delete: () => false };

export const BillingTokens: CollectionConfig = {
  slug: "billing-tokens",
  admin: { hidden: true },
  lockDocuments: false,
  access: fechado,
  fields: [
    // O `jti` do token. Único: é a unicidade que faz o uso único, e não uma
    // leitura seguida de uma escrita, que entre duas instâncias podia deixar
    // passar as duas.
    { name: "jti", type: "text", required: true, unique: true, index: true },
    { name: "expiresAt", type: "date", required: true, index: true },
  ],
};

export const BillingAttempts: CollectionConfig = {
  slug: "billing-attempts",
  admin: { hidden: true },
  lockDocuments: false,
  access: fechado,
  fields: [
    { name: "chave", type: "text", required: true, unique: true, index: true },
    { name: "count", type: "number", required: true, defaultValue: 0 },
    { name: "resetAt", type: "date", required: true, index: true },
  ],
};
