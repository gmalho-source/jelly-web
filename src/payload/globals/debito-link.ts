import { globalDeLink } from "./link-com-chave";

/**
 * O link único dos débitos diretos: o cliente abre-o, preenche a autorização
 * e assina, sem a Jelly ter de criar nada antes (`/assinar/sepa/<chave>`).
 */
export const DebitoLink = globalDeLink({
  slug: "debito-link",
  label: "Link dos débitos diretos",
  modulo: "debitos",
  group: "Faturação",
  description:
    "O link que se partilha com os clientes. Abrem, preenchem a autorização de débito direto (empresa, NIF, IBAN, quem assina) e assinam com um código por email. A autorização aparece em «Débitos diretos», marcada «Pelo link».",
  componente: "@/payload/components/LinkDoDebito#LinkDoDebito",
});
