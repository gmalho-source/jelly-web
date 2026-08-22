import type { CollectionBeforeChangeHook } from "payload";

/** Pesos por omissão, quando o departamento não os define. */
const PADRAO = { empathy: 15, attitude: 20, listening: 15, experience: 20, communication: 15, fit: 15 };

type Dimensao = keyof typeof PADRAO;
const DIMENSOES = Object.keys(PADRAO) as Dimensao[];

type Ficha = Partial<Record<Dimensao, string | number | null>>;

/**
 * A nota de uma ficha: média das dimensões pontuadas, pesada pelo departamento.
 *
 * As dimensões em branco ficam de fora do cálculo em vez de contarem zero — uma
 * entrevista onde não se falou de uma coisa não é uma entrevista onde essa coisa
 * correu mal.
 */
function notaDaFicha(ficha: Ficha, pesos: typeof PADRAO) {
  let soma = 0;
  let total = 0;
  for (const dimensao of DIMENSOES) {
    const valor = Number(ficha[dimensao]);
    if (!Number.isFinite(valor) || valor <= 0) continue;
    const peso = Number(pesos[dimensao]);
    const usado = Number.isFinite(peso) && peso > 0 ? peso : 0;
    soma += valor * usado;
    total += usado;
  }
  return total ? soma / total : null;
}

const arredonda = (valor: number) => Math.round(valor * 10) / 10;

/**
 * Escreve a nota final e a distância entre fichas.
 *
 * A distância é tão importante como a média: duas fichas em 4,8 e 2,1 dão a
 * mesma média que duas em 3,4, e não querem dizer a mesma coisa. Uma média
 * calcula-se; uma discordância conversa-se.
 */
export const scoreApplication: CollectionBeforeChangeHook = async ({ data, req }) => {
  const fichas = (data.evaluations ?? []) as Ficha[];
  if (!Array.isArray(fichas) || !fichas.length) return { ...data, rating: null, spread: null };

  const referencia = data.department ?? data.function;
  let pesos = PADRAO;

  if (referencia) {
    const id = typeof referencia === "object" ? (referencia as { id?: string | number }).id : referencia;
    try {
      // Pela função chega-se ao departamento: a vaga escolhe a função, e é o
      // departamento que diz o que conta mais.
      const departamento = data.department
        ? await req.payload.findByID({ collection: "departments", id: String(id), depth: 0 })
        : ((await req.payload.findByID({ collection: "job-functions", id: String(id), depth: 1 })) as { department?: { weights?: typeof PADRAO } })
            .department;
      const encontrados = (departamento as { weights?: typeof PADRAO } | undefined)?.weights;
      if (encontrados) pesos = { ...PADRAO, ...encontrados };
    } catch {
      // Sem departamento legível, valem os pesos por omissão: mais vale uma
      // nota com os pesos gerais do que nota nenhuma.
    }
  }

  const notas = fichas.map((ficha) => notaDaFicha(ficha, pesos)).filter((nota): nota is number => nota !== null);
  if (!notas.length) return { ...data, rating: null, spread: null };

  const media = notas.reduce((soma, nota) => soma + nota, 0) / notas.length;
  return {
    ...data,
    rating: arredonda(media),
    spread: notas.length > 1 ? arredonda(Math.max(...notas) - Math.min(...notas)) : 0,
  };
};

/**
 * Data a partir da qual a candidatura é apagada.
 *
 * Doze meses, contados de quando chegou. Uma candidatura guardada para sempre
 * é uma candidatura que ninguém pediu para guardar.
 */
export const setRetention: CollectionBeforeChangeHook = ({ data, operation }) => {
  if (operation !== "create" || data.retentionUntil) return data;
  const doze = new Date();
  doze.setMonth(doze.getMonth() + 12);
  return { ...data, retentionUntil: doze.toISOString(), consentAt: data.consentAt ?? new Date().toISOString() };
};
