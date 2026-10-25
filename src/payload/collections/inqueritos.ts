import { randomBytes } from "node:crypto";
import type { CollectionBeforeChangeHook, CollectionConfig, Field } from "payload";
import { doModulo, escondeDe } from "../acesso";
import { ORIGENS, PREENCHIMENTOS, TIPOS } from "@/lib/inqueritos/tipos";
import { exportar, importarRespostas, negociosDoPipedrive, trazerPerguntas, trocarChaveDoInquerito } from "../endpoints/inqueritos";

/**
 * Os inquéritos: o de satisfação dos clientes, o das propostas rejeitadas, e
 * os que vierem.
 *
 * Três coleções. O inquérito é o formulário — as perguntas, a abertura, o
 * fecho, o link geral. O link pessoal é um link para uma pessoa ou para uma
 * proposta do Pipedrive, que já sabe a empresa e só aceita uma resposta. A
 * resposta é o que cada pessoa escreveu, gravado à medida que responde.
 *
 * O preenchimento é em `/inquerito/<chave>`, fora do site; o que se vê no
 * painel são as perguntas, as respostas numa tabela e os resultados — os dois
 * separadores ao lado de «Editar».
 */

const novaChave = () => randomBytes(18).toString("base64url");
const chaveCurta = () => randomBytes(6).toString("base64url").replace(/[-_]/g, "x");

type ComChave = { chave?: string | null };

/**
 * Cada pergunta, opção e linha ganha uma chave na primeira gravação, e não a
 * perde mais. Uma linha duplicada no painel traz a chave da original: a
 * segunda ganha uma nova, senão as respostas das duas misturavam-se.
 */
function daChaves<T extends ComChave>(lista: T[] | null | undefined, vistas: Set<string>): void {
  for (const item of lista ?? []) {
    if (!item.chave || vistas.has(item.chave)) item.chave = chaveCurta();
    vistas.add(item.chave);
  }
}

const arrumaInquerito: CollectionBeforeChangeHook = ({ data, originalDoc, context }) => {
  // A chave do link geral só muda pelo botão (ver `trocar-chave`): o formulário
  // do painel devolve a que tinha quando abriu, e gravar não a pode repor.
  if (!context?.trocarChave) data.chave = (originalDoc as ComChave | undefined)?.chave ?? data.chave ?? novaChave();
  const vistas = new Set<string>();
  const perguntas = (data.perguntas ?? []) as (ComChave & { opcoes?: ComChave[]; linhas?: ComChave[] })[];
  daChaves(perguntas, vistas);
  for (const pergunta of perguntas) {
    daChaves(pergunta.opcoes, vistas);
    daChaves(pergunta.linhas, vistas);
  }
  return data;
};

const so = (...tipos: string[]) => (_: unknown, irmaos: { tipo?: string }) => tipos.includes(irmaos?.tipo ?? "");

const chaveEscondida: Field = { name: "chave", type: "text", admin: { hidden: true } };

const perguntas: Field = {
  name: "perguntas",
  label: "Perguntas",
  labels: { singular: "Pergunta", plural: "Perguntas" },
  type: "array",
  admin: {
    initCollapsed: true,
    components: { RowLabel: "@/payload/components/inqueritos/RotuloDaPergunta#RotuloDaPergunta" },
  },
  fields: [
    {
      type: "row",
      fields: [
        { name: "tipo", label: "Tipo", type: "select", required: true, defaultValue: "escolha", options: [...TIPOS], admin: { width: "34%" } },
        { name: "obrigatoria", label: "Obrigatória", type: "checkbox", admin: { width: "22%", style: { alignSelf: "flex-end" } } },
      ],
    },
    {
      name: "titulo",
      label: "Pergunta",
      type: "text",
      required: true,
      admin: { description: "Um {{field:…}} vindo do Typeform é trocado, na página, pela resposta à pergunta a que se refere (o nome, a marca)." },
    },
    { name: "descricao", label: "Explicação", type: "textarea", admin: { description: "Opcional. Aparece por baixo da pergunta, em letra mais pequena." } },
    // ── Escolha ──
    {
      type: "row",
      admin: { condition: so("escolha") },
      fields: [
        { name: "varias", label: "Pode escolher várias", type: "checkbox", admin: { width: "30%" } },
        {
          name: "maximo",
          label: "Até quantas",
          type: "number",
          min: 1,
          admin: { width: "20%", condition: (_, irmaos) => Boolean(irmaos?.varias), description: "Vazio, sem limite." },
        },
        { name: "outra", label: "Opção «Outra», com texto", type: "checkbox", admin: { width: "30%" } },
      ],
    },
    {
      name: "opcoes",
      label: "Opções",
      labels: { singular: "Opção", plural: "Opções" },
      type: "array",
      admin: {
        condition: so("escolha", "grelha"),
        description: "Numa grelha, são as colunas: as mesmas para todas as linhas.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "rotulo", label: "Texto", type: "text", required: true, admin: { width: "60%" } },
            {
              name: "imagem",
              label: "Imagem",
              type: "upload",
              relationTo: "media",
              admin: { width: "40%", description: "Opcional. Com imagem, as opções aparecem em cartões." },
            },
          ],
        },
        chaveEscondida,
      ],
    },
    {
      name: "linhas",
      label: "Linhas",
      labels: { singular: "Linha", plural: "Linhas" },
      type: "array",
      admin: {
        condition: so("grelha", "campos"),
        description: "Numa grelha, cada linha é uma característica a classificar. Em campos curtos, cada linha é um campo (Nome, Cargo, Empresa).",
      },
      fields: [{ name: "rotulo", label: "Texto", type: "text", required: true }, chaveEscondida],
    },
    // ── Escala e NPS ──
    {
      type: "row",
      admin: { condition: so("escala") },
      fields: [
        { name: "escalaMin", label: "De", type: "number", defaultValue: 0, min: 0, max: 1, admin: { width: "15%" } },
        { name: "escalaMax", label: "Até", type: "number", defaultValue: 10, min: 2, max: 10, admin: { width: "15%" } },
      ],
    },
    {
      type: "row",
      admin: { condition: so("escala", "nps") },
      fields: [
        { name: "rotuloMin", label: "Rótulo do início", type: "text", admin: { width: "33%" } },
        { name: "rotuloMeio", label: "Rótulo do meio", type: "text", admin: { width: "33%" } },
        { name: "rotuloMax", label: "Rótulo do fim", type: "text", admin: { width: "33%" } },
      ],
    },
    // ── Quando aparece ──
    {
      type: "row",
      fields: [
        {
          name: "mostrarSe",
          label: "Só aparece se a pergunta…",
          type: "text",
          admin: { width: "50%", components: { Field: "@/payload/components/inqueritos/Condicao#CondicaoPergunta" } },
        },
        {
          name: "mostrarValor",
          label: "…tiver a resposta",
          type: "text",
          admin: { width: "50%", components: { Field: "@/payload/components/inqueritos/Condicao#CondicaoValor" } },
        },
      ],
    },
    {
      name: "preencher",
      label: "Preencher com o link pessoal",
      type: "select",
      options: [...PREENCHIMENTOS],
      admin: {
        condition: so("texto-curto", "texto-longo"),
        description: "Num link pessoal que já sabe a resposta, a pergunta não aparece e a resposta grava-se sozinha. No link geral, aparece como as outras.",
      },
    },
    { name: "chave", type: "text", admin: { hidden: true } },
  ],
};

export const Inqueritos: CollectionConfig = {
  slug: "inqueritos",
  labels: { singular: "Inquérito", plural: "Inquéritos" },
  admin: {
    useAsTitle: "titulo",
    group: "Inquéritos",
    hidden: escondeDe("inqueritos"),
    defaultColumns: ["titulo", "estado", "publico", "updatedAt"],
    description: "Os formulários que se mandam a clientes e à equipa. As respostas e os resultados estão nos separadores de cada inquérito.",
    components: {
      views: {
        edit: {
          respostas: {
            Component: "@/payload/components/inqueritos/VistaRespostas#VistaRespostas",
            path: "/respostas",
            tab: { label: "Respostas", href: "/respostas", order: 100 },
          },
          resultados: {
            Component: "@/payload/components/inqueritos/VistaResultados#VistaResultados",
            path: "/resultados",
            tab: { label: "Resultados", href: "/resultados", order: 200 },
          },
        },
      },
    },
  },
  access: doModulo(["inqueritos"]),
  hooks: { beforeChange: [arrumaInquerito] },
  endpoints: [
    { path: "/:id/trocar-chave", method: "post", handler: trocarChaveDoInquerito },
    { path: "/:id/exportar", method: "get", handler: exportar },
    { path: "/:id/typeform/perguntas", method: "post", handler: trazerPerguntas },
    { path: "/:id/typeform/respostas", method: "post", handler: importarRespostas },
  ],
  fields: [
    { name: "titulo", label: "Título", type: "text", required: true },
    { name: "link", type: "ui", admin: { components: { Field: "@/payload/components/inqueritos/LinkDoInquerito#LinkDoInquerito" } } },
    {
      type: "row",
      fields: [
        {
          name: "estado",
          label: "Estado",
          type: "select",
          defaultValue: "rascunho",
          required: true,
          options: [
            { label: "Rascunho — só a equipa com sessão vê", value: "rascunho" },
            { label: "Aberto — recebe respostas", value: "aberto" },
            { label: "Fechado — o link diz que terminou", value: "fechado" },
          ],
          admin: { width: "40%" },
        },
        {
          name: "publico",
          label: "Para quem",
          type: "select",
          defaultValue: "clientes",
          options: [
            { label: "Clientes", value: "clientes" },
            { label: "Equipa", value: "equipa" },
            { label: "Clientes e equipa", value: "todos" },
          ],
          admin: { width: "30%" },
        },
        {
          name: "lingua",
          label: "Língua da página",
          type: "select",
          defaultValue: "pt",
          required: true,
          options: [
            { label: "Português", value: "pt" },
            { label: "English", value: "en" },
          ],
          admin: { width: "30%", description: "Dos botões e avisos. As perguntas são as que escrever." },
        },
      ],
    },
    {
      type: "collapsible",
      label: "Abertura e fecho",
      admin: { initCollapsed: true },
      fields: [
        {
          name: "abertura",
          label: "Abertura",
          type: "group",
          admin: { description: "Vazia, o inquérito abre logo na primeira pergunta." },
          fields: [
            { name: "titulo", label: "Título", type: "text" },
            { name: "texto", label: "Texto", type: "textarea" },
          ],
        },
        {
          name: "fecho",
          label: "Fecho",
          type: "group",
          admin: { description: "O que aparece no fim. Vazio, um agradecimento curto." },
          fields: [
            { name: "titulo", label: "Título", type: "text" },
            { name: "texto", label: "Texto", type: "textarea" },
          ],
        },
      ],
    },
    perguntas,
    {
      name: "avisar",
      label: "Avisar por email",
      type: "text",
      admin: {
        position: "sidebar",
        description: "Quem recebe um email a cada resposta completa. Vários, separados por vírgula. Vazio, ninguém.",
      },
    },
    {
      name: "typeformId",
      label: "Typeform",
      type: "text",
      admin: {
        position: "sidebar",
        description: "O código do formulário no Typeform (o que vem depois de /to/ no link). Serve para trazer as perguntas e as respostas de lá.",
      },
    },
    {
      name: "typeform",
      type: "ui",
      admin: { position: "sidebar", components: { Field: "@/payload/components/inqueritos/ImportarTypeform#ImportarTypeform" } },
    },
    { name: "chave", type: "text", admin: { hidden: true } },
  ],
};

const tituloDoLink: CollectionBeforeChangeHook = ({ data, operation, originalDoc }) => {
  if (operation === "create" || !(originalDoc as ComChave | undefined)?.chave) data.chave = data.chave || novaChave();
  else data.chave = (originalDoc as ComChave).chave;
  data.titulo = [data.empresa || data.pipedriveOrganizacao, data.nome].filter(Boolean).join(" · ") || data.pipedriveTitulo || "Link pessoal";
  return data;
};

export const InqueritosLinks: CollectionConfig = {
  slug: "inqueritos-links",
  labels: { singular: "Link pessoal", plural: "Links pessoais" },
  admin: {
    useAsTitle: "titulo",
    group: "Inquéritos",
    hidden: escondeDe("inqueritos"),
    defaultColumns: ["titulo", "inquerito", "pipedriveTitulo", "respondidoEm", "createdAt"],
    description: "Um link para uma pessoa ou para uma proposta. Já sabe a empresa, aceita uma única resposta, e a resposta fica ligada ao negócio no Pipedrive.",
  },
  access: doModulo(["inqueritos"]),
  hooks: { beforeChange: [tituloDoLink] },
  endpoints: [{ path: "/negocios", method: "get", handler: negociosDoPipedrive }],
  fields: [
    { name: "inquerito", label: "Inquérito", type: "relationship", relationTo: "inqueritos", required: true, index: true },
    { name: "copiar", type: "ui", admin: { components: { Field: "@/payload/components/inqueritos/LinkDoInquerito#LinkPessoalDoInquerito" } } },
    {
      name: "negocio",
      type: "ui",
      admin: { components: { Field: "@/payload/components/inqueritos/NegocioPipedrive#NegocioPipedrive" } },
    },
    {
      type: "row",
      fields: [
        { name: "empresa", label: "Empresa", type: "text", admin: { width: "50%" } },
        { name: "nome", label: "Nome de quem responde", type: "text", admin: { width: "50%" } },
      ],
    },
    { name: "pipedriveId", type: "number", admin: { hidden: true } },
    { name: "pipedriveTitulo", label: "Negócio no Pipedrive", type: "text", admin: { hidden: true } },
    { name: "pipedriveOrganizacao", type: "text", admin: { hidden: true } },
    {
      name: "respondidoEm",
      label: "Respondido",
      type: "date",
      admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } },
    },
    { name: "resposta", label: "Resposta", type: "relationship", relationTo: "inqueritos-respostas", admin: { position: "sidebar", readOnly: true } },
    { name: "titulo", type: "text", admin: { hidden: true } },
    { name: "chave", type: "text", index: true, admin: { hidden: true } },
  ],
};

export const InqueritosRespostas: CollectionConfig = {
  slug: "inqueritos-respostas",
  labels: { singular: "Resposta", plural: "Respostas" },
  admin: {
    useAsTitle: "titulo",
    group: "Inquéritos",
    hidden: escondeDe("inqueritos"),
    defaultColumns: ["titulo", "inquerito", "origem", "estado", "concluidaEm"],
    description: "Cada resposta, gravada à medida que a pessoa responde. A tabela com uma coluna por pergunta está no separador «Respostas» de cada inquérito.",
  },
  // Ninguém cria respostas no painel: chegam pela página de preenchimento, ou
  // pela importação do Typeform.
  access: { ...doModulo(["inqueritos"]), create: () => false },
  fields: [
    { name: "vista", type: "ui", admin: { components: { Field: "@/payload/components/inqueritos/RespostaVista#RespostaVista" } } },
    {
      name: "inquerito",
      label: "Inquérito",
      type: "relationship",
      relationTo: "inqueritos",
      required: true,
      index: true,
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "origem", label: "Origem", type: "select", options: [...ORIGENS], admin: { position: "sidebar", readOnly: true } },
    {
      name: "estado",
      label: "Estado",
      type: "select",
      defaultValue: "incompleta",
      options: [
        { label: "Incompleta", value: "incompleta" },
        { label: "Completa", value: "completa" },
      ],
      admin: { position: "sidebar", readOnly: true },
    },
    { name: "link", label: "Link pessoal", type: "relationship", relationTo: "inqueritos-links", admin: { position: "sidebar", readOnly: true } },
    { name: "preenchidaPor", label: "Preenchida por", type: "relationship", relationTo: "users", admin: { position: "sidebar", readOnly: true } },
    {
      name: "iniciadaEm",
      label: "Começou",
      type: "date",
      admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } },
    },
    {
      name: "concluidaEm",
      label: "Concluída",
      type: "date",
      index: true,
      admin: { position: "sidebar", readOnly: true, date: { pickerAppearance: "dayAndTime", displayFormat: "dd/MM/yyyy HH:mm" } },
    },
    { name: "empresa", type: "text", admin: { hidden: true } },
    { name: "nome", type: "text", admin: { hidden: true } },
    { name: "pipedriveId", type: "number", admin: { hidden: true } },
    { name: "dados", type: "json", admin: { hidden: true } },
    { name: "titulo", type: "text", admin: { hidden: true } },
    { name: "sessao", type: "text", unique: true, admin: { hidden: true } },
    { name: "typeformToken", type: "text", unique: true, admin: { hidden: true } },
    { name: "gravacoes", type: "number", defaultValue: 0, admin: { hidden: true } },
  ],
};
