import type { Access, CollectionConfig } from "payload";
import { locale, slugEnField, slugField } from "../fields";
import { candidateEmailDraft, sendCandidateEmail } from "../endpoints/candidate-email";
import { scoreApplication, setRetention } from "../hooks/rating";
import { revalidateOnChange, revalidateOnDelete } from "../hooks/revalidate";

/**
 * Recrutamento: departamentos, funções, vagas e candidaturas.
 *
 * Duas decisões estruturam isto tudo. A primeira: o nome da função escreve-se
 * livremente na vaga, mas escolhe-se de uma tabela — assim há "Gestor(a) de
 * PPC" como texto e, por baixo, uma função e um departamento que se podem
 * contar. Sem isso, ao fim de um ano ninguém sabe quantas pessoas se
 * candidataram a design.
 *
 * A segunda: as candidaturas são dados pessoais a sério — morada, CV, respostas
 * escritas — e não devem estar à vista de quem edita o blog. Ficam atrás de um
 * perfil próprio, e os CV atrás do controlo de acesso do Payload, não no CDN.
 */

/** Perfis de quem entra no painel. Sem perfis definidos, é dos antigos: vê tudo. */
type ComPerfis = { roles?: string[] | null } | null | undefined;

const temPerfil = (user: ComPerfis, ...perfis: string[]) => {
  const meus = user?.roles ?? [];
  if (!user) return false;
  if (!meus.length) return true;
  return meus.includes("admin") || perfis.some((perfil) => meus.includes(perfil));
};

/** Só quem trata de recrutamento — e os administradores. */
export const recruiterOnly: Access = ({ req }) => temPerfil(req.user as ComPerfis, "recrutamento");

const jobPaths = (doc: Record<string, unknown>) => ["/recrutamento", `/recrutamento/${doc.slug ?? ""}`];

export const Departments: CollectionConfig = {
  slug: "departments",
  labels: { singular: "Departamento", plural: "Departamentos" },
  admin: {
    useAsTitle: "namePt",
    group: "Recrutamento",
    defaultColumns: ["namePt", "order"],
    description: "As áreas de atuação da agência. É por aqui que as candidaturas se contam.",
  },
  access: { read: () => true, create: recruiterOnly, update: recruiterOnly, delete: recruiterOnly },
  hooks: { afterChange: [revalidateOnChange(() => ["/recrutamento"])] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "namePt", label: "Nome (PT)", type: "text", required: true },
        { name: "nameEn", label: "Nome (EN)", type: "text" },
      ],
    },
    slugField,
    { name: "order", label: "Ordem", type: "number", defaultValue: 100 },
    {
      name: "weights",
      label: "Pesos da avaliação",
      type: "group",
      admin: {
        description:
          "Quanto conta cada dimensão neste departamento, em pontos. A soma não tem de dar 100 — o cálculo normaliza. Num comercial ouvir pesa mais do que numa função técnica; num developer é o contrário.",
      },
      fields: [
        {
          type: "row",
          fields: [
            { name: "empathy", label: "Empatia", type: "number", defaultValue: 15, min: 0, max: 100 },
            { name: "attitude", label: "Atitude e iniciativa", type: "number", defaultValue: 20, min: 0, max: 100 },
            { name: "listening", label: "Capacidade de ouvir", type: "number", defaultValue: 15, min: 0, max: 100 },
          ],
        },
        {
          type: "row",
          fields: [
            { name: "experience", label: "Experiência demonstrada", type: "number", defaultValue: 20, min: 0, max: 100 },
            { name: "communication", label: "Comunicação", type: "number", defaultValue: 15, min: 0, max: 100 },
            { name: "fit", label: "Fit para a função", type: "number", defaultValue: 15, min: 0, max: 100 },
          ],
        },
      ],
    },
  ],
};

export const JobFunctions: CollectionConfig = {
  slug: "job-functions",
  labels: { singular: "Função", plural: "Funções" },
  admin: {
    useAsTitle: "namePt",
    group: "Recrutamento",
    defaultColumns: ["namePt", "department"],
    description: "A tabela de funções. A vaga escolhe uma daqui, e o título dela pode ser escrito à medida.",
  },
  access: { read: () => true, create: recruiterOnly, update: recruiterOnly, delete: recruiterOnly },
  fields: [
    {
      type: "row",
      fields: [
        { name: "namePt", label: "Nome (PT)", type: "text", required: true },
        { name: "nameEn", label: "Nome (EN)", type: "text" },
      ],
    },
    { name: "department", label: "Departamento", type: "relationship", relationTo: "departments", required: true },
    slugField,
  ],
};

export const Jobs: CollectionConfig = {
  slug: "jobs",
  labels: { singular: "Vaga", plural: "Vagas" },
  admin: {
    useAsTitle: "titlePt",
    group: "Recrutamento",
    defaultColumns: ["titlePt", "function", "status", "deadline"],
    livePreview: { url: ({ data }) => `/recrutamento/${data?.slug ?? ""}` },
  },
  // Sem versões de rascunho: o estado da vaga já diz se está por publicar, e
  // duas noções de rascunho no mesmo documento davam pelo mesmo nome ao
  // mesmo tipo na base de dados.
  access: { read: () => true, create: recruiterOnly, update: recruiterOnly, delete: recruiterOnly },
  hooks: { afterChange: [revalidateOnChange(jobPaths)], afterDelete: [revalidateOnDelete(jobPaths)] },
  fields: [
    {
      type: "row",
      fields: [
        { name: "titlePt", label: "Título (PT)", type: "text", required: true },
        { name: "titleEn", label: "Título (EN)", type: "text" },
      ],
    },
    slugField,
    slugEnField,
    {
      name: "function",
      label: "Função",
      type: "relationship",
      relationTo: "job-functions",
      required: true,
      admin: { description: "De onde vem o departamento, e por onde as candidaturas se agrupam." },
    },
    {
      type: "row",
      fields: [
        {
          name: "status",
          label: "Estado",
          type: "select",
          defaultValue: "aberta",
          options: [
            { label: "Rascunho", value: "rascunho" },
            { label: "Aberta", value: "aberta" },
            { label: "Fechada", value: "fechada" },
          ],
        },
        {
          name: "contract",
          label: "Vínculo",
          type: "select",
          options: [
            { label: "Contrato de trabalho", value: "contrato" },
            { label: "Estágio", value: "estagio" },
            { label: "Freelancer", value: "freelancer" },
          ],
        },
        {
          name: "regime",
          label: "Regime",
          type: "select",
          options: [
            { label: "Presencial", value: "presencial" },
            { label: "Híbrido", value: "hibrido" },
            { label: "Remoto", value: "remoto" },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "location", label: "Local", type: "text", defaultValue: "Lisboa" },
        {
          name: "seniority",
          label: "Senioridade",
          type: "select",
          options: [
            { label: "Júnior", value: "junior" },
            { label: "Intermédio", value: "intermedio" },
            { label: "Sénior", value: "senior" },
          ],
        },
        {
          name: "deadline",
          label: "Data limite",
          type: "date",
          admin: {
            date: { pickerAppearance: "dayOnly" },
            description: "Passada a data, a vaga sai da lista sozinha. Deixa vazio para ficar aberta sem prazo.",
          },
        },
      ],
    },
    locale("intro", "Abertura", { long: true }),
    { name: "responsibilities", label: "Responsabilidades", type: "array", fields: [locale("item", "Linha", { long: true })] },
    { name: "requirements", label: "Requisitos", type: "array", fields: [locale("item", "Linha", { long: true })] },
    { name: "niceToHave", label: "Qualificações desejadas", type: "array", fields: [locale("item", "Linha", { long: true })] },
    { name: "benefits", label: "Benefícios", type: "array", fields: [locale("item", "Linha", { long: true })] },
    locale("closing", "Fecho", { long: true }),
    {
      name: "questions",
      label: "Perguntas da candidatura",
      type: "array",
      admin: {
        description:
          "As perguntas que só fazem sentido nesta vaga — ferramentas, canais, anos na função, valor/hora. Sem nada aqui, o formulário fica só com o essencial e o CV.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "type",
              label: "Tipo",
              type: "select",
              required: true,
              defaultValue: "escolha",
              options: [
                { label: "Escolha uma", value: "escolha" },
                { label: "Escolha várias", value: "varias" },
                { label: "Texto curto", value: "curto" },
                { label: "Texto longo", value: "longo" },
                { label: "Número", value: "numero" },
              ],
            },
            { name: "required", label: "Obrigatória", type: "checkbox", defaultValue: true },
          ],
        },
        locale("label", "Pergunta"),
        {
          name: "options",
          label: "Opções",
          type: "array",
          admin: {
            condition: (_, irmao) => irmao?.type === "escolha" || irmao?.type === "varias",
            description: "Uma linha por opção. Para deixar escrever à parte, acrescenta uma opção «Outra».",
          },
          fields: [locale("value", "Opção")],
        },
      ],
    },
    { name: "legacyPath", label: "URL antigo", type: "text", admin: { readOnly: true, position: "sidebar" } },
  ],
};

/**
 * As seis dimensões da entrevista, cada uma com nota e com a prova do que se
 * viu. O campo da prova não é burocracia: obriga quem entrevista a escrever o
 * que ouviu, e é isso que faz duas pessoas convergirem na mesma nota — e que
 * protege a casa se alguém perguntar porque é que não foi escolhido.
 */
function dimensao(name: string, label: string, ancora: string) {
  return {
    type: "row" as const,
    fields: [
      {
        name,
        label,
        type: "select" as const,
        options: [
          { label: "1 · não vi", value: "1" },
          { label: "2 · fraco", value: "2" },
          { label: "3 · cumpre", value: "3" },
          { label: "4 · bom", value: "4" },
          { label: "5 · excecional", value: "5" },
        ],
        admin: { description: ancora, width: "40%" },
      },
      { name: `${name}Note`, label: "O que vi", type: "text" as const, admin: { width: "60%" } },
    ],
  };
}

export const Applications: CollectionConfig = {
  slug: "applications",
  labels: { singular: "Candidatura", plural: "Candidaturas" },
  admin: {
    useAsTitle: "name",
    group: "Recrutamento",
    defaultColumns: ["name", "job", "status", "rating", "createdAt"],
    // Fora da vista de quem não trata disto: são dados pessoais, não conteúdo.
    hidden: ({ user }) => !temPerfil(user as ComPerfis, "recrutamento"),
  },
  hooks: { beforeChange: [setRetention, scoreApplication] },
  endpoints: [
    // O rascunho do email, e o envio. São dois passos de propósito: uma
    // rejeição enviada por engano ao mudar um menu não se desfaz.
    { path: "/:id/email", method: "get", handler: candidateEmailDraft },
    { path: "/:id/email", method: "post", handler: sendCandidateEmail },
  ],
  access: {
    read: recruiterOnly,
    update: recruiterOnly,
    delete: recruiterOnly,
    // Quem se candidata não escreve na coleção: passa pelo endpoint do site,
    // que valida, guarda o consentimento e avisa a casa.
    create: () => false,
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Candidatura",
          fields: [
            {
              type: "row",
              fields: [
                { name: "name", label: "Nome", type: "text", required: true },
                { name: "email", label: "Email", type: "email", required: true },
                { name: "phone", label: "Telefone", type: "text" },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "city", label: "Cidade", type: "text" },
                { name: "country", label: "País", type: "text", defaultValue: "Portugal" },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "portfolio", label: "Portfólio", type: "text" },
                { name: "linkedin", label: "LinkedIn", type: "text" },
              ],
            },
            {
              name: "job",
              label: "Vaga",
              type: "relationship",
              relationTo: "jobs",
              admin: { description: "Vazio quer dizer candidatura espontânea." },
            },
            {
              type: "row",
              fields: [
                { name: "function", label: "Função pretendida", type: "relationship", relationTo: "job-functions" },
                {
                  name: "department",
                  label: "Departamentos",
                  type: "relationship",
                  relationTo: "departments",
                  hasMany: true,
                  admin: { description: "Quem se candidata espontaneamente pode marcar mais do que uma área." },
                },
              ],
            },
            {
              name: "gender",
              label: "Género",
              type: "select",
              options: [
                { label: "Feminino", value: "feminino" },
                { label: "Masculino", value: "masculino" },
                { label: "Outro", value: "outro" },
                { label: "Prefere não dizer", value: "nao-diz" },
              ],
              admin: {
                description:
                  "Uso interno, para saudações («Caro», «Cara»). Não se pergunta no formulário de candidatura — vem de quem escreve, ou do histórico.",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "experienceYears",
                  label: "Experiência",
                  type: "select",
                  options: [
                    { label: "Sem experiência", value: "nenhuma" },
                    { label: "Menos de um ano", value: "menos-de-um" },
                    { label: "1 a 2 anos", value: "um-dois" },
                    { label: "3 a 5 anos", value: "tres-cinco" },
                    { label: "Mais de 5 anos", value: "mais-de-cinco" },
                  ],
                },
                {
                  name: "contractWanted",
                  label: "Vínculo pretendido",
                  type: "select",
                  options: [
                    { label: "Contrato de trabalho", value: "contrato" },
                    { label: "Estágio", value: "estagio" },
                    { label: "Freelancer", value: "freelancer" },
                  ],
                },
              ],
            },
            {
              type: "row",
              fields: [
                { name: "cv", label: "CV", type: "upload", relationTo: "documents" },
                { name: "letter", label: "Carta de motivação", type: "upload", relationTo: "documents" },
              ],
            },
            {
              name: "newsletterOptIn",
              label: "Quer receber as comunicações da Jelly",
              type: "checkbox",
              admin: { readOnly: true, description: "Consentimento separado do da candidatura, como tem de ser." },
            },
            {
              name: "answers",
              label: "Respostas",
              type: "array",
              admin: { description: "As perguntas do formulário, como foram feitas, e o que a pessoa escreveu." },
              fields: [
                { name: "question", label: "Pergunta", type: "text" },
                { name: "answer", label: "Resposta", type: "textarea" },
              ],
            },
          ],
        },
        {
          label: "Avaliação",
          description:
            "Uma ficha por quem entrevista, preenchida antes de discutirem entre si — a primeira opinião a ser dita arrasta as outras. A nota final é a média ponderada pelos pesos do departamento.",
          fields: [
            {
              name: "status",
              label: "Estado",
              type: "select",
              defaultValue: "nova",
              options: [
                { label: "Nova", value: "nova" },
                { label: "Em avaliação", value: "em_avaliacao" },
                { label: "Entrevista", value: "entrevista" },
                { label: "Aprovado", value: "aprovado" },
                { label: "Rejeitado", value: "rejeitado" },
              ],
              admin: {
                description: "Mudar o estado prepara o email para o candidato. Nada sai sem alguém carregar em enviar.",
                components: { afterInput: ["@/payload/components/CandidateEmail#CandidateEmail"] },
              },
            },
            {
              name: "evaluations",
              label: "Fichas de entrevista",
              type: "array",
              labels: { singular: "Ficha", plural: "Fichas" },
              fields: [
                {
                  type: "row",
                  fields: [
                    { name: "interviewer", label: "Quem entrevistou", type: "relationship", relationTo: "users" },
                    { name: "date", label: "Data", type: "date", admin: { date: { pickerAppearance: "dayOnly" } } },
                  ],
                },
                dimensao(
                  "empathy",
                  "Empatia",
                  "Percebeu o outro lado — do cliente, do colega. 3 reconhece que existe; 5 descreve o que o outro sentia e o que fez com isso.",
                ),
                dimensao(
                  "attitude",
                  "Atitude e iniciativa",
                  "3 fez o que lhe pediram; 5 viu o problema, avançou sem ninguém pedir, e assume o que correu mal.",
                ),
                dimensao(
                  "listening",
                  "Capacidade de ouvir",
                  "3 responde ao que foi perguntado; 5 devolve o que ouviu por outras palavras e pergunta o que falta.",
                ),
                dimensao(
                  "experience",
                  "Experiência demonstrada",
                  "Conta o que fez, não onde esteve. 3 dá um exemplo próprio; 5 dá exemplos com números e diz o que faria diferente.",
                ),
                dimensao(
                  "communication",
                  "Comunicação",
                  "3 explica-se; 5 adapta ao interlocutor e torna simples o que é complexo.",
                ),
                dimensao("fit", "Fit para a função", "A competência específica da função. 3 faz o essencial; 5 está à frente do que a vaga pede."),
                {
                  name: "recommendation",
                  label: "Recomendação",
                  type: "select",
                  options: [
                    { label: "Avançar", value: "avancar" },
                    { label: "Avançar com reservas", value: "reservas" },
                    { label: "Não avançar", value: "nao" },
                  ],
                  admin: {
                    description: "Separada da nota de propósito: uma média de 4 pode ainda assim ser um não, e ao contrário também.",
                  },
                },
                { name: "notes", label: "Notas", type: "textarea" },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "rating",
                  label: "Nota final",
                  type: "number",
                  admin: { readOnly: true, description: "Média ponderada, de 1 a 5." },
                },
                {
                  name: "spread",
                  label: "Distância entre fichas",
                  type: "number",
                  admin: {
                    readOnly: true,
                    description: "Diferença entre a ficha mais alta e a mais baixa. Acima de 1,5 vale mais conversar do que somar.",
                  },
                },
              ],
            },
            { name: "decisionNote", label: "Nota da decisão", type: "textarea", admin: { description: "Porque é que se decidiu assim. Fica no processo." } },
          ],
        },
        {
          label: "Registo",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "legacyId",
                  label: "Id no site antigo",
                  type: "text",
                  index: true,
                  unique: true,
                  admin: { readOnly: true, description: "O registo do Gravity Forms de onde esta candidatura veio. É o que impede importar duas vezes." },
                },
                { name: "consentAt", label: "Consentimento em", type: "date", admin: { readOnly: true } },
                { name: "source", label: "Origem", type: "text", admin: { readOnly: true } },
                {
                  name: "retentionUntil",
                  label: "Apagar em",
                  type: "date",
                  admin: {
                    readOnly: true,
                    description: "Doze meses para as espontâneas, seis meses depois de a vaga fechar. Um trabalho diário apaga o que passou desta data.",
                  },
                },
              ],
            },
            {
              name: "emails",
              label: "Emails enviados",
              type: "array",
              admin: { readOnly: true },
              fields: [
                { name: "kind", label: "Estado comunicado", type: "text" },
                { name: "sentAt", label: "Quando", type: "date" },
                { name: "sentBy", label: "Por quem", type: "relationship", relationTo: "users" },
                { name: "to", label: "Para", type: "text" },
                { name: "subject", label: "Assunto", type: "text" },
                { name: "body", label: "Texto enviado", type: "textarea" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
