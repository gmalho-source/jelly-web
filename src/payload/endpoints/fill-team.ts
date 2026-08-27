import type { PayloadHandler } from "payload";
import { camposEmFalta, equipaDoFicheiro, nomesDoQueFalta, pessoasDoFicheiro } from "@/lib/equipa-fichas";
import { SITE_URL } from "@/lib/seo";

/**
 * Enche as fichas da equipa no painel a partir do ficheiro do repositório.
 *
 * As vinte e uma pessoas entraram no CMS só com o nome, e o site ia buscar o
 * resto — função, apresentação, LinkedIn e os dois retratos — a
 * `src/content/team.ts`. Serve quem lê o site, mas quem abre a ficha no painel
 * encontra um formulário vazio e não tem por onde corrigir nada.
 *
 * Existe também como script de linha de comandos (`npm run equipa`), e as regras
 * de o que preencher são as mesmas — vivem em `src/lib/equipa-fichas.ts`. A
 * diferença é o sítio: isto corre no servidor do site, onde a base de dados e o
 * armazenamento das imagens já estão ligados, e por isso não pede ambiente
 * nenhum a quem carrega no botão.
 *
 * Uma pessoa por chamada, de propósito: são dois retratos a descarregar e a
 * subir por pessoa, e quarenta e dois numa só chamada não caberiam no tempo que
 * uma função tem para responder. O painel chama isto vinte e uma vezes e mostra
 * por onde vai.
 */

function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 });
  return null;
}

/** A ficha de uma pessoa, pelo nome. */
async function fichaDe(req: Parameters<PayloadHandler>[0], nome: string) {
  const { docs } = await req.payload.find({
    collection: "team",
    where: { name: { equals: nome } },
    limit: 1,
    depth: 0,
  });
  return docs[0] as unknown as Record<string, unknown> | undefined;
}

/**
 * Diz o que falta a cada pessoa, para o painel poder avisar antes de mexer em
 * nada e para saber a quem tem de chamar.
 *
 * GET /api/team/preencher
 */
export const teamPlan: PayloadHandler = async (req) => {
  const fechado = porta(req);
  if (fechado) return fechado;

  const { docs } = await req.payload.find({ collection: "team", limit: 0, depth: 0 });
  const noPainel = new Map(
    (docs as unknown as Record<string, unknown>[]).map((doc) => [String(doc.name ?? "").trim().toLowerCase(), doc]),
  );

  const pessoas = equipaDoFicheiro.map((pessoa) => ({
    nome: pessoa.name,
    existe: noPainel.has(pessoa.name.trim().toLowerCase()),
    faltam: nomesDoQueFalta(pessoa, noPainel.get(pessoa.name.trim().toLowerCase())),
  }));

  // Quem está no painel e não está no ficheiro fica como está: pode ser alguém
  // que entrou na casa depois de o ficheiro ter sido escrito.
  const doFicheiro = pessoasDoFicheiro();
  const soNoPainel = [...noPainel.values()]
    .filter((doc) => !doFicheiro.has(String(doc.name ?? "").trim().toLowerCase()))
    .map((doc) => String(doc.name ?? ""));

  return Response.json({
    pessoas,
    porFazer: pessoas.filter((pessoa) => pessoa.faltam.length).length,
    soNoPainel,
  });
};

/**
 * Enche a ficha de uma pessoa.
 *
 * POST /api/team/preencher
 * { nome }
 */
export const fillTeamMember: PayloadHandler = async (req) => {
  const fechado = porta(req);
  if (fechado) return fechado;

  const pedido = (await req.json?.()) as { nome?: string } | undefined;
  const nome = (pedido?.nome ?? "").trim();
  const pessoa = pessoasDoFicheiro().get(nome.toLowerCase());
  if (!pessoa) return Response.json({ error: `«${nome}» não está no ficheiro da equipa.` }, { status: 404 });

  const ficha = await fichaDe(req, pessoa.name);
  const { dados, retratos } = camposEmFalta(pessoa, ficha);

  // Os retratos vêm do próprio site e não do disco: em produção a pasta
  // `public/` é servida pela rede e não vai dentro da função, por isso não há lá
  // ficheiro para abrir. A origem sai do pedido que está a ser servido — é a
  // deste deploy, e não a de uma variável que pode apontar ao site antigo.
  const origem = (() => {
    try {
      return new URL(req.url ?? "").origin;
    } catch {
      return SITE_URL;
    }
  })();

  const feitos: string[] = [];

  for (const retrato of retratos) {
    const ficheiro = retrato.src.split("/").pop() ?? "";

    // A mesma imagem não entra duas vezes na biblioteca: procura-se antes de
    // subir. A procura é pelo nome sem extensão e não pelo nome exacto porque o
    // Payload acrescenta `-1` a um ficheiro que já exista no armazenamento — e
    // é isso que acontece a quem corra isto uma segunda vez depois de uma
    // primeira ter parado a meio.
    const raiz = ficheiro.replace(/\.\w+$/, "");
    const { docs } = await req.payload.find({
      collection: "media",
      where: { filename: { like: raiz } },
      limit: 1,
      depth: 0,
    });

    let id = docs[0]?.id;
    if (!id) {
      const resposta = await fetch(`${origem}${retrato.src}`);
      if (!resposta.ok) {
        return Response.json(
          { error: `o retrato ${ficheiro} não veio (${resposta.status})` },
          { status: 502 },
        );
      }
      const bytes = Buffer.from(await resposta.arrayBuffer());
      const criada = await req.payload.create({
        collection: "media",
        data: { title: retrato.titulo, alt: retrato.alt },
        file: { name: ficheiro, data: bytes, mimetype: "image/webp", size: bytes.byteLength },
        overrideAccess: true,
      });
      id = criada.id;
    }

    dados[retrato.campo] = id;
    feitos.push(retrato.campo);
  }

  const campos = [...Object.keys(dados)];

  if (!ficha) {
    await req.payload.create({
      collection: "team",
      data: { name: pessoa.name, ...dados } as never,
      overrideAccess: true,
    });
    return Response.json({ nome: pessoa.name, estado: "criada", campos });
  }

  if (!campos.length) return Response.json({ nome: pessoa.name, estado: "completa", campos: [] });

  await req.payload.update({
    collection: "team",
    id: ficha.id as number,
    data: dados as never,
    overrideAccess: true,
  });
  return Response.json({ nome: pessoa.name, estado: "enchida", campos });
};
