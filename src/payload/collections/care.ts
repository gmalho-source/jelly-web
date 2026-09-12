import type { CollectionConfig } from "payload";
import { locale } from "../fields";
import { revalidateEverythingOnChange, revalidateEverythingOnDelete } from "../hooks/revalidate";

/**
 * Os planos JellyCARE.
 *
 * O preço de um plano muda, o nome muda, uma campanha de arranque começa numa
 * segunda-feira e acaba a 31 de dezembro. Nada disto pode obrigar a um deploy,
 * e foi por isso que saiu do código: a página lê daqui, e o que está no
 * repositório é só a rede de segurança para quando não há painel.
 *
 * Uma coisa não vive aqui: o texto à volta dos planos — a abertura da página,
 * os nove serviços, os passos. Isso é a página, e a página é código. Aqui está
 * o que se negoceia.
 */
export const CarePlans: CollectionConfig = {
  slug: "care-plans",
  labels: { singular: "Plano JellyCARE", plural: "Planos JellyCARE" },
  admin: {
    useAsTitle: "name",
    group: "Casa",
    defaultColumns: ["name", "price", "order", "active"],
    description: "Os planos que a página /jellycare mostra e o formulário oferece.",
  },
  access: { read: () => true },
  hooks: { afterChange: [revalidateEverythingOnChange], afterDelete: [revalidateEverythingOnDelete] },
  defaultSort: "order",
  fields: [
    {
      type: "row",
      fields: [
        { name: "name", label: "Nome", type: "text", required: true, admin: { description: "JellyCARE, JellyCARE Plus, …" } },
        {
          name: "key",
          label: "Chave",
          type: "text",
          required: true,
          unique: true,
          index: true,
          admin: { description: "Identifica o plano no formulário e nos emails. Minúsculas, sem espaços: jellycare, jellycare-plus." },
        },
      ],
    },
    {
      type: "row",
      fields: [
        { name: "price", label: "Preço", type: "number", required: true, admin: { description: "Por mês, em euros, sem IVA." } },
        { name: "order", label: "Ordem", type: "number", defaultValue: 100 },
        { name: "active", label: "Ativo", type: "checkbox", defaultValue: true, admin: { description: "Desligado, sai da página e do formulário." } },
      ],
    },
    locale("badge", "Selo", { }),
    {
      name: "features",
      label: "Características",
      type: "array",
      admin: { description: "Uma linha por característica, pela ordem em que aparecem no cartão." },
      fields: [locale("item", "Linha", { required: true })],
    },

    /*
     * A campanha de arranque.
     *
     * Fica num grupo próprio e desligado por omissão: uma campanha é uma
     * exceção com data, não uma propriedade do plano. Quando o dia chegar,
     * basta desligar o visto — o preço volta ao que era sem se reescrever nada.
     */
    {
      name: "campaign",
      label: "Campanha de arranque",
      type: "group",
      admin: { description: "Desconto de entrada: primeiro mês mais barato, meses oferecidos, o que for." },
      fields: [
        {
          type: "row",
          fields: [
            { name: "active", label: "Campanha a decorrer", type: "checkbox", defaultValue: false },
            {
              name: "until",
              label: "Até",
              type: "date",
              admin: {
                date: { pickerAppearance: "dayOnly", displayFormat: "dd/MM/yyyy" },
                description: "Opcional. Passada a data, a campanha deixa de aparecer sozinha.",
              },
            },
          ],
        },
        locale("label", "O que a campanha diz", {}),
        {
          name: "firstPrice",
          label: "Preço do primeiro mês",
          type: "number",
          admin: { description: "Opcional. Preenchido, o cartão mostra este valor e risca o preço normal." },
        },
      ],
    },
  ],
};
