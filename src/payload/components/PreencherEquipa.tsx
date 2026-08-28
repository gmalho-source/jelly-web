"use client";

import { toast } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { leResposta } from "./resposta";

type Plano = {
  pessoas: { nome: string; existe: boolean; faltam: string[] }[];
  porFazer: number;
  semIngles: string[];
  soNoPainel: string[];
};

type Tarefa = {
  chave: string;
  nomes: string[];
  titulo: string;
  explicacao: string;
  botao: string;
  endereco: string;
  /** Quantas ao mesmo tempo. */
  aoMesmoTempo: number;
};

/**
 * Aviso por cima da lista da equipa, com o trabalho que dá para fazer de uma
 * vez em vez de ficha a ficha.
 *
 * São dois, e aparecem só enquanto houver o que fazer:
 *
 * — encher as fichas a partir do ficheiro do repositório, para as pessoas que
 *   entraram no CMS só com o nome;
 * — traduzir para inglês as apresentações que ainda só existem em português.
 *
 * Os dois chamam o servidor uma vez por pessoa e não uma vez por todas. Encher
 * traz dois retratos para descarregar e subir por pessoa; traduzir é uma ida ao
 * modelo, que demora. Vinte e uma de qualquer um deles numa só chamada não
 * caberiam no tempo que uma função tem para responder — e assim uma falha a meio
 * deixa atrás o que já ficou feito, em vez de desfazer tudo.
 *
 * Nenhum dos dois escreve por cima do que já lá esteja.
 */
export function PreencherEquipa() {
  const [plano, setPlano] = useState<Plano | null>(null);
  const [aCorrer, setACorrer] = useState<string | null>(null);
  const [conta, setConta] = useState<{ feitas: number; total: number } | null>(null);
  const router = useRouter();

  const buscaPlano = useCallback(async (): Promise<Plano | null> => {
    try {
      const response = await fetch("/api/team/preencher", { credentials: "include" });
      const body = await leResposta<Plano>(response);
      return response.ok ? body : null;
    } catch {
      // Sem plano não se mostra nada: isto é um aviso, não uma página.
      return null;
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const novo = await buscaPlano();
      if (vivo && novo) setPlano(novo);
    })();
    return () => {
      vivo = false;
    };
  }, [buscaPlano]);

  const correr = async (tarefa: Tarefa) => {
    if (!tarefa.nomes.length) return;

    setACorrer(tarefa.chave);
    setConta({ feitas: 0, total: tarefa.nomes.length });

    let feitas = 0;
    const fila = [...tarefa.nomes];

    const uma = async (nome: string) => {
      const response = await fetch(tarefa.endereco, {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nome }),
      });
      const body = await leResposta<{ error?: string }>(response);
      if (!response.ok) throw new Error(`${nome}: ${body?.error ?? `erro ${response.status}`}`);
      feitas += 1;
      setConta({ feitas, total: tarefa.nomes.length });
    };

    // Algumas ao mesmo tempo, e não todas: uma tradução é uma ida ao modelo e
    // demora meio minuto — vinte à vez seriam dez minutos com o separador
    // aberto. Três de cada vez é a diferença entre dez minutos e três, sem pedir
    // ao modelo mais do que ele dá de boa vontade.
    const trabalhador = async () => {
      for (let nome = fila.shift(); nome; nome = fila.shift()) await uma(nome);
    };

    try {
      await Promise.all(Array.from({ length: Math.min(tarefa.aoMesmoTempo, fila.length) }, trabalhador));
      toast.success(`${feitas} de ${tarefa.nomes.length}. Feito.`);
    } catch (error) {
      // O que ficou feito fica: cada pessoa é gravada por si, e a que falhou
      // volta a aparecer na conta do aviso.
      toast.error(`Parou em ${feitas} de ${tarefa.nomes.length}: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setPlano(await buscaPlano());
      setACorrer(null);
      setConta(null);
      // A tabela é desenhada no servidor: sem isto ficava a dizer «nenhum
      // retrato» ao lado de nomes que já o têm.
      router.refresh();
    }
  };

  if (!plano) return null;

  const semFicha = plano.pessoas.filter((pessoa) => !pessoa.existe).length;
  const porEncher = plano.pessoas.filter((pessoa) => pessoa.faltam.length).map((pessoa) => pessoa.nome);

  const tarefas: Tarefa[] = [
    {
      chave: "encher",
      nomes: porEncher,
      titulo: `${porEncher.length} ${porEncher.length === 1 ? "ficha sem conteúdo" : "fichas sem conteúdo"}`,
      explicacao:
        "A função, a apresentação, o LinkedIn e os dois retratos estão no repositório e o site já os serve. Isto passa-os para cá, para poderem ser editados." +
        (semFicha ? ` ${semFicha} ${semFicha === 1 ? "pessoa não tem ficha" : "pessoas não têm ficha"} e será criada.` : ""),
      botao: "Preencher a partir do repositório",
      endereco: "/api/team/preencher",
      // Uma de cada vez: cada pessoa traz dois retratos a subir, e não há
      // pressa nenhuma que justifique carregar quatro ficheiros ao mesmo tempo.
      aoMesmoTempo: 1,
    },
    {
      chave: "traduzir",
      nomes: plano.semIngles,
      titulo: `${plano.semIngles.length} ${plano.semIngles.length === 1 ? "apresentação sem inglês" : "apresentações sem inglês"}`,
      explicacao:
        "Traduz para inglês britânico as que só existem em português, e grava. Mantém a voz de cada um e os parágrafos, e não traduz nomes, terras nem funções. Vale a pena ler depois: são textos escritos pelas próprias pessoas.",
      botao: "Traduzir todas",
      endereco: "/api/team/traduzir-e-gravar",
      aoMesmoTempo: 3,
    },
  ].filter((tarefa) => tarefa.nomes.length);

  if (!tarefas.length) return null;

  return (
    <div style={{ display: "grid", gap: "0.75rem", margin: "0 0 1.5rem" }}>
      {tarefas.map((tarefa) => (
        <div
          key={tarefa.chave}
          style={{
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "1.25rem",
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: "1 1 24rem", minWidth: "16rem" }}>
            <strong style={{ display: "block", marginBottom: "0.25rem" }}>{tarefa.titulo}</strong>
            <span style={{ color: "var(--theme-elevation-600)", fontSize: "0.8rem", lineHeight: 1.5 }}>
              {tarefa.explicacao} Não escreve por cima de nada: um campo que já tenha valor fica como está.
            </span>
          </div>
          <button
            type="button"
            className="btn btn--style-primary btn--size-small"
            disabled={aCorrer !== null}
            onClick={() => correr(tarefa)}
          >
            <span className="btn__content">
              <span className="btn__label">
                {aCorrer === tarefa.chave && conta ? `${conta.feitas} de ${conta.total}…` : tarefa.botao}
              </span>
            </span>
          </button>
        </div>
      ))}
    </div>
  );
}

export default PreencherEquipa;
