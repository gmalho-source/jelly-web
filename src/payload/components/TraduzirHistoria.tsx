"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão que passa um caso inteiro a inglês.
 *
 * Começou por traduzir só a história, e o resto da página ficava em português
 * no site inglês até alguém se lembrar de cada campo: o título, o resumo, a
 * equipa, a linha de apoio por cima do título, as disciplinas, as legendas dos
 * números, a citação e o cargo de quem a disse. Agora junta tudo o que tem
 * português e ainda não tem inglês, manda numa só ida ao modelo, e escreve o
 * resultado nos campos ingleses.
 *
 * Não grava, e não escreve por cima. Um caso é a peça comercial da casa: o que
 * sai daqui fica no formulário à espera de ser lido, e um texto inglês que
 * alguém já escreveu à mão ganha sempre ao que o modelo escreveria.
 *
 * Anda pelos campos do formulário e não pelo documento gravado, porque é isso
 * que permite traduzir um caso acabado de escrever, ainda por gravar — que é
 * precisamente quando alguém quer isto.
 */

/** Os blocos da história: o português, e onde o inglês vai ficar. */
const PARES = [
  { pt: "heading", en: "headingEn" },
  { pt: "body", en: "bodyEn" },
  { pt: "label", en: "labelEn" },
];

/** Campos soltos do caso, fora da história, com o par inglês noutro nome. */
const SOLTOS = [{ pt: "subtitle", en: "subtitleEn" }];

type Campos = Record<string, { value?: unknown } | undefined>;

/** Um texto a traduzir e o sítio onde o inglês fica. */
type Item = { destino: string; texto: string; indice?: number };

const valor = (campos: Campos, caminho: string) => campos[caminho]?.value;
const textoDe = (campos: Campos, caminho: string) => String(valor(campos, caminho) ?? "").trim();

/**
 * O que há para traduzir: cada campo português com texto cujo par inglês
 * exista e esteja vazio.
 */
function porTraduzirEm(campos: Campos): Item[] {
  const itens: Item[] = [];

  for (const caminho of Object.keys(campos)) {
    let destino: string | null = null;

    // Os grupos com português e inglês lado a lado — título, resumo, equipa,
    // legendas dos números, citação, cargo — guardam-se como `x.pt` e `x.en`.
    if (caminho === "pt" || caminho.endsWith(".pt")) {
      destino = `${caminho.slice(0, -2)}en`;
    } else {
      const par = PARES.find(({ pt }) => caminho.endsWith(`.${pt}`)) ?? SOLTOS.find(({ pt }) => caminho === pt);
      if (par) destino = `${caminho.slice(0, -par.pt.length)}${par.en}`;
    }

    // O par inglês tem de existir no formulário: um caminho que não existe
    // seria um campo inventado.
    if (!destino || !(destino in campos)) continue;
    const texto = textoDe(campos, caminho);
    if (!texto || textoDe(campos, destino)) continue;
    itens.push({ destino, texto });
  }

  // As disciplinas são uma lista: cada uma vai como um texto, e voltam a
  // juntar-se pela mesma ordem.
  const disciplinas = valor(campos, "disciplines");
  const disciplinasEn = valor(campos, "disciplinesEn");
  if (Array.isArray(disciplinas) && "disciplinesEn" in campos && !(Array.isArray(disciplinasEn) && disciplinasEn.length)) {
    disciplinas
      .map((disciplina) => String(disciplina ?? "").trim())
      .filter(Boolean)
      .forEach((texto, indice) => itens.push({ destino: "disciplinesEn", texto, indice }));
  }

  return itens;
}

export function TraduzirHistoria() {
  const [campos] = useAllFormFields();
  const { dispatchFields } = useForm();
  const [busy, setBusy] = useState(false);

  const porTraduzir = porTraduzirEm((campos ?? {}) as Campos);

  const traduzir = async () => {
    if (!porTraduzir.length) return;
    setBusy(true);
    try {
      const response = await fetch("/api/projects/traduzir-historia", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          textos: porTraduzir.map((item) => item.texto),
          cliente: String((campos?.client as { value?: unknown })?.value ?? ""),
        }),
      });
      const corpo = await leResposta<{ traducoes?: string[]; error?: string }>(response);
      if (!response.ok || !corpo.traducoes) throw new Error(corpo?.error ?? `erro ${response.status}`);

      const listas = new Map<string, string[]>();
      porTraduzir.forEach((item, posicao) => {
        const traducao = corpo.traducoes![posicao] ?? "";
        if (item.indice === undefined) {
          dispatchFields({ type: "UPDATE", path: item.destino, value: traducao });
          return;
        }
        const lista = listas.get(item.destino) ?? [];
        lista[item.indice] = traducao.trim();
        listas.set(item.destino, lista);
      });
      for (const [destino, lista] of listas) {
        dispatchFields({ type: "UPDATE", path: destino, value: lista.filter(Boolean) });
      }
      toast.success(`${porTraduzir.length} ${porTraduzir.length === 1 ? "texto traduzido" : "textos traduzidos"}. Lê antes de gravar.`);
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
        disabled={busy || !porTraduzir.length}
        onClick={traduzir}
      >
        <span className="btn__content">
          <span className="btn__label">{busy ? "A traduzir o caso…" : "Traduzir o caso para inglês"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        {porTraduzir.length
          ? `${porTraduzir.length} ${porTraduzir.length === 1 ? "texto por traduzir" : "textos por traduzir"}. Não escreve por cima do inglês que já lá esteja.`
          : "Não há nada por traduzir: ou não há texto português, ou o inglês já está escrito."}{" "}
        Traduz a página toda: título, resumo, equipa, linha de apoio, disciplinas, números, citação e história.
      </span>
    </div>
  );
}

export default TraduzirHistoria;
