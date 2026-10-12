"use client";

import { toast } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { leResposta } from "./resposta";

/** Quantas ao mesmo tempo. */
const AO_MESMO_TEMPO = 3;

/**
 * Aviso por cima da lista da equipa: as apresentações que só existem em
 * português, com um botão que as traduz e grava todas. Aparece só enquanto
 * houver alguma.
 *
 * Houve aqui outro, que enchia as fichas a partir de `src/content/team.ts`
 * quando a equipa passou para o painel. Esse trabalho está feito, e o aviso
 * passou a contar como «fichas sem conteúdo» as pessoas que se apagavam do
 * painel — e o botão tê-las-ia criado outra vez. Saiu; o nome do componente
 * ficou, para o mapa do painel não ter de ser gerado de novo.
 *
 * Chama o servidor uma vez por pessoa e não uma vez por todas: uma tradução é
 * uma ida ao modelo, que demora, e vinte numa só chamada não caberiam no tempo
 * que uma função tem para responder. Assim uma falha a meio deixa atrás o que
 * já ficou feito, em vez de desfazer tudo.
 *
 * Não escreve por cima de nada: um inglês que já lá esteja fica como está.
 */
export function PreencherEquipa() {
  const [nomes, setNomes] = useState<string[] | null>(null);
  const [conta, setConta] = useState<{ feitas: number; total: number } | null>(null);
  const router = useRouter();

  const buscaNomes = useCallback(async (): Promise<string[] | null> => {
    try {
      const response = await fetch("/api/team/por-traduzir", { credentials: "include" });
      const body = await leResposta<{ semIngles?: string[] }>(response);
      return response.ok ? (body.semIngles ?? []) : null;
    } catch {
      // Sem lista não se mostra nada: isto é um aviso, não uma página.
      return null;
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const novos = await buscaNomes();
      if (vivo && novos) setNomes(novos);
    })();
    return () => {
      vivo = false;
    };
  }, [buscaNomes]);

  const traduzir = async (todos: string[]) => {
    setConta({ feitas: 0, total: todos.length });

    let feitas = 0;
    const fila = [...todos];

    const uma = async (nome: string) => {
      const response = await fetch("/api/team/traduzir-e-gravar", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const body = await leResposta<{ error?: string }>(response);
      if (!response.ok) throw new Error(`${nome}: ${body?.error ?? `erro ${response.status}`}`);
      feitas += 1;
      setConta({ feitas, total: todos.length });
    };

    // Algumas ao mesmo tempo, e não todas: uma tradução demora meio minuto —
    // vinte à vez seriam dez minutos com o separador aberto. Três de cada vez é
    // a diferença entre dez minutos e três, sem pedir ao modelo mais do que ele
    // dá de boa vontade.
    const trabalhador = async () => {
      for (let nome = fila.shift(); nome; nome = fila.shift()) await uma(nome);
    };

    try {
      await Promise.all(Array.from({ length: Math.min(AO_MESMO_TEMPO, fila.length) }, trabalhador));
      toast.success(`${feitas} de ${todos.length}. Feito.`);
    } catch (error) {
      // O que ficou feito fica: cada pessoa é gravada por si, e a que falhou
      // volta a aparecer na conta do aviso.
      toast.error(`Parou em ${feitas} de ${todos.length}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setNomes(await buscaNomes());
      setConta(null);
      router.refresh();
    }
  };

  if (!nomes?.length) return null;

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: "4px",
        padding: "1rem 1.25rem",
        margin: "0 0 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        flexWrap: "wrap",
      }}
    >
      <div style={{ flex: "1 1 24rem", minWidth: "16rem" }}>
        <strong style={{ display: "block", marginBottom: "0.25rem" }}>
          {nomes.length} {nomes.length === 1 ? "apresentação sem inglês" : "apresentações sem inglês"}
        </strong>
        <span style={{ color: "var(--theme-elevation-600)", fontSize: "0.8rem", lineHeight: 1.5 }}>
          Traduz para inglês britânico as que só existem em português, e grava. Mantém a voz de cada um e os parágrafos, e
          não traduz nomes, terras nem funções. Vale a pena ler depois: são textos escritos pelas próprias pessoas. Não
          escreve por cima de nada: um inglês que já lá esteja fica como está.
        </span>
      </div>
      <button type="button" className="btn btn--style-primary btn--size-small" disabled={conta !== null} onClick={() => traduzir(nomes)}>
        <span className="btn__content">
          <span className="btn__label">{conta ? `${conta.feitas} de ${conta.total}…` : "Traduzir todas"}</span>
        </span>
      </button>
    </div>
  );
}

export default PreencherEquipa;
