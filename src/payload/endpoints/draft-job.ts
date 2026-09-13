import Anthropic from "@anthropic-ai/sdk";
import type { PayloadHandler } from "payload";

const MODEL = "claude-opus-5";

/**
 * Um rascunho de vaga, escrito pelo Claude a partir do nome da função.
 *
 * Escrever uma vaga do zero é a parte que faz as vagas ficarem por publicar:
 * quem recruta sabe perfeitamente o que quer da pessoa e passa uma tarde a
 * procurar as palavras. Isto dá-lhe a tarde de volta — propõe a abertura, as
 * responsabilidades, os requisitos, as qualificações desejadas e o fecho, nas
 * duas línguas, a partir do pouco que já está preenchido no formulário.
 *
 * Não grava, e no painel não escreve por cima do que já lá está. Uma vaga é a
 * primeira coisa que um candidato lê sobre a casa; o modelo escreve, quem
 * recruta corrige, e só depois se publica.
 *
 * As duas línguas saem da mesma ida ao modelo, e não de uma tradução a seguir:
 * uma vaga inglesa traduzida à letra de uma portuguesa lê-se como uma tradução,
 * e é suposto ler-se como uma vaga.
 */

const REGRAS = `Escreves anúncios de emprego para a Jelly, uma agência portuguesa de marketing digital, tecnologia e inteligência artificial, com escritório em Lisboa.

Recebes o que já se sabe da vaga — o título, a função, o departamento, a senioridade, o vínculo, o regime e o local — e propões o texto que falta. Quem recruta vai ler, cortar e corrigir: propõe o que é provável, não o que é vago.

Como a casa escreve:
- Português europeu. Nunca português do Brasil. E inglês britânico.
- Frases curtas e concretas. Diz o trabalho, não o ambiente.
- Trata o candidato por "tu" em português — a Jelly trata-se por tu.
- Sem "procuramos uma pessoa apaixonada", "ambiente dinâmico", "somos uma família", "rockstar", "ninja", sem emoji e sem exclamações.
- Sem promessas que a casa não pode cumprir: nada de salários, prémios ou progressões inventadas.
- Nada de discriminação por idade, género, nacionalidade ou situação familiar, nem por outra via ("jovem e dinâmico" é idade).

O que cada parte é:
- abertura: dois a quatro períodos. O que a pessoa vai fazer, e porquê agora. É o primeiro parágrafo da página, antes de qualquer lista.
- responsabilidades: 5 a 7 linhas. Cada uma começa por um verbo e diz uma coisa que a pessoa faz à segunda-feira. Nada de "colaborar com a equipa".
- requisitos: 4 a 6 linhas. O que é mesmo indispensável, incluindo anos de experiência quando a senioridade o justificar. Se algo é desejável, não é requisito.
- qualificações desejadas: 3 a 5 linhas. O que faz a diferença mas não exclui ninguém.
- benefícios: 3 a 5 linhas. Só o que uma agência portuguesa desta dimensão dá de facto — formação, horário, seguro, equipamento, dias de férias, trabalho híbrido. Sem números inventados.
- fecho: um ou dois períodos a dizer como se avança. Sem "envia o teu CV para": o site já tem formulário.

Cada linha das listas é uma frase só, sem ponto final e sem marcadores — a página põe os pontos.

Respondes só com JSON, sem texto à volta e sem blocos de código, nesta forma exacta:
{
  "intro": { "pt": "", "en": "" },
  "responsibilities": [{ "pt": "", "en": "" }],
  "requirements": [{ "pt": "", "en": "" }],
  "niceToHave": [{ "pt": "", "en": "" }],
  "benefits": [{ "pt": "", "en": "" }],
  "closing": { "pt": "", "en": "" }
}`;

/** O que impede o pedido de sair: sessão de recrutamento e chave no ambiente. */
function porta(req: Parameters<PayloadHandler>[0]) {
  if (!req.user) return { erro: Response.json({ error: "Só para quem tem sessão no painel." }, { status: 401 }) };
  const perfis = (req.user as { roles?: string[] | null }).roles ?? [];
  const podeRecrutar = !perfis.length || perfis.includes("admin") || perfis.includes("recrutamento");
  if (!podeRecrutar) return { erro: Response.json({ error: "Esta proposta é para quem trata de recrutamento." }, { status: 403 }) };
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return { erro: Response.json({ error: "Falta a ANTHROPIC_API_KEY neste ambiente." }, { status: 501 }) };
  return { key };
}

const texto = (valor: unknown) => (typeof valor === "string" ? valor.trim().slice(0, 200) : "");

/** Os rótulos que o painel guarda em código, escritos por extenso para o modelo. */
const POR_EXTENSO: Record<string, string> = {
  junior: "júnior",
  intermedio: "intermédio",
  senior: "sénior",
  contrato: "contrato de trabalho",
  estagio: "estágio",
  freelancer: "freelancer",
  presencial: "presencial",
  hibrido: "híbrido",
  remoto: "remoto",
};

/**
 * O JSON do modelo, sem confiar que ele obedeceu.
 *
 * Um par de línguas só serve se o português estiver lá; sem ele a linha cai,
 * porque uma vaga com metade das linhas em branco dá mais trabalho a limpar do
 * que a escrever de novo.
 */
type Par = { pt: string; en: string };

function par(valor: unknown): Par | undefined {
  const doc = (valor ?? {}) as Record<string, unknown>;
  const pt = typeof doc.pt === "string" ? doc.pt.trim() : "";
  if (!pt) return undefined;
  const en = typeof doc.en === "string" ? doc.en.trim() : "";
  return { pt, en: en || pt };
}

const lista = (valor: unknown, quantos: number): Par[] =>
  (Array.isArray(valor) ? valor : [])
    .map(par)
    .filter((item): item is Par => Boolean(item))
    .slice(0, quantos);

/**
 * Propõe o texto de uma vaga.
 *
 * POST /api/jobs/propor
 * { titulo, funcaoId, senioridade, vinculo, regime, local }
 */
export const draftJob: PayloadHandler = async (req) => {
  const { key, erro } = porta(req);
  if (erro) return erro;

  const pedido = (await req.json?.()) as Record<string, unknown> | undefined;
  const titulo = texto(pedido?.titulo);

  /*
   * A função e o departamento vêm da tabela, e não do browser: o painel só
   * sabe o id que está no campo, e mandar um nome que o painel adivinhou era
   * dar ao modelo uma coisa que a base de dados podia desmentir.
   */
  let funcao = "";
  let departamento = "";
  const funcaoId = pedido?.funcaoId;
  if (typeof funcaoId === "string" || typeof funcaoId === "number") {
    try {
      const doc = (await req.payload.findByID({
        collection: "job-functions",
        id: funcaoId,
        depth: 1,
        overrideAccess: false,
        user: req.user,
      })) as { namePt?: string | null; department?: { namePt?: string | null } | number | null };
      funcao = texto(doc?.namePt);
      const area = doc?.department;
      departamento = area && typeof area === "object" ? texto(area.namePt) : "";
    } catch {
      // Uma função apagada entre o formulário e o pedido não impede a proposta:
      // o título sozinho chega para escrever uma vaga.
    }
  }

  if (!titulo && !funcao) {
    return Response.json({ error: "Escreve o título da vaga ou escolhe a função primeiro." }, { status: 422 });
  }

  const legenda = (campo: string, valor: string) => (valor ? `${campo}: ${POR_EXTENSO[valor] ?? valor}` : "");
  const ficha = [
    legenda("Título", titulo),
    legenda("Função", funcao),
    legenda("Departamento", departamento),
    legenda("Senioridade", texto(pedido?.senioridade)),
    legenda("Vínculo", texto(pedido?.vinculo)),
    legenda("Regime", texto(pedido?.regime)),
    legenda("Local", texto(pedido?.local)),
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const claude = new Anthropic({ apiKey: key });
    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 4096,
      system: REGRAS,
      messages: [{ role: "user", content: ficha }],
    });

    const bruto = response.content
      .filter((bloco) => bloco.type === "text")
      .map((bloco) => bloco.text)
      .join("")
      .trim()
      // Às vezes vem em bloco de código apesar das regras. Tirar três crases é
      // mais barato do que uma segunda ida ao modelo.
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(bruto) as Record<string, unknown>;
    } catch {
      req.payload.logger.error(`propor vaga: resposta não era JSON — ${bruto.slice(0, 200)}`);
      return Response.json({ error: "A resposta não veio em JSON. Tenta outra vez." }, { status: 502 });
    }

    const proposta = {
      intro: par(doc.intro),
      responsibilities: lista(doc.responsibilities, 8),
      requirements: lista(doc.requirements, 8),
      niceToHave: lista(doc.niceToHave, 6),
      benefits: lista(doc.benefits, 6),
      closing: par(doc.closing),
    };

    if (!proposta.responsibilities.length && !proposta.requirements.length) {
      return Response.json({ error: "A proposta veio vazia. Tenta outra vez." }, { status: 502 });
    }

    return Response.json({ proposta, model: response.model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "erro desconhecido";
    req.payload.logger.error(`propor vaga: ${message}`);
    return Response.json({ error: message }, { status: 502 });
  }
};
