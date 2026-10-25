"use client";

import { useFormFields } from "@payloadcms/ui";
import { useEffect, useState } from "react";
import { perguntasDe, type DocDoInquerito } from "@/lib/inqueritos/forma";
import { emTexto, legiveis, limites } from "@/lib/inqueritos/logica";
import type { Dados, Pergunta } from "@/lib/inqueritos/tipos";

/**
 * Uma resposta, lida como se lê um formulário preenchido: cada pergunta e o
 * que foi respondido, pela ordem do inquérito. As perguntas que ficaram por
 * responder aparecem na mesma, em branco — numa resposta incompleta é aí que
 * se vê onde a pessoa parou.
 */
export function RespostaVista() {
  const dados = useFormFields(([campos]) => campos?.dados?.value as Dados | undefined);
  const inquerito = useFormFields(([campos]) => campos?.inquerito?.value as number | string | { id: number | string } | undefined);
  const id = inquerito && typeof inquerito === "object" ? inquerito.id : inquerito;
  const [perguntas, setPerguntas] = useState<Pergunta[] | null>(null);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    void (async () => {
      try {
        const resposta = await fetch(`/api/inqueritos/${id}?depth=0`, { credentials: "include" });
        if (!resposta.ok) throw new Error(String(resposta.status));
        const doc = (await resposta.json()) as DocDoInquerito;
        if (vivo) setPerguntas(legiveis(perguntasDe(doc)));
      } catch {
        // Sem o inquérito, mostra-se o que a resposta guardou dos textos.
        if (vivo) setFalhou(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [id]);

  if (!dados) return null;
  if (!perguntas && !falhou) return <p className="inq-resposta__vazia">A carregar…</p>;
  const lista: Pergunta[] =
    perguntas ??
    Object.keys(dados.valores ?? {}).map((chave) => ({ chave, tipo: "texto-longo" as const, titulo: dados.rotulos?.[chave] ?? chave }));

  return (
    <dl className="inq-resposta">
      {lista.map((pergunta, indice) => {
        const valor = dados.valores?.[pergunta.chave];
        const texto = perguntas ? emTexto(pergunta, valor, dados) : String(typeof valor === "object" ? JSON.stringify(valor) : (valor ?? ""));
        return (
          <div key={pergunta.chave} className="inq-resposta__linha">
            <dt>
              <span className="inq-resposta__numero">{String(indice + 1).padStart(2, "0")}</span> {pergunta.titulo}
              {pergunta.tipo === "escala" || pergunta.tipo === "nps" ? <span className="inq-resposta__escala"> ({limites(pergunta).join("–")})</span> : null}
            </dt>
            <dd className={texto ? "" : "inq-resposta__vazia"}>
              {pergunta.tipo === "grelha" || pergunta.tipo === "campos"
                ? texto
                  ? texto.split("; ").map((parte) => <div key={parte}>{parte}</div>)
                  : "—"
                : texto || "—"}
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

export default RespostaVista;
