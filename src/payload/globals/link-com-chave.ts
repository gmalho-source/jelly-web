import { randomBytes, timingSafeEqual } from "node:crypto";
import type { GlobalBeforeChangeHook, GlobalConfig, Payload, PayloadHandler } from "payload";
import { escondeDe, podeNoPedido, so, type Modulo } from "../acesso";

/**
 * Um link fixo com chave: uma página pública onde alguém de fora preenche e
 * assina — o NDA dos prestadores, a autorização de débito direto dos clientes.
 *
 * O link leva a chave (`<caminho>/<chave>`). Sem ela, a página não abre: quem
 * não recebeu o link não o encontra. Se o link se espalhar para onde não
 * devia, troca-se a chave no painel e o antigo deixa de abrir no momento
 * seguinte. Desligar fecha-o sem trocar a chave.
 */
export const novaChave = () => randomBytes(18).toString("base64url");

/**
 * A chave só muda pelo botão. O formulário do painel manda-a de volta com o
 * valor de quando a página abriu: sem isto, guardar depois de trocar a chave
 * repunha a antiga.
 */
const chaveSoPeloBotao: GlobalBeforeChangeHook = ({ data, originalDoc, context }) => {
  if (!context?.trocarChave) data.chave = (originalDoc as { chave?: string } | undefined)?.chave ?? null;
  return data;
};

export function globalDeLink({
  slug,
  label,
  modulo,
  group,
  description,
  componente,
}: {
  slug: string;
  label: string;
  modulo: Modulo;
  group: string;
  description: string;
  componente: string;
}): GlobalConfig {
  const trocarChave: PayloadHandler = async (req) => {
    if (!podeNoPedido(req, modulo)) return Response.json({ error: "Sem acesso a este módulo do painel." }, { status: 403 });
    const chave = novaChave();
    await req.payload.updateGlobal({ slug: slug as never, data: { chave, ativo: true } as never, overrideAccess: true, context: { trocarChave: true } });
    return Response.json({ chave });
  };
  return {
    slug,
    label,
    admin: { group, hidden: escondeDe(modulo), description },
    access: { read: so(modulo), update: so(modulo) },
    hooks: { beforeChange: [chaveSoPeloBotao] },
    endpoints: [{ path: "/trocar-chave", method: "post", handler: trocarChave }],
    fields: [
      { name: "link", type: "ui", admin: { components: { Field: componente } } },
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
}

/** A chave de um link, comparada sem dar pistas pelo tempo que demora. */
export async function chaveDoLinkValida(payload: Payload, slug: string, chave: string): Promise<boolean> {
  const global = (await payload.findGlobal({ slug: slug as never, overrideAccess: true }).catch(() => null)) as { ativo?: boolean | null; chave?: string | null } | null;
  if (!global?.ativo || !global.chave || !chave) return false;
  const a = Buffer.from(global.chave);
  const b = Buffer.from(chave);
  return a.length === b.length && timingSafeEqual(a, b);
}
