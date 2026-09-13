"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão no topo da vaga: propõe o texto todo a partir do que já lá está.
 *
 * Escrever uma vaga do zero é a parte que faz as vagas ficarem por publicar.
 * Quem recruta sabe o que quer da pessoa e passa uma tarde à procura das
 * palavras — e a vaga que sai no fim é quase sempre a anterior, com o título
 * trocado. Isto escreve a abertura, as quatro listas e o fecho, nas duas
 * línguas, a partir do título, da função, da senioridade e do resto que já
 * está preenchido em cima.
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
        const jaTem = String(valor(`${campo}.pt`) || valor(`${campo}.en`)).trim();
        if (jaTem) {
          poupadas.push(nome);
          continue;
        }
        dispatchFields({ type: "UPDATE", path: `${campo}.pt`, value: par.pt });
        dispatchFields({ type: "UPDATE", path: `${campo}.en`, value: par.en });
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
              "item.pt": { initialValue: linha.pt, valid: true, value: linha.pt },
              "item.en": { initialValue: linha.en, valid: true, value: linha.en },
            },
          });
        });
        escritas.push(nome);
      }

      if (!escritas.length) {
        toast.info("Já estava tudo escrito. Para propor de novo, esvazia a secção primeiro.");
        return;
      }
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 1.5rem", flexWrap: "wrap" }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={busy || !podePedir}
        onClick={propor}
      >
        <span className="btn__content">
          <span className="btn__label">{busy ? "A escrever a vaga…" : "Propor o texto com IA"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        {podePedir
          ? "Escreve a abertura, as listas e o fecho nas duas línguas. Não escreve por cima do que já lá estiver."
          : "Escreve o título ou escolhe a função primeiro."}
      </span>
    </div>
  );
}

export default PropostaDeVaga;
