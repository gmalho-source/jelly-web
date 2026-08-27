"use client";

import { toast } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { leResposta } from "./resposta";

type Plano = {
  pessoas: { nome: string; existe: boolean; faltam: string[] }[];
  porFazer: number;
  soNoPainel: string[];
  error?: string;
};

/**
 * Aviso por cima da lista da equipa: diz quantas fichas estão sem conteúdo e
 * enche-as a partir do ficheiro do repositório.
 *
 * As pessoas entraram no CMS só com o nome. O resto — função, apresentação,
 * LinkedIn e os dois retratos — estava no repositório, o que serve quem lê o
 * site mas deixa quem abre a ficha sem nada para corrigir. Havia um script de
 * linha de comandos para isto, e continua a haver; isto existe porque o painel
 * é onde o trabalho é feito, e um botão não pede variáveis de ambiente nem
 * terminal a ninguém.
 *
 * Chama o servidor uma vez por pessoa e não uma vez por todas: cada pessoa traz
 * dois retratos para descarregar e subir, e quarenta e dois numa só chamada não
 * caberiam no tempo que uma função tem para responder. É também o que permite
 * dizer por onde vai — e o que faz uma falha a meio deixar atrás o que já
 * ficou feito, em vez de desfazer tudo.
 *
 * Desaparece quando não houver nada a fazer. É um andaime, não um móvel.
 */
export function PreencherEquipa() {
  const [plano, setPlano] = useState<Plano | null>(null);
  const [aCorrer, setACorrer] = useState(false);
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

  const preencher = async () => {
    const porFazer = (plano?.pessoas ?? []).filter((pessoa) => pessoa.faltam.length);
    if (!porFazer.length) return;

    setACorrer(true);
    setConta({ feitas: 0, total: porFazer.length });

    let enchidas = 0;
    try {
      for (const pessoa of porFazer) {
        const response = await fetch("/api/team/preencher", {
          method: "post",
          credentials: "include",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nome: pessoa.nome }),
        });
        const body = await leResposta<{ estado?: string; error?: string }>(response);
        if (!response.ok) throw new Error(`${pessoa.nome}: ${body?.error ?? `erro ${response.status}`}`);
        enchidas += 1;
        setConta({ feitas: enchidas, total: porFazer.length });
      }
      toast.success(`${enchidas} ${enchidas === 1 ? "ficha preenchida" : "fichas preenchidas"}.`);
      setPlano(await buscaPlano());
      // A tabela é desenhada no servidor: sem isto ficava a dizer «nenhum
      // retrato» ao lado de nomes que já o têm.
      router.refresh();
    } catch (error) {
      toast.error(`Parou: ${error instanceof Error ? error.message : "erro desconhecido"}`);
      setPlano(await buscaPlano());
      router.refresh();
    } finally {
      setACorrer(false);
    }
  };

  if (!plano || plano.porFazer === 0) return null;

  const semFicha = plano.pessoas.filter((pessoa) => !pessoa.existe).length;

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
          {plano.porFazer} {plano.porFazer === 1 ? "ficha sem conteúdo" : "fichas sem conteúdo"}
        </strong>
        <span style={{ color: "var(--theme-elevation-600)", fontSize: "0.8rem", lineHeight: 1.5 }}>
          A função, a apresentação, o LinkedIn e os dois retratos estão no repositório e o site já os serve.
          Isto passa-os para cá, para poderem ser editados.
          {semFicha ? ` ${semFicha} ${semFicha === 1 ? "pessoa não tem ficha" : "pessoas não têm ficha"} e será criada.` : ""}
          {" "}Não escreve por cima de nada: um campo que já tenha valor fica como está.
          {" "}A apresentação inglesa fica de fora — faz-se ficha a ficha, com o botão de traduzir.
        </span>
      </div>
      <button type="button" className="btn btn--style-primary btn--size-small" disabled={aCorrer} onClick={preencher}>
        <span className="btn__content">
          <span className="btn__label">
            {aCorrer && conta ? `A preencher… ${conta.feitas} de ${conta.total}` : "Preencher a partir do repositório"}
          </span>
        </span>
      </button>
    </div>
  );
}

export default PreencherEquipa;
