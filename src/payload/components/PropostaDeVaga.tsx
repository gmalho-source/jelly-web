"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão no topo da vaga: propõe o texto todo a partir de um briefing.
 *
 * Escrever uma vaga do zero é a parte que faz as vagas ficarem por publicar.
 * Quem recruta sabe o que quer da pessoa e passa uma tarde à procura das
 * palavras — e a vaga que sai no fim é quase sempre a anterior, com o título
 * trocado. Isto escreve a abertura, as quatro listas e o fecho, nas duas
 * línguas.
 *
 * O botão não dispara: abre uma caixa para escrever o que se procura. A
 * primeira versão ia directa ao modelo com as etiquetas do formulário —
 * senioridade, vínculo, regime — e o que saía era a vaga média daquele título,
 * porque era só isso que ele tinha. Três linhas de quem recruta valem mais do
 * que as sete etiquetas juntas: as ferramentas, o que a pessoa vai apanhar
 * pela frente, a equipa onde entra. A caixa pode ficar vazia, e nesse caso é
 * como era antes.
 *
 * Não grava, e não escreve por cima. A regra é a mesma do botão que traduz uma
 * história: uma secção que já tem texto fica como está, e o aviso no fim diz
 * quais foram deixadas quietas. O que o modelo escreve é um rascunho — e a
 * vaga é a primeira coisa que um candidato lê sobre a casa.
 *
 * Anda pelos campos do formulário e não pelo documento gravado, porque é isso
 * que permite propor numa vaga acabada de abrir, ainda por gravar — que é
 * precisamente quando alguém precisa disto.
 */

type Par = { pt: string; en: string };

type Proposta = {
  intro?: Par;
  responsibilities: Par[];
  requirements: Par[];
  niceToHave: Par[];
  benefits: Par[];
  closing?: Par;
};

/**
 * O texto do modelo na forma que o painel guarda.
 *
 * A abertura, o fecho e cada linha das listas são campos com marcação desde
 * que uma vaga passou a poder levar negrito e links. O modelo responde em
 * texto simples — é o que se lhe pede — e é aqui que o texto ganha a árvore
 * que o editor sabe abrir. Uma linha em branco separa parágrafos; numa linha
 * de lista não há nenhuma, e sai um parágrafo só.
 */
function comoOPainelGuarda(texto: string) {
  const paragrafos = texto
    .split(/\n{2,}/)
    .map((pedaco) => pedaco.trim())
    .filter(Boolean);
  return {
    root: {
      type: "root",
      format: "",
      indent: 0,
      version: 1,
      direction: "ltr" as const,
      children: paragrafos.map((paragrafo) => ({
        type: "paragraph",
        format: "",
        indent: 0,
        version: 1,
        direction: "ltr" as const,
        textFormat: 0,
        textStyle: "",
        children: [
          { type: "text", detail: 0, format: 0, mode: "normal", style: "", text: paragrafo, version: 1 },
        ],
      })),
    },
  };
}

/** Se um campo com marcação tem alguma coisa escrita lá dentro. */
function temTexto(valor: unknown): boolean {
  const children = ((valor ?? {}) as { root?: { children?: unknown[] } }).root?.children;
  if (!Array.isArray(children)) return false;
  const palavras = (no: unknown): string => {
    if (!no || typeof no !== "object") return "";
    const doc = no as { text?: unknown; children?: unknown[] };
    if (typeof doc.text === "string") return doc.text;
    return (doc.children ?? []).map(palavras).join("");
  };
  return children.map(palavras).join("").trim().length > 0;
}

/** As quatro listas, pelo nome que têm no formulário e pelo nome que têm à vista. */
const LISTAS = [
  { campo: "responsibilities", nome: "responsabilidades" },
  { campo: "requirements", nome: "requisitos" },
  { campo: "niceToHave", nome: "qualificações desejadas" },
  { campo: "benefits", nome: "benefícios" },
] as const;

export function PropostaDeVaga() {
  const [campos] = useAllFormFields();
  const { addFieldRow, dispatchFields, getDataByPath } = useForm();
  const [busy, setBusy] = useState(false);
  const [aberto, setAberto] = useState(false);
  const [contexto, setContexto] = useState("");

  const valor = (caminho: string) => {
    const bruto = (campos?.[caminho] as { value?: unknown } | undefined)?.value;
    return typeof bruto === "string" || typeof bruto === "number" ? bruto : "";
  };

  const titulo = String(valor("titlePt") || valor("titleEn")).trim();
  const funcaoId = valor("function");
  const podePedir = Boolean(titulo || funcaoId);

  /** Quantas linhas uma lista já tem no formulário. */
  const linhasEm = (campo: string) => {
    const rows = getDataByPath(campo);
    return Array.isArray(rows) ? rows.length : 0;
  };

  const propor = async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/jobs/propor", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titulo,
          funcaoId: funcaoId || undefined,
          senioridade: valor("seniority"),
          vinculo: valor("contract"),
          regime: valor("regime"),
          local: valor("location"),
          contexto: contexto.trim() || undefined,
        }),
      });
      const corpo = await leResposta<{ proposta?: Proposta; error?: string }>(response);
      if (!response.ok || !corpo.proposta) throw new Error(corpo?.error ?? `erro ${response.status}`);
      const proposta = corpo.proposta;

      const escritas: string[] = [];
      const poupadas: string[] = [];

      /* A abertura e o fecho são um campo cada, com as duas línguas lá dentro:
         só se escrevem se ambas estiverem vazias, para não misturar um
         português escrito à mão com um inglês do modelo. */
      for (const [campo, nome, par] of [
        ["intro", "abertura", proposta.intro],
        ["closing", "fecho", proposta.closing],
      ] as const) {
        if (!par) continue;
        const bruto = (caminho: string) => (campos?.[caminho] as { value?: unknown } | undefined)?.value;
        if (temTexto(bruto(`${campo}.pt`)) || temTexto(bruto(`${campo}.en`))) {
          poupadas.push(nome);
          continue;
        }
        dispatchFields({ type: "UPDATE", path: `${campo}.pt`, value: comoOPainelGuarda(par.pt) });
        dispatchFields({ type: "UPDATE", path: `${campo}.en`, value: comoOPainelGuarda(par.en) });
        escritas.push(nome);
      }

      for (const { campo, nome } of LISTAS) {
        const linhas = proposta[campo];
        if (!linhas?.length) continue;
        if (linhasEm(campo)) {
          poupadas.push(nome);
          continue;
        }
        linhas.forEach((linha, indice) => {
          addFieldRow({
            path: campo,
            // Num campo de topo de uma coleção o caminho no esquema é o nome
            // do campo. A versão instalada nem sequer o lê — o `subFieldState`
            // já traz a linha feita — mas o tipo pede-o.
            schemaPath: campo,
            rowIndex: indice,
            subFieldState: {
              "item.pt": { initialValue: comoOPainelGuarda(linha.pt), valid: true, value: comoOPainelGuarda(linha.pt) },
              "item.en": { initialValue: comoOPainelGuarda(linha.en), valid: true, value: comoOPainelGuarda(linha.en) },
            },
          });
        });
        escritas.push(nome);
      }

      if (!escritas.length) {
        toast.info("Já estava tudo escrito. Para propor de novo, esvazia a secção primeiro.");
        return;
      }
      setAberto(false);
      toast.success(
        `Proposta escrita: ${escritas.join(", ")}. Lê antes de gravar.` +
          (poupadas.length ? ` Deixei como estava: ${poupadas.join(", ")}.` : ""),
      );
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  const dica = [
    "Três linhas chegam. O que é que esta pessoa vai fazer, com que ferramentas,",
    "e o que é que corre mal se a contratação não for a certa.",
  ].join(" ");

  return (
    <div style={{ margin: "0 0 1.5rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn--style-secondary btn--size-small"
          disabled={busy || !podePedir}
          onClick={() => (aberto ? setAberto(false) : setAberto(true))}
        >
          <span className="btn__content">
            <span className="btn__label">{aberto ? "Deixa estar" : "Propor o texto com IA"}</span>
          </span>
        </button>
        <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
          {podePedir
            ? "Escreve a abertura, as listas e o fecho nas duas línguas. Não escreve por cima do que já lá estiver."
            : "Escreve o título ou escolhe a função primeiro."}
        </span>
      </div>

      {/* A caixa do briefing. Só abre quando se pede, para uma vaga que já
          está escrita não ter um campo a mais a ocupar o ecrã. */}
      {aberto ? (
        <div
          style={{
            marginTop: "0.9rem",
            padding: "1rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            background: "var(--theme-elevation-50)",
          }}
        >
          <label htmlFor="briefing-da-vaga" style={{ display: "block", fontSize: "0.8rem", fontWeight: 600 }}>
            O que procuras nesta pessoa?
          </label>
          <p style={{ margin: "0.3rem 0 0.6rem", color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
            {dica} Podes deixar vazio — mas o que sair vai ser a vaga média deste título.
          </p>
          <textarea
            id="briefing-da-vaga"
            rows={5}
            value={contexto}
            disabled={busy}
            onChange={(evento) => setContexto(evento.target.value.slice(0, 4000))}
            placeholder={
              "Ex.: entra na equipa de performance, a trabalhar contas de e-commerce com orçamentos de 20 a 80 mil euros/mês. " +
              "Google Ads e Meta todos os dias, GA4 e Looker para reportar. Precisa de saber defender uma decisão à frente do cliente — " +
              "as últimas duas contratações sabiam a ferramenta e não sabiam a conversa."
            }
            style={{
              width: "100%",
              padding: "0.6rem",
              border: "1px solid var(--theme-elevation-150)",
              borderRadius: "4px",
              background: "var(--theme-input-bg)",
              color: "var(--theme-elevation-800)",
              font: "inherit",
              fontSize: "0.85rem",
              lineHeight: 1.5,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn--style-primary btn--size-small" disabled={busy} onClick={propor}>
              <span className="btn__content">
                <span className="btn__label">{busy ? "A escrever a vaga…" : "Escrever a vaga"}</span>
              </span>
            </button>
            <span style={{ color: "var(--theme-elevation-400)", fontSize: "0.7rem" }}>
              {contexto.trim().length ? `${contexto.trim().length} caracteres` : "sem briefing"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default PropostaDeVaga;
