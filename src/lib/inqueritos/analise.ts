import { emTexto, limites, rotulo } from "./logica";
import type { DocDaResposta } from "./forma";
import type { Pergunta } from "./tipos";

/**
 * As contas dos resultados de um inquérito, pergunta a pergunta.
 *
 * Tudo se conta sobre as respostas que entram nos filtros. Uma escala que mudou
 * de limites (a clareza e a proposta, de 0 a 9 para 0 a 10) dá duas contas
 * separadas: a média de uma escala de 0 a 9 e a de uma de 0 a 10 não se somam.
 */

export type Contagem = { chave: string; rotulo: string; n: number };

export type Texto = { texto: string; quem: string; data: string | null; id: number | string };

export type Escala = { min: number; max: number; n: number; media: number; distribuicao: number[] };

export type Nps = { valor: number; promotores: number; neutros: number; detratores: number; n: number };

export type Resultado =
  | { tipo: "escolha"; pergunta: Pergunta; n: number; contagens: Contagem[]; outras: Texto[] }
  | { tipo: "escala"; pergunta: Pergunta; n: number; atual: Escala | null; antigas: Escala[]; nps: Nps | null }
  | { tipo: "grelha"; pergunta: Pergunta; n: number; opcoes: { chave: string; rotulo: string }[]; linhas: { chave: string; rotulo: string; n: number; contagens: Contagem[] }[] }
  | { tipo: "texto"; pergunta: Pergunta; n: number; textos: Texto[] };

const quemDe = (resposta: DocDaResposta) => [resposta.empresa, resposta.nome].filter(Boolean).join(" · ");
const dataDe = (resposta: DocDaResposta) => resposta.concluidaEm ?? resposta.iniciadaEm ?? resposta.createdAt ?? null;

/** O NPS de uma lista de notas de 0 a 10: promotores (9–10) menos detratores (0–6), em pontos. */
export function nps(notas: number[]): Nps | null {
  if (!notas.length) return null;
  const promotores = notas.filter((nota) => nota >= 9).length;
  const detratores = notas.filter((nota) => nota <= 6).length;
  const neutros = notas.length - promotores - detratores;
  return { valor: Math.round(((promotores - detratores) / notas.length) * 100), promotores, neutros, detratores, n: notas.length };
}

function escala(notas: number[], min: number, max: number): Escala {
  const distribuicao = Array.from({ length: max - min + 1 }, () => 0);
  for (const nota of notas) if (nota >= min && nota <= max) distribuicao[nota - min] += 1;
  return { min, max, n: notas.length, media: notas.reduce((soma, nota) => soma + nota, 0) / notas.length, distribuicao };
}

export function resultados(perguntas: Pergunta[], respostas: DocDaResposta[]): Resultado[] {
  return perguntas.map((pergunta): Resultado => {
    const comValor = respostas.filter((resposta) => resposta.dados?.valores?.[pergunta.chave] !== undefined);
    const n = comValor.length;

    switch (pergunta.tipo) {
      case "escolha":
      case "sim-nao": {
        const contagens: Contagem[] =
          pergunta.tipo === "sim-nao"
            ? [
                { chave: "sim", rotulo: "Sim", n: comValor.filter((r) => r.dados?.valores[pergunta.chave] === true).length },
                { chave: "nao", rotulo: "Não", n: comValor.filter((r) => r.dados?.valores[pergunta.chave] === false).length },
              ]
            : (pergunta.opcoes ?? []).map((opcao) => ({
                chave: opcao.chave,
                rotulo: opcao.rotulo,
                n: comValor.filter((r) => ((r.dados?.valores[pergunta.chave] as { opcoes?: string[] })?.opcoes ?? []).includes(opcao.chave)).length,
              }));
        // Opções que já não existem no inquérito mas estão nas respostas (apagadas depois).
        if (pergunta.tipo === "escolha") {
          const conhecidas = new Set(contagens.map((c) => c.chave));
          const orfas = new Map<string, Contagem>();
          for (const resposta of comValor) {
            for (const chave of (resposta.dados?.valores[pergunta.chave] as { opcoes?: string[] })?.opcoes ?? []) {
              if (conhecidas.has(chave)) continue;
              const atual = orfas.get(chave) ?? { chave, rotulo: rotulo(chave, pergunta, resposta.dados?.rotulos), n: 0 };
              atual.n += 1;
              orfas.set(chave, atual);
            }
          }
          contagens.push(...orfas.values());
        }
        const outras = comValor
          .map((resposta) => ({ resposta, texto: (resposta.dados?.valores[pergunta.chave] as { outra?: string })?.outra?.trim() ?? "" }))
          .filter(({ texto }) => texto)
          .map(({ resposta, texto }) => ({ texto, quem: quemDe(resposta), data: dataDe(resposta), id: resposta.id }));
        if (outras.length) contagens.push({ chave: "__outra", rotulo: "Outra", n: outras.length });
        // Numa escolha múltipla, a ordem é a do que mais pesou; numa única, a do inquérito.
        if (pergunta.varias) contagens.sort((a, b) => b.n - a.n);
        return { tipo: "escolha", pergunta, n, contagens, outras };
      }

      case "escala":
      case "nps": {
        const [min, max] = limites(pergunta);
        const porEscala = new Map<string, number[]>();
        for (const resposta of comValor) {
          const nota = resposta.dados?.valores[pergunta.chave];
          if (typeof nota !== "number") continue;
          const [a, b] = resposta.dados?.escalas?.[pergunta.chave] ?? [min, max];
          const chave = `${a}-${b}`;
          porEscala.set(chave, [...(porEscala.get(chave) ?? []), nota]);
        }
        const atuais = porEscala.get(`${min}-${max}`) ?? [];
        const antigas = [...porEscala.entries()]
          .filter(([chave]) => chave !== `${min}-${max}`)
          .map(([chave, notas]) => {
            const [a, b] = chave.split("-").map(Number);
            return escala(notas, a, b);
          });
        const ehNps = pergunta.tipo === "nps" || (min === 0 && max === 10 && /recomend|recommend/i.test(pergunta.titulo));
        return { tipo: "escala", pergunta, n, atual: atuais.length ? escala(atuais, min, max) : null, antigas, nps: ehNps ? nps(atuais) : null };
      }

      case "grelha": {
        const opcoes = pergunta.opcoes ?? [];
        const linhas = (pergunta.linhas ?? []).map((linha) => {
          const escolhas = comValor.map((r) => (r.dados?.valores[pergunta.chave] as Record<string, string> | undefined)?.[linha.chave]).filter(Boolean) as string[];
          return {
            chave: linha.chave,
            rotulo: linha.rotulo,
            n: escolhas.length,
            contagens: opcoes.map((opcao) => ({ chave: opcao.chave, rotulo: opcao.rotulo, n: escolhas.filter((e) => e === opcao.chave).length })),
          };
        });
        return { tipo: "grelha", pergunta, n, opcoes: opcoes.map(({ chave, rotulo: r }) => ({ chave, rotulo: r })), linhas };
      }

      default:
        return {
          tipo: "texto",
          pergunta,
          n,
          textos: comValor
            .map((resposta) => ({ texto: emTexto(pergunta, resposta.dados?.valores[pergunta.chave], resposta.dados ?? undefined), quem: quemDe(resposta), data: dataDe(resposta), id: resposta.id }))
            .filter((texto) => texto.texto.trim()),
        };
    }
  });
}

/** «2026 · T3», para agrupar por trimestre. */
export function trimestre(data: string): string {
  const d = new Date(data);
  return `${d.getUTCFullYear()} · T${Math.floor(d.getUTCMonth() / 3) + 1}`;
}

/** As respostas e o NPS de cada trimestre, do mais antigo para o mais recente. */
export function evolucao(respostas: DocDaResposta[], perguntaNps: Pergunta | undefined) {
  const grupos = new Map<string, DocDaResposta[]>();
  for (const resposta of respostas) {
    const data = dataDe(resposta);
    if (!data) continue;
    const chave = trimestre(data);
    grupos.set(chave, [...(grupos.get(chave) ?? []), resposta]);
  }
  return [...grupos.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([chave, lista]) => ({
      trimestre: chave,
      n: lista.length,
      nps: perguntaNps
        ? nps(lista.map((r) => r.dados?.valores[perguntaNps.chave]).filter((nota): nota is number => typeof nota === "number"))
        : null,
    }));
}
