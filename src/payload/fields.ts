import type { Field } from "payload";
import {
  BoldFeature,
  FixedToolbarFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  lexicalEditor,
} from "@payloadcms/richtext-lexical";

/**
 * Tradução ao nível do campo, como no modelo anterior: um par { pt, en } por
 * texto. O Payload tem localização nativa, mas ela guarda uma linha por língua
 * e obriga a trocar de contexto no editor — aqui as duas línguas ficam lado a
 * lado, que é como esta casa escreve.
 */
export function locale(name: string, label: string, options: { long?: boolean; required?: boolean } = {}): Field {
  // O tipo do Payload é discriminado por `type`: um ternário no campo não passa
  // a verificação, por isso os dois casos escrevem-se inteiros.
  const fields: Field[] = options.long
    ? [
        { name: "pt", label: "Português", type: "textarea", required: options.required },
        { name: "en", label: "English", type: "textarea" },
      ]
    : [
        { name: "pt", label: "Português", type: "text", required: options.required },
        { name: "en", label: "English", type: "text" },
      ];

  return { name, label, type: "group", fields };
}

/** Slug com aviso: mudar um slug parte um URL que já existe. */
export const slugField: Field = {
  name: "slug",
  type: "text",
  required: true,
  unique: true,
  index: true,
  admin: { description: "Entra no URL. Mudar isto parte links que já existem." },
};

/**
 * Slug em inglês. Vazio, o site em inglês usa o português — é o que faz sentido
 * num nome de cliente, que não se traduz. Num artigo, um endereço em português
 * numa página em inglês afasta quem procura em inglês, e é essa a razão de
 * existir este campo.
 */
export const slugEnField: Field = {
  name: "slugEn",
  label: "Slug (EN)",
  type: "text",
  unique: true,
  index: true,
  admin: {
    description: "Entra no endereço em inglês (/en/…). Vazio, o inglês usa o slug português.",
    position: "sidebar",
  },
};

/**
 * Os endereços que esta peça já teve.
 *
 * Escreve-se sozinho — o gancho `guardaSlugsAntigos` trata disso — e está à
 * vista para se poder tirar um à mão no dia em que alguém quiser reutilizar um
 * endereço antigo noutra peça.
 */
export const oldSlugsField: Field = {
  name: "oldSlugs",
  label: "Endereços antigos",
  type: "text",
  hasMany: true,
  admin: {
    position: "sidebar",
    readOnly: true,
    description: "Guardados sozinhos quando o slug muda. Quem chegar por um deles é reencaminhado para o atual.",
  },
};

export function kpiField(name: string, label: string, many = false): Field {
  const fields: Field[] = [
    { name: "value", label: "Valor", type: "text", admin: { description: "Como sai para o ecrã: +38%, 2,4x, 11 dias." } },
    locale("label", "Legenda"),
  ];
  return many ? { name, label, type: "array", maxRows: 4, fields } : { name, label, type: "group", fields };
}

/*
 * ── Texto com marcação, para as vagas ─────────────────────────────────────
 *
 * Duas réguas, porque um parágrafo e um ponto de uma lista não são a mesma
 * coisa.
 *
 * `PARAGRAFOS` é para a abertura e o fecho de uma vaga: texto corrido, com os
 * parágrafos que forem precisos, negrito, itálico e links.
 *
 * `LINHA` é para cada ponto das listas — responsabilidades, requisitos,
 * qualificações, benefícios. Ali a lista já é a lista: cada linha do painel é
 * um ponto na página. O que faltava era poder marcar uma palavra dentro da
 * frase, e é só isso que esta régua dá. Sem títulos, sem listas dentro de
 * listas, sem blocos: uma lista com listas lá dentro deixa de se ler como uma
 * lista, e os dados estruturados que o Google lê numa vaga deixam de ser
 * fiáveis.
 */
const PARAGRAFOS = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({ enabledCollections: [] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
});

const LINHA = lexicalEditor({
  features: () => [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    LinkFeature({ enabledCollections: [] }),
    InlineToolbarFeature(),
  ],
});

/**
 * Um campo com marcação, sem o par de línguas.
 *
 * A apresentação de um autor é isto: uma frase só, que vive no fim de um
 * artigo. Passou a aceitar marcação porque quem escreve precisa de poder
 * apontar para o LinkedIn ou para o sítio da pessoa, e um endereço escrito por
 * extenso no meio de uma frase de apresentação lê-se mal.
 *
 * A régua é a curta, a mesma dos pontos de uma lista: negrito, itálico e
 * links, e mais nada. Um currículo dentro de um campo que se chama «uma linha»
 * seria o campo a prometer uma coisa e a entregar outra.
 */
export function rico(
  name: string,
  label: string,
  options: { linha?: boolean; descricao?: string } = {},
): Field {
  return {
    name,
    label,
    type: "richText",
    editor: options.linha ? LINHA : PARAGRAFOS,
    ...(options.descricao ? { admin: { description: options.descricao } } : {}),
  };
}

/**
 * O mesmo par { pt, en } do `locale`, mas com marcação.
 *
 * `linha` escolhe a régua curta — a das listas. Sem ela, a régua dos
 * parágrafos.
 */
export function localeRico(name: string, label: string, options: { linha?: boolean } = {}): Field {
  const editor = options.linha ? LINHA : PARAGRAFOS;
  return {
    name,
    label,
    type: "group",
    fields: [
      { name: "pt", label: "Português", type: "richText", editor },
      { name: "en", label: "English", type: "richText", editor },
    ],
  };
}
