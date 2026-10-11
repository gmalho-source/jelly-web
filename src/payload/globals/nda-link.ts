import { globalDeLink } from "./link-com-chave";

/**
 * O link fixo do NDA: uma página onde o próprio prestador escreve os seus dados
 * e assina, sem ninguém ter de lhe criar a ficha antes (`/assinar/nda/<chave>`).
 */
export const NdaLink = globalDeLink({
  slug: "nda-link",
  label: "Link do NDA",
  modulo: "assinaturas",
  group: "Assinaturas",
  description:
    "O link que se manda aos prestadores novos. Abrem, escrevem os dados, confirmam o email com um código e assinam o NDA. No fim, a ficha deles é criada (em «Parado») ou, se o email já existir, o NDA fica nessa ficha.",
  componente: "@/payload/components/LinkDoNda#LinkDoNda",
});
