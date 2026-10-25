"use client";

import { FieldLabel, useAllFormFields, useField } from "@payloadcms/ui";
import { useMemo } from "react";

type Campos = ReturnType<typeof useAllFormFields>[0];

type Anterior = { chave: string; titulo: string; tipo: string; indice: number };

const valorDe = (campos: Campos, caminho: string) => campos?.[caminho]?.value as string | undefined;

/** O número da pergunta a que um campo pertence: «perguntas.3.mostrarSe» → 3. */
const indiceDe = (caminho: string) => Number(/^perguntas\.(\d+)\./.exec(caminho)?.[1] ?? -1);

/**
 * As perguntas que vêm antes desta e que podem servir de condição: as de sim
 * ou não e as de escolha. Uma pergunta nova ainda não tem chave — só a ganha
 * ao gravar —, e por isso só aparece na lista depois de gravada.
 */
function anteriores(campos: Campos, ate: number): Anterior[] {
  const lista: Anterior[] = [];
  for (let i = 0; i < ate; i += 1) {
    const tipo = valorDe(campos, `perguntas.${i}.tipo`);
    const chave = valorDe(campos, `perguntas.${i}.chave`);
    if (!chave || (tipo !== "sim-nao" && tipo !== "escolha")) continue;
    lista.push({ chave, titulo: valorDe(campos, `perguntas.${i}.titulo`) ?? "", tipo, indice: i });
  }
  return lista;
}

/** A pergunta de que esta depende. */
export function CondicaoPergunta({ path, field }: { path: string; field?: { label?: unknown } }) {
  const { value, setValue } = useField<string>({ path });
  const [campos] = useAllFormFields();
  const indice = indiceDe(path);
  const lista = useMemo(() => anteriores(campos, indice), [campos, indice]);
  const caminhoDoValor = path.replace(/mostrarSe$/, "mostrarValor");
  const valor = useField<string>({ path: caminhoDoValor });

  return (
    <div className="field-type text inq-condicao" style={{ flex: "1 1 50%", minWidth: 0 }}>
      <FieldLabel label={(field?.label as string) ?? "Só aparece se a pergunta…"} path={path} />
      <select
        className="inq-condicao__escolha"
        value={value ?? ""}
        onChange={(evento) => {
          setValue(evento.target.value || null);
          valor.setValue(null);
        }}
      >
        <option value="">— aparece sempre —</option>
        {lista.map((pergunta) => (
          <option key={pergunta.chave} value={pergunta.chave}>
            {String(pergunta.indice + 1).padStart(2, "0")}. {pergunta.titulo}
          </option>
        ))}
        {value && !lista.some((pergunta) => pergunta.chave === value) ? <option value={value}>(uma pergunta que já não está antes desta)</option> : null}
      </select>
      {!lista.length ? <p className="inq-condicao__nota">Só perguntas de sim ou não ou de escolha, que venham antes e já gravadas.</p> : null}
    </div>
  );
}

/** A resposta que a faz aparecer. */
export function CondicaoValor({ path, field }: { path: string; field?: { label?: unknown } }) {
  const { value, setValue } = useField<string>({ path });
  const [campos] = useAllFormFields();
  const indice = indiceDe(path);
  const de = valorDe(campos, path.replace(/mostrarValor$/, "mostrarSe"));
  const pergunta = useMemo(() => anteriores(campos, indice).find((anterior) => anterior.chave === de), [campos, indice, de]);

  const opcoes = useMemo(() => {
    if (!pergunta) return [];
    if (pergunta.tipo === "sim-nao") {
      return [
        { valor: "sim", rotulo: "Sim" },
        { valor: "nao", rotulo: "Não" },
      ];
    }
    const lista: { valor: string; rotulo: string }[] = [];
    for (let k = 0; k < 200; k += 1) {
      const rotulo = valorDe(campos, `perguntas.${pergunta.indice}.opcoes.${k}.rotulo`);
      if (rotulo === undefined) break;
      const chave = valorDe(campos, `perguntas.${pergunta.indice}.opcoes.${k}.chave`);
      if (chave) lista.push({ valor: chave, rotulo });
    }
    return lista;
  }, [campos, pergunta]);

  if (!de) return <div className="inq-condicao" style={{ flex: "1 1 50%" }} />;
  return (
    <div className="field-type text inq-condicao" style={{ flex: "1 1 50%", minWidth: 0 }}>
      <FieldLabel label={(field?.label as string) ?? "…tiver a resposta"} path={path} />
      <select className="inq-condicao__escolha" value={value ?? ""} onChange={(evento) => setValue(evento.target.value || null)}>
        <option value="">— escolha —</option>
        {opcoes.map((opcao) => (
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
          </option>
        ))}
      </select>
    </div>
  );
}
