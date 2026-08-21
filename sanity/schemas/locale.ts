/**
 * Tradução ao nível do campo: um objeto { pt, en } por texto.
 * É o modelo mais simples de editar (as duas línguas lado a lado) e devolve
 * exatamente o tipo Localized que o site já usa.
 */
export const localeString = {
  name: "localeString",
  title: "Texto",
  type: "object",
  fields: [
    { name: "pt", title: "Português", type: "string" },
    { name: "en", title: "English", type: "string" },
  ],
};

export const localeText = {
  name: "localeText",
  title: "Texto longo",
  type: "object",
  fields: [
    { name: "pt", title: "Português", type: "text", rows: 3 },
    { name: "en", title: "English", type: "text", rows: 3 },
  ],
};

/** Campo localizado com validação de obrigatoriedade só no PT. */
export function locale(name: string, title: string, long = false) {
  return {
    name,
    title,
    type: long ? "localeText" : "localeString",
  };
}
