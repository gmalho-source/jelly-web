import { randomBytes } from "node:crypto";
import type { GlobalBeforeChangeHook, GlobalConfig, PayloadHandler } from "payload";
import { soAdministracao } from "../collections/assinaturas";
import { temPerfil, type ComPerfis } from "../collections/recruitment";

/**
 * O link fixo do NDA: uma página onde o próprio prestador escreve os seus dados
 * e assina, sem ninguém ter de lhe criar a ficha antes.
 *
 * O link leva uma chave (`/assinar/nda/<chave>`). Sem ela, a página não abre:
 * quem não recebeu o link não o encontra. Se o link se espalhar para onde não
 * devia, troca-se a chave aqui e o antigo deixa de abrir no momento seguinte.
 * Desligar fecha-o sem trocar a chave.
 */
export const novaChave = () => randomBytes(18).toString("base64url");

const trocarChave: PayloadHandler = async (req) => {
  if (!req.user || !temPerfil(req.user as ComPerfis)) return Response.json({ error: "Só para a administração." }, { status: 403 });
  const chave = novaChave();
  await req.payload.updateGlobal({ slug: "nda-link", data: { chave, ativo: true }, overrideAccess: true, context: { trocarChave: true } });
  return Response.json({ chave });
};

/**
 * A chave só muda pelo botão. O formulário do painel manda-a de volta com o
 * valor de quando a página abriu: sem isto, guardar depois de trocar a chave
 * repunha a antiga.
 */
const chaveSoPeloBotao: GlobalBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (!context?.trocarChave) data.chave = (originalDoc as { chave?: string } | undefined)?.chave ?? null;
  return data;
};

export const NdaLink: GlobalConfig = {
  slug: "nda-link",
  label: "Link do NDA",
  admin: {
    group: "Assinaturas",
    description:
      "O link que se manda aos prestadores novos. Abrem, escrevem os dados, confirmam o email com um código e assinam o NDA. No fim, a ficha deles é criada (em «Parado») ou, se o email já existir, o NDA fica nessa ficha.",
  },
  access: { read: soAdministracao, update: soAdministracao },
  hooks: { beforeChange: [chaveSoPeloBotao] },
  endpoints: [{ path: "/trocar-chave", method: "post", handler: trocarChave }],
  fields: [
    { name: "link", type: "ui", admin: { components: { Field: "@/payload/components/LinkDoNda#LinkDoNda" } } },
    {
      name: "ativo",
      label: "Link ativo",
      type: "checkbox",
      defaultValue: true,
      admin: { description: "Desligado, o link mostra que não está disponível. A chave fica a mesma." },
    },
    { name: "chave", type: "text", admin: { hidden: true } },
  ],
};
