import { env, envOr } from "@/lib/env";

/**
 * Um briefing novo do site abre um negócio no Pipedrive.
 *
 * Segue a convenção que já lá está e que se lê nos negócios existentes: título
 * «Desafio de {Nome} | {Empresa}», primeira etapa do pipeline comercial, pessoa
 * e organização criadas e ligadas, e o texto do briefing no campo próprio. Não
 * se inventa um formato novo ao lado do que a equipa já usa.
 *
 * Nada disto pode fazer falhar o formulário. Se o Pipedrive estiver em baixo, ou
 * a chave estiver errada, o pedido continua gravado na base e os emails saem: o
 * negócio é uma consequência do briefing, não a condição dele. Por isso todas as
 * falhas ficam no log e nenhuma sobe.
 *
 * Corre depois da resposta ao browser (`after()` na rota), para quem submeteu
 * não ficar à espera de três chamadas a um servidor de fora.
 */

const BASE = "https://api.pipedrive.com/api/v2";
// As notas ficaram de fora da v2 da API: só existem na v1. O resto — negócios,
// pessoas, organizações, procura — é v2.
const BASE_V1 = "https://api.pipedrive.com/v1";

/** Os identificadores lidos da conta, com os valores em uso por omissão. */
const config = () => ({
  chave: env(process.env.PIPEDRIVE_API_TOKEN),
  pipeline: Number(envOr(process.env.PIPEDRIVE_PIPELINE_ID, "1")),
  etapa: Number(envOr(process.env.PIPEDRIVE_STAGE_ID, "24")),
  dono: env(process.env.PIPEDRIVE_OWNER_ID),
  // O campo onde os negócios do site guardam o texto do briefing.
  campoBriefing: envOr(
    process.env.PIPEDRIVE_FIELD_BRIEFING,
    "80534f41dd48cbda026a5071a8fc651ce451aaa7",
  ),
});

type Resposta<T> = { success?: boolean; data?: T };

async function chama<T>(
  chave: string,
  caminho: string,
  opcoes?: { metodo?: "GET" | "POST"; corpo?: unknown; v1?: boolean },
): Promise<T | undefined> {
  const resposta = await fetch(`${opcoes?.v1 ? BASE_V1 : BASE}${caminho}`, {
    method: opcoes?.metodo ?? "GET",
    headers: {
      "x-api-token": chave,
      accept: "application/json",
      ...(opcoes?.corpo ? { "content-type": "application/json" } : {}),
    },
    ...(opcoes?.corpo ? { body: JSON.stringify(opcoes.corpo) } : {}),
  });

  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    console.error(`[pipedrive] ${opcoes?.metodo ?? "GET"} ${caminho}: ${resposta.status} ${texto.slice(0, 240)}`);
    return undefined;
  }

  const corpo = (await resposta.json().catch(() => ({}))) as Resposta<T>;
  return corpo.data;
}

/** Procura por termo exacto e devolve o primeiro id, ou nada. */
async function procura(chave: string, tipo: "persons" | "organizations", termo: string, campos?: string) {
  const parametros = new URLSearchParams({ term: termo, exact_match: "true", limit: "1" });
  if (campos) parametros.set("fields", campos);
  const dados = await chama<{ items?: { item?: { id?: number } }[] }>(
    chave,
    `/${tipo}/search?${parametros.toString()}`,
  );
  return dados?.items?.[0]?.item?.id;
}

export type Briefing = {
  nome: string;
  empresa: string;
  email: string;
  /** Já com indicativo, ou vazio. */
  telefone: string;
  /** A janela de arranque em texto, ou vazio. */
  janela: string;
  mensagem: string;
  /** Endereço absoluto do ficheiro anexado, se houver. */
  briefingUrl?: string;
  /** O registo na base do site, para se ir da ficha ao original. */
  mensagemId?: string | number;
};

export type Negocio = { ok: boolean; dealId?: number; erro?: string };

export async function abreNegocio(briefing: Briefing): Promise<Negocio> {
  const { chave, pipeline, etapa, dono, campoBriefing } = config();
  if (!chave) {
    console.info("[pipedrive] sem chave neste ambiente: não abriu negócio");
    return { ok: false, erro: "sem chave" };
  }

  try {
    // A organização primeiro, para a pessoa já nascer ligada a ela. Reaproveita-se
    // a que existir: um cliente que volta não precisa de uma segunda ficha.
    let orgId: number | undefined;
    if (briefing.empresa) {
      orgId = await procura(chave, "organizations", briefing.empresa);
      if (!orgId) {
        const criada = await chama<{ id?: number }>(chave, "/organizations", {
          metodo: "POST",
          corpo: { name: briefing.empresa, ...(dono ? { owner_id: Number(dono) } : {}) },
        });
        orgId = criada?.id;
      }
    }

    // A pessoa procura-se pelo email, que é o que identifica alguém sem dúvida —
    // o nome repete-se.
    let personId = await procura(chave, "persons", briefing.email, "email");
    if (!personId) {
      const criada = await chama<{ id?: number }>(chave, "/persons", {
        metodo: "POST",
        corpo: {
          name: briefing.nome,
          emails: [{ value: briefing.email, primary: true, label: "work" }],
          ...(briefing.telefone ? { phones: [{ value: briefing.telefone, primary: true, label: "work" }] } : {}),
          ...(orgId ? { org_id: orgId } : {}),
          ...(dono ? { owner_id: Number(dono) } : {}),
        },
      });
      personId = criada?.id;
    }

    const primeiro = briefing.nome.trim().split(/\s+/)[0] ?? briefing.nome;
    const negocio = await chama<{ id?: number }>(chave, "/deals", {
      metodo: "POST",
      corpo: {
        title: `Desafio de ${primeiro}${briefing.empresa ? ` | ${briefing.empresa}` : ""}`,
        pipeline_id: pipeline,
        stage_id: etapa,
        currency: "EUR",
        ...(personId ? { person_id: personId } : {}),
        ...(orgId ? { org_id: orgId } : {}),
        ...(dono ? { owner_id: Number(dono) } : {}),
        ...(campoBriefing ? { custom_fields: { [campoBriefing]: briefing.mensagem } } : {}),
      },
    });

    if (!negocio?.id) return { ok: false, erro: "o negócio não foi criado" };

    // E uma nota com o que não cabe nos campos. Vai também o texto do briefing:
    // se o campo próprio mudar de chave um dia, a nota fica.
    const nota = [
      "<b>Briefing do site</b>",
      briefing.telefone ? `Telefone: ${briefing.telefone}` : "",
      briefing.janela ? `Quer arrancar: ${briefing.janela}` : "",
      briefing.briefingUrl ? `Ficheiro anexado: <a href="${briefing.briefingUrl}">abrir</a>` : "",
      briefing.mensagemId ? `Registo no site: mensagem #${briefing.mensagemId}` : "",
      "",
      briefing.mensagem.replace(/\n/g, "<br>"),
    ]
      .filter(Boolean)
      .join("<br>");

    await chama(chave, "/notes", { metodo: "POST", v1: true, corpo: { deal_id: negocio.id, content: nota } });

    console.info(`[pipedrive] negócio ${negocio.id} aberto para ${briefing.email}`);
    return { ok: true, dealId: negocio.id };
  } catch (erro) {
    // Uma exceção aqui não pode chegar a quem submeteu o formulário.
    console.error("[pipedrive] não abriu negócio", erro);
    return { ok: false, erro: erro instanceof Error ? erro.message : "erro" };
  }
}
