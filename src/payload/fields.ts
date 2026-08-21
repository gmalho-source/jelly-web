import type { Field } from "payload";

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

export function kpiField(name: string, label: string, many = false): Field {
  const fields: Field[] = [
    { name: "value", label: "Valor", type: "text", admin: { description: "Como sai para o ecrã: +38%, 2,4x, 11 dias." } },
    locale("label", "Legenda"),
  ];
  return many ? { name, label, type: "array", maxRows: 4, fields } : { name, label, type: "group", fields };
}
