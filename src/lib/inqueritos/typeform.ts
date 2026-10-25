import { semMarcas } from "./logica";
import type { Dados, Pergunta, Valor } from "./tipos";

/**
 * O Typeform, para trazer de lá os dois inquéritos que já existiam: as
 * perguntas, uma vez, e as respostas, as vezes que for preciso.
 *
 * As perguntas ficam com a referência do Typeform como chave. É isso que
 * deixa as respostas encontrarem a pergunta certa, e que deixa importar outra
 * vez sem duplicar: cada resposta leva o token que o Typeform lhe deu.
 *
 * Duas mudanças decididas ao trazer as perguntas: as escalas passam a ir até
 * 10 (eram de 0 a 9 na clareza e na proposta), e a regra do Typeform que
 * saltava para o fim quando não havia testemunho passa a ser uma condição nas
 * perguntas seguintes. As respostas antigas guardam a escala em que foram
 * dadas, e os resultados mostram-nas à parte.
 */

const API = "https://api.typeform.com";

type Escolha = { id?: string; ref?: string; label?: string; attachment?: { type?: string; href?: string } };
export type CampoTF = {
  id: string;
  ref?: string;
  title?: string;
  type: string;
  validations?: { required?: boolean };
  properties?: {
    description?: string;
    choices?: Escolha[];
    allow_multiple_selection?: boolean;
    allow_other_choice?: boolean;
    steps?: number;
    start_at_one?: boolean;
    labels?: { left?: string; center?: string; right?: string };
    fields?: CampoTF[];
  };
};
export type DefinicaoTF = {
  id: string;
  title?: string;
  fields?: CampoTF[];
  logic?: {
    type?: string;
    ref?: string;
    actions?: { action?: string; details?: { to?: { type?: string } }; condition?: { op?: string; vars?: { type?: string; value?: unknown }[] } }[];
  }[];
  welcome_screens?: { title?: string; properties?: { description?: string } }[];
  thankyou_screens?: { ref?: string; title?: string; properties?: { description?: string } }[];
};

type RespostaTF = {
  token?: string;
  response_id?: string;
  landed_at?: string;
  submitted_at?: string;
  answers?: {
    field?: { id?: string; ref?: string; type?: string };
    type?: string;
    choice?: { id?: string; ref?: string; label?: string; other?: string };
    choices?: { ids?: string[]; refs?: string[]; labels?: string[]; other?: string };
    number?: number;
    boolean?: boolean;
    text?: string;
    email?: string;
    phone_number?: string;
    url?: string;
    date?: string;
  }[];
};

async function pede<T>(token: string, caminho: string): Promise<T> {
  const resposta = await fetch(`${API}${caminho}`, { headers: { authorization: `Bearer ${token}`, accept: "application/json" } });
  if (!resposta.ok) {
    const texto = await resposta.text().catch(() => "");
    // O corpo do Typeform diz o que falhou («FORM_NOT_FOUND», «AUTHENTICATION_FAILED»), sem nada de secreto.
    throw new Error(`O Typeform respondeu ${resposta.status}: ${texto.slice(0, 200)}`);
  }
  return (await resposta.json()) as T;
}

export const definicao = (token: string, formId: string) => pede<DefinicaoTF>(token, `/forms/${encodeURIComponent(formId)}`);

/** Todas as respostas completas, das mais recentes para as mais antigas. */
export async function respostas(token: string, formId: string): Promise<RespostaTF[]> {
  const todas: RespostaTF[] = [];
  let antes = "";
  for (let volta = 0; volta < 200; volta += 1) {
    const parametros = new URLSearchParams({ page_size: "1000", completed: "true" });
    if (antes) parametros.set("before", antes);
    const pagina = await pede<{ items?: RespostaTF[] }>(token, `/forms/${encodeURIComponent(formId)}/responses?${parametros}`);
    const itens = pagina.items ?? [];
    todas.push(...itens);
    if (itens.length < 1000) break;
    antes = itens.at(-1)?.token ?? "";
    if (!antes) break;
  }
  return todas;
}

const limpo = (texto: string | undefined) => semMarcas(String(texto ?? "")).replace(/\s+/g, " ").trim();
const normal = (texto: string | undefined) => limpo(texto).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
const refDe = (campo: { ref?: string; id?: string }) => campo.ref || campo.id || "";

/** A pergunta do painel, como o Payload a grava. */
export type PerguntaNova = Omit<Pergunta, "opcoes" | "linhas"> & {
  opcoes?: { chave: string; rotulo: string; imagemUrl?: string }[];
  linhas?: { chave: string; rotulo: string }[];
};

export type Traducao = {
  titulo: string;
  abertura: { titulo: string; texto: string } | null;
  fecho: { titulo: string; texto: string } | null;
  perguntas: PerguntaNova[];
  notas: string[];
};

/** O formulário do Typeform, passado a perguntas do painel. */
export function traduz(def: DefinicaoTF): Traducao {
  const notas: string[] = [];
  const perguntas: PerguntaNova[] = [];

  for (const campo of def.fields ?? []) {
    const p = campo.properties ?? {};
    const base = {
      chave: refDe(campo),
      titulo: limpo(campo.title),
      descricao: limpo(p.description) || null,
      obrigatoria: Boolean(campo.validations?.required),
    };
    switch (campo.type) {
      case "multiple_choice":
      case "picture_choice":
      case "dropdown": {
        const varias = Boolean(p.allow_multiple_selection);
        // «Indique até 3 fatores»: o Typeform não o fazia cumprir; aqui passa a cumprir.
        const ate = varias ? /at[ée]\s+(\d+)/i.exec(base.titulo)?.[1] : undefined;
        perguntas.push({
          ...base,
          tipo: "escolha",
          varias,
          maximo: ate ? Number(ate) : null,
          outra: Boolean(p.allow_other_choice),
          opcoes: (p.choices ?? []).map((escolha) => ({
            chave: refDe(escolha),
            rotulo: limpo(escolha.label),
            ...(campo.type === "picture_choice" && escolha.attachment?.href ? { imagemUrl: escolha.attachment.href } : {}),
          })),
        });
        break;
      }
      case "opinion_scale":
      case "rating": {
        const min = p.start_at_one ? 1 : 0;
        const original = min + (p.steps ?? 11) - 1;
        if (original !== 10) notas.push(`«${base.titulo}»: a escala era de ${min} a ${original} e passou a ir até 10.`);
        perguntas.push({
          ...base,
          tipo: "escala",
          escalaMin: min,
          escalaMax: 10,
          rotuloMin: limpo(p.labels?.left) || null,
          rotuloMeio: limpo(p.labels?.center) || null,
          rotuloMax: limpo(p.labels?.right) || null,
        });
        break;
      }
      case "nps":
        perguntas.push({
          ...base,
          tipo: "nps",
          rotuloMin: limpo(p.labels?.left) || "Nada provável",
          rotuloMax: limpo(p.labels?.right) || "Muito provável",
        });
        break;
      case "yes_no":
      case "legal":
        perguntas.push({ ...base, tipo: "sim-nao" });
        break;
      case "short_text":
      case "email":
      case "number":
      case "phone_number":
      case "website":
        perguntas.push({ ...base, tipo: "texto-curto", preencher: /empresa|company/i.test(base.titulo) ? "empresa" : null });
        break;
      case "long_text":
        // «Nome da Empresa que recebeu a proposta» estava como texto longo:
        // é um nome, e num link pessoal já se sabe.
        perguntas.push(
          /empresa|company/i.test(base.titulo) && /nome|name/i.test(base.titulo)
            ? { ...base, tipo: "texto-curto", preencher: "empresa" }
            : { ...base, tipo: "texto-longo" },
        );
        break;
      case "matrix": {
        const linhas = p.fields ?? [];
        const colunas = linhas[0]?.properties?.choices ?? [];
        perguntas.push({
          ...base,
          tipo: "grelha",
          obrigatoria: linhas.some((linha) => linha.validations?.required),
          opcoes: colunas.map((coluna) => ({ chave: refDe(coluna), rotulo: limpo(coluna.label) })),
          linhas: linhas.map((linha) => ({ chave: refDe(linha), rotulo: limpo(linha.title) })),
        });
        break;
      }
      case "group":
      case "inline_group": {
        const dentro = p.fields ?? [];
        const curtos = dentro.filter((sub) => ["short_text", "email", "phone_number", "website", "number"].includes(sub.type));
        if (curtos.length !== dentro.length) notas.push(`«${base.titulo}»: só os campos de texto curto do grupo foram trazidos.`);
        perguntas.push({
          ...base,
          tipo: "campos",
          obrigatoria: curtos.some((sub) => sub.validations?.required),
          linhas: curtos.map((sub) => ({ chave: refDe(sub), rotulo: limpo(sub.title).replace(/\?$/, "") })),
        });
        break;
      }
      case "statement":
        break;
      default:
        notas.push(`«${base.titulo}» (${campo.type}) não tem equivalente e ficou de fora.`);
    }
  }

  // A regra que salta para o fim quando uma pergunta de sim ou não tem uma
  // certa resposta: passa a condição em cada pergunta que vinha a seguir.
  for (const regra of def.logic ?? []) {
    for (const acao of regra.actions ?? []) {
      const variaveis = acao.condition?.vars ?? [];
      const campo = variaveis.find((variavel) => variavel.type === "field")?.value;
      const constante = variaveis.find((variavel) => variavel.type === "constant")?.value;
      const indice = perguntas.findIndex((pergunta) => pergunta.chave === campo);
      const vaiParaOFim = acao.action === "jump" && acao.details?.to?.type === "thankyou";
      if (vaiParaOFim && indice >= 0 && perguntas[indice].tipo === "sim-nao" && typeof constante === "boolean" && ["is", "equal"].includes(acao.condition?.op ?? "")) {
        for (const seguinte of perguntas.slice(indice + 1)) {
          if (!seguinte.mostrarSe) {
            seguinte.mostrarSe = perguntas[indice].chave;
            seguinte.mostrarValor = constante ? "nao" : "sim";
          }
        }
        notas.push(`As perguntas depois de «${perguntas[indice].titulo}» só aparecem a quem responder ${constante ? "Não" : "Sim"}.`);
      } else {
        notas.push("Uma regra de lógica do Typeform não tem equivalente e ficou de fora: confira a ordem das perguntas.");
      }
    }
  }

  const boasVindas = def.welcome_screens?.[0];
  // O segundo ecrã final do Typeform é o anúncio deles («crie o seu typeform»).
  const fim = def.thankyou_screens?.find((ecra) => ecra.ref !== "default_tys");
  // No Typeform o título de um ecrã leva às vezes o texto na linha de baixo:
  // a primeira linha é o título, o resto é o texto.
  const ecra = (titulo?: string, descricao?: string) => {
    const [primeira = "", ...resto] = String(titulo ?? "").split(/\n+/);
    return { titulo: limpo(primeira), texto: limpo(descricao) || limpo(resto.join(" ")) };
  };
  return {
    titulo: limpo(def.title),
    abertura: boasVindas ? ecra(boasVindas.title, boasVindas.properties?.description) : null,
    fecho: fim ? ecra(fim.title, fim.properties?.description) : null,
    perguntas,
    notas,
  };
}

/** Os limites de cada escala tal como estavam no Typeform, pela referência. */
export function escalasOriginais(def: DefinicaoTF): Record<string, [number, number]> {
  const escalas: Record<string, [number, number]> = {};
  for (const campo of def.fields ?? []) {
    const p = campo.properties ?? {};
    if (campo.type === "nps") escalas[refDe(campo)] = [0, 10];
    if (campo.type === "opinion_scale" || campo.type === "rating") {
      const min = p.start_at_one ? 1 : 0;
      escalas[refDe(campo)] = [min, min + (p.steps ?? 11) - 1];
    }
  }
  return escalas;
}

/** A opção que corresponde a uma escolha do Typeform: pela referência, ou pelo texto. */
function opcaoDe(pergunta: Pergunta, ref: string | undefined, rotulo: string | undefined): string | undefined {
  const opcoes = pergunta.opcoes ?? [];
  return (ref && opcoes.find((opcao) => opcao.chave === ref)?.chave) || opcoes.find((opcao) => normal(opcao.rotulo) === normal(rotulo))?.chave;
}

/**
 * Uma resposta do Typeform, passada aos valores do painel.
 *
 * Cada linha de uma grelha e cada campo de um grupo vêm do Typeform como uma
 * resposta à parte, com a referência da linha: encontram a pergunta pela
 * linha que tem essa chave.
 */
export function valores(item: RespostaTF, perguntas: Pergunta[], escalas: Record<string, [number, number]>): Dados {
  const porChave = new Map(perguntas.map((pergunta) => [pergunta.chave, pergunta]));
  const porLinha = new Map<string, Pergunta>();
  for (const pergunta of perguntas) for (const linha of pergunta.linhas ?? []) porLinha.set(linha.chave, pergunta);

  const saida: Record<string, Valor> = {};
  const usadas: Record<string, [number, number]> = {};

  for (const resposta of item.answers ?? []) {
    const ref = resposta.field?.ref || resposta.field?.id || "";
    const pergunta = porChave.get(ref);
    const texto = resposta.text ?? resposta.email ?? resposta.phone_number ?? resposta.url ?? resposta.date ?? (resposta.number !== undefined ? String(resposta.number) : undefined);

    if (pergunta) {
      switch (pergunta.tipo) {
        case "escolha": {
          const refs = resposta.choice ? [resposta.choice.ref] : (resposta.choices?.refs ?? []);
          const rotulos = resposta.choice ? [resposta.choice.label] : (resposta.choices?.labels ?? []);
          const escolhidas = refs.length
            ? refs.map((r, i) => opcaoDe(pergunta, r, rotulos[i]))
            : rotulos.map((r) => opcaoDe(pergunta, undefined, r));
          const outra = resposta.choice?.other ?? resposta.choices?.other;
          saida[pergunta.chave] = { opcoes: escolhidas.filter((chave): chave is string => Boolean(chave)), ...(outra ? { outra } : {}) };
          break;
        }
        case "escala":
        case "nps":
          if (typeof resposta.number === "number") {
            saida[pergunta.chave] = resposta.number;
            usadas[pergunta.chave] = escalas[pergunta.chave] ?? [0, 10];
          }
          break;
        case "sim-nao":
          if (typeof resposta.boolean === "boolean") saida[pergunta.chave] = resposta.boolean;
          break;
        default:
          if (texto) saida[pergunta.chave] = texto;
      }
      continue;
    }

    const dona = porLinha.get(ref);
    if (dona) {
      const atual = (saida[dona.chave] ?? {}) as Record<string, string>;
      if (dona.tipo === "grelha") {
        const opcao = opcaoDe(dona, resposta.choice?.ref, resposta.choice?.label);
        if (opcao) atual[ref] = opcao;
      } else if (texto) {
        atual[ref] = texto;
      }
      if (Object.keys(atual).length) saida[dona.chave] = atual;
    }
  }

  const rotulos: Record<string, string> = {};
  for (const pergunta of perguntas) {
    if (saida[pergunta.chave] === undefined) continue;
    rotulos[pergunta.chave] = pergunta.titulo;
    for (const opcao of pergunta.opcoes ?? []) rotulos[opcao.chave] = opcao.rotulo;
    for (const linha of pergunta.linhas ?? []) rotulos[linha.chave] = linha.rotulo;
  }
  return { valores: saida, escalas: usadas, rotulos };
}
