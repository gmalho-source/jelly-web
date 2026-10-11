import type { PayloadHandler } from "payload";

/**
 * POST /api/applications/:id/prestador
 *
 * A candidatura que deu contratação passa a ficha de prestador. Do que a pessoa
 * escreveu para se candidatar só segue o que serve para lhe pagar e falar com
 * ela — nome, email, telefone. O CV, a carta, as respostas e a avaliação ficam
 * na candidatura, com o prazo que lá têm; a ficha nova liga-se a ela, e é por
 * essa ligação que se chega ao CV quando for preciso.
 *
 * O prestador nasce «parado»: a ficha ainda não tem morada, NIF nem IBAN, e só
 * quem está qualificado entra em billing. A candidatura passa a «contratado».
 *
 * Se já houver um prestador com o mesmo email, não se cria outro: liga-se a
 * candidatura a esse e devolve-se o dele, sem lhe mexer no estado — um
 * desqualificado não volta por ter mandado um CV.
 */
type Candidatura = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  function?: { namePt?: string | null } | number | null;
  department?: ({ namePt?: string | null } | number)[] | null;
};

type Prestador = { id: number; nome?: string | null; estado?: string | null; candidatura?: number | { id: number } | null };

const POOLS: [RegExp, string][] = [
  [/v[íi]deo|motion/i, "video"],
  [/multim[ée]dia/i, "multimedia"],
  [/design/i, "design"],
  [/develop|programa/i, "development"],
  [/marketing|performance|social|seo|ppc|copy|account/i, "marketing"],
];

const poolDe = (nome?: string | null) => (nome ? POOLS.find(([padrao]) => padrao.test(nome))?.[1] : undefined);

/**
 * A pool que a candidatura sugere. A função diz mais do que o departamento —
 * «Video Editor e Motion Designer» é vídeo, não design. Sem função, só se o
 * departamento apontar para uma pool; com dois que apontem para pools
 * diferentes, fica vazia e escolhe quem abre a ficha.
 */
function sugerePool(c: Candidatura): string | undefined {
  const funcao = typeof c.function === "object" ? poolDe(c.function?.namePt) : undefined;
  if (funcao) return funcao;
  const dos = new Set((c.department ?? []).map((d) => (typeof d === "object" ? poolDe(d.namePt) : undefined)).filter(Boolean));
  return dos.size === 1 ? [...dos][0] : undefined;
}

export const passarAPrestador: PayloadHandler = async (req) => {
  // A mesma porta das outras ações da candidatura. Não se importa o
  // `temPerfil` da coleção: a coleção importa este ficheiro.
  const user = req.user as { roles?: string[] | null } | null | undefined;
  if (!user) return Response.json({ error: "Sem sessão." }, { status: 401 });
  const perfis = user.roles ?? [];
  if (perfis.length && !perfis.includes("admin") && !perfis.includes("recrutamento")) {
    return Response.json({ error: "Sem perfil de recrutamento." }, { status: 403 });
  }
  const id = req.routeParams?.id;
  if (!id) return Response.json({ error: "Falta a candidatura." }, { status: 400 });

  const { payload } = req;
  const c = (await payload.findByID({ collection: "applications", id: String(id), depth: 1, overrideAccess: true }).catch(() => null)) as Candidatura | null;
  if (!c) return Response.json({ error: "Candidatura não encontrada." }, { status: 404 });
  const email = c.email?.trim().toLowerCase();
  if (!email) return Response.json({ error: "A candidatura não tem email." }, { status: 400 });

  const procura = async () =>
    (await payload.find({ collection: "prestadores", where: { email: { equals: email } }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as
      | Prestador
      | undefined;

  let prestador = await procura();
  let existia = Boolean(prestador);
  if (!prestador) {
    try {
      prestador = (await payload.create({
        collection: "prestadores",
        overrideAccess: true,
        data: {
          nome: c.name?.trim() || email,
          email,
          telefone: c.phone?.trim() || undefined,
          estado: "parado",
          tipo: "singular",
          pool: sugerePool(c),
          candidatura: c.id,
        } as never,
      })) as unknown as Prestador;
    } catch (erro) {
      // Dois cliques ao mesmo tempo: o email é único, e o segundo perde. Fica o
      // do primeiro.
      prestador = await procura();
      if (!prestador) throw erro;
      existia = true;
    }
  }

  if (existia && !prestador.candidatura) {
    await payload.update({ collection: "prestadores", id: prestador.id, data: { candidatura: c.id } as never, overrideAccess: true });
  }
  await payload.update({ collection: "applications", id: c.id, data: { status: "contratado" } as never, overrideAccess: true });

  return Response.json({ id: prestador.id, existia, estado: prestador.estado ?? null });
};
