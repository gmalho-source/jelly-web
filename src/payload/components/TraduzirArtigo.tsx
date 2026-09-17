"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * Botão que passa o artigo a inglês: título, resumo e corpo.
 *
 * Havia o `npm run translate`, que traduz em lote o que estiver por traduzir.
 * Serve para pôr o arquivo inteiro em inglês; não serve para quem acaba de
 * carregar um artigo e o quer em inglês antes de publicar — para isso era
 * preciso abrir um terminal, e quem escreve não abre terminais. É o mesmo
 * modelo e as mesmas regras, à espera de um botão.
 *
 * A árvore do corpo não vai ao modelo. Saem as cadeias de texto pela ordem em
 * que aparecem, voltam as mesmas cadeias noutra língua, e a árvore inglesa é a
 * portuguesa com o texto trocado. A estrutura, os links, as imagens e as marcas
 * de negrito sobrevivem por construção, e não por o modelo as ter copiado bem.
 *
 * Vai em pedaços porque a função tem sessenta segundos e um artigo de dez
 * minutos de leitura não cabe lá. Os pedidos são um de cada vez e por ordem: o
 * modelo vê o artigo pela ordem em que foi escrito, e quem espera vê em que
 * pedaço vai.
 *
 * Não grava, e não escreve por cima. Um campo inglês com texto lá dentro fica
 * como está — o que alguém escreveu à mão ganha sempre ao que o modelo
 * escreveria. Para retraduzir, esvazia-se o campo primeiro.
 *
 * Anda pelos campos do formulário e não pelo documento gravado, o que permite
 * traduzir um artigo acabado de escrever, ainda por gravar.
 */

type No = { text?: unknown; children?: unknown; root?: unknown };

/** Os nós de texto de uma árvore Lexical, pela ordem do documento. */
function nosDeTexto(no: unknown, fora: No[] = []): No[] {
  if (Array.isArray(no)) {
    for (const filho of no) nosDeTexto(filho, fora);
    return fora;
  }
  if (!no || typeof no !== "object") return fora;
  const doc = no as No;
  if (typeof doc.text === "string" && doc.text.trim()) fora.push(doc);
  if (doc.children) nosDeTexto(doc.children, fora);
  if (doc.root) nosDeTexto(doc.root, fora);
  return fora;
}

/** Se um campo com marcação tem alguma coisa escrita lá dentro. */
function temTexto(valor: unknown): boolean {
  return nosDeTexto(valor).length > 0;
}

/*
 * Quanto texto vai de cada vez.
 *
 * Seis mil caracteres é o que um pedido faz com folga dentro dos sessenta
 * segundos, contando com o dobro à saída — o inglês é mais comprido do que o
 * português nuns sítios e mais curto noutros, mas nunca pela metade. Um
 * parágrafo nunca se parte ao meio: o corte é entre parágrafos.
 */
const LETRAS_POR_PEDACO = 6000;

function pedacos(textos: string[]): string[][] {
  const fora: string[][] = [];
  let atual: string[] = [];
  let letras = 0;
  for (const texto of textos) {
    if (atual.length && letras + texto.length > LETRAS_POR_PEDACO) {
      fora.push(atual);
      atual = [];
      letras = 0;
    }
    atual.push(texto);
    letras += texto.length;
  }
  if (atual.length) fora.push(atual);
  return fora;
}

export function TraduzirArtigo() {
  const [campos] = useAllFormFields();
  const { dispatchFields, getDataByPath } = useForm();
  const [busy, setBusy] = useState(false);
  const [passo, setPasso] = useState("");

  const texto = (caminho: string) => String((campos?.[caminho] as { value?: unknown })?.value ?? "").trim();
  const arvore = (caminho: string) => (campos?.[caminho] as { value?: unknown })?.value ?? getDataByPath(caminho);

  const tituloPt = texto("titlePt");
  const resumoPt = texto("excerpt.pt");
  const corpoPt = arvore("body");

  /* O que falta em inglês. Cada peça é independente: um artigo com o título
     inglês já escrito e o corpo por traduzir traduz só o corpo. */
  const falta = {
    titulo: Boolean(tituloPt) && !texto("titleEn"),
    resumo: Boolean(resumoPt) && !texto("excerpt.en"),
    corpo: temTexto(corpoPt) && !temTexto(arvore("bodyEn")),
  };
  const nada = !falta.titulo && !falta.resumo && !falta.corpo;

  const traduzir = async () => {
    setBusy(true);
    try {
      /* Uma lista só, pela ordem do artigo: primeiro o título e o resumo,
         depois o corpo. O modelo lê o título antes dos parágrafos, que é a
         ordem por que uma pessoa também leria. */
      const nos = falta.corpo ? nosDeTexto(corpoPt) : [];
      const cabeca = [falta.titulo ? tituloPt : null, falta.resumo ? resumoPt : null].filter(
        (item): item is string => typeof item === "string",
      );
      const tudo = [...cabeca, ...nos.map((no) => String(no.text))];

      const lotes = pedacos(tudo);
      const traduzido: string[] = [];
      for (const [indice, lote] of lotes.entries()) {
        setPasso(lotes.length > 1 ? `${indice + 1} de ${lotes.length}` : "");
        const response = await fetch("/api/posts/traduzir", {
          method: "post",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ textos: lote, titulo: tituloPt }),
        });
        const corpo = await leResposta<{ traducoes?: string[]; error?: string }>(response);
        if (!response.ok || !corpo.traducoes) throw new Error(corpo?.error ?? `erro ${response.status}`);
        traduzido.push(...corpo.traducoes);
      }

      const escritas: string[] = [];
      let lido = 0;
      if (falta.titulo) {
        dispatchFields({ type: "UPDATE", path: "titleEn", value: traduzido[lido] ?? "" });
        lido += 1;
        escritas.push("título");
      }
      if (falta.resumo) {
        dispatchFields({ type: "UPDATE", path: "excerpt.en", value: traduzido[lido] ?? "" });
        lido += 1;
        escritas.push("resumo");
      }
      if (falta.corpo) {
        /* A árvore inglesa nasce de uma cópia da portuguesa. Sem a cópia, os
           nós que se escrevem aqui são os mesmos que o editor português está a
           desenhar, e o artigo trocava de língua à frente de quem o escreveu. */
        const copia = structuredClone(corpoPt) as unknown;
        nosDeTexto(copia).forEach((no, indice) => {
          no.text = traduzido[lido + indice] ?? no.text;
        });
        dispatchFields({ type: "UPDATE", path: "bodyEn", value: copia });
        escritas.push("corpo");
      }

      toast.success(`Traduzido: ${escritas.join(", ")}. Lê antes de gravar.`);
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setPasso("");
      setBusy(false);
    }
  };

  const porTraduzir = [falta.titulo && "título", falta.resumo && "resumo", falta.corpo && "corpo"]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "0 0 1.5rem", flexWrap: "wrap" }}>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={busy || nada}
        onClick={traduzir}
      >
        <span className="btn__content">
          <span className="btn__label">
            {busy ? `A traduzir o artigo…${passo ? ` (${passo})` : ""}` : "Traduzir o artigo para inglês"}
          </span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        {nada
          ? "Não há nada por traduzir: ou não há texto português, ou o inglês já está escrito."
          : `Por traduzir: ${porTraduzir}. Não escreve por cima do inglês que já lá esteja, e não grava.`}
      </span>
    </div>
  );
}

export default TraduzirArtigo;
