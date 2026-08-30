"use client";

import { FieldLabel, useField } from "@payloadcms/ui";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Etiqueta = { id: number | string; titlePt: string };

/**
 * As etiquetas de um artigo, escritas aqui mesmo.
 *
 * Escreve-se o nome e carrega-se em enter ou em vírgula. Se a etiqueta já
 * existir, é essa que entra; se não existir, é criada. Não abre gaveta nenhuma,
 * não obriga a sair do artigo, e não pede slug — o slug sai do nome, no
 * servidor.
 *
 * O campo de relação que o Payload dá de origem abre uma gaveta por cada
 * etiqueta nova. Numa relação a sério — o autor de um artigo, o projeto de um
 * caso — a gaveta é o que se quer, porque do outro lado há uma ficha com
 * campos. Uma etiqueta é uma palavra: a gaveta custa mais do que a coisa vale, e
 * é o que faz com que ninguém etiquete nada.
 *
 * As sugestões não são enfeite. Sem elas, três pessoas a escrever à mão dão
 * «Marketing», «marketing» e «marketing digital» em três artigos seguidos —
 * e uma etiqueta que se escreve de três maneiras não serve para procurar nada.
 * Por isso a lista de baixo mostra o que já existe, o nome é comparado sem dar
 * pelas maiúsculas nem pelos acentos, e criar é o último recurso e não o
 * primeiro.
 */
export function CampoEtiquetas({ field, path }: { field?: { label?: unknown }; path?: string }) {
  const caminho = path ?? "tags";
  const { value, setValue } = useField<(number | string)[]>({ path: caminho });
  const escolhidas = useMemo(() => (Array.isArray(value) ? value : []), [value]);

  const [todas, setTodas] = useState<Etiqueta[]>([]);
  const [escrito, setEscrito] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      try {
        const resposta = await fetch("/api/tags?limit=0&depth=0&sort=titlePt", { credentials: "include" });
        const corpo = (await resposta.json()) as { docs?: Etiqueta[] };
        if (vivo && resposta.ok) setTodas(corpo.docs ?? []);
      } catch {
        // Sem a lista ainda se escreve: o que falha são as sugestões.
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  /** Para comparar nomes: sem maiúsculas, sem acentos, sem espaços a mais. */
  const chave = (nome: string) =>
    nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();

  const porId = useMemo(() => new Map(todas.map((etiqueta) => [String(etiqueta.id), etiqueta])), [todas]);

  const sugestoes = useMemo(() => {
    const procura = chave(escrito);
    if (!procura) return [];
    return todas
      .filter((etiqueta) => !escolhidas.some((id) => String(id) === String(etiqueta.id)))
      .filter((etiqueta) => chave(etiqueta.titlePt).includes(procura))
      .slice(0, 6);
  }, [escrito, todas, escolhidas]);

  const jaExiste = useMemo(
    () => todas.find((etiqueta) => chave(etiqueta.titlePt) === chave(escrito)),
    [escrito, todas],
  );

  const junta = useCallback(
    (id: number | string) => {
      if (escolhidas.some((posta) => String(posta) === String(id))) return;
      setValue([...escolhidas, id]);
    },
    [escolhidas, setValue],
  );

  /** Aceita o que está escrito: a que existe, ou uma nova. */
  const aceita = useCallback(
    async (nome: string) => {
      const limpo = nome.trim();
      if (!limpo) return;
      setErro(null);

      const conhecida = todas.find((etiqueta) => chave(etiqueta.titlePt) === chave(limpo));
      if (conhecida) {
        junta(conhecida.id);
        setEscrito("");
        return;
      }

      setOcupado(true);
      try {
        const resposta = await fetch("/api/tags", {
          method: "post",
          credentials: "include",
          headers: { "content-type": "application/json" },
          // Sem slug: sai do nome, no servidor.
          body: JSON.stringify({ titlePt: limpo }),
        });
        const corpo = (await resposta.json()) as { doc?: Etiqueta; errors?: { message?: string }[] };
        if (!resposta.ok || !corpo.doc) throw new Error(corpo.errors?.[0]?.message ?? `erro ${resposta.status}`);
        setTodas((antes) => [...antes, corpo.doc!]);
        junta(corpo.doc.id);
        setEscrito("");
      } catch (falha) {
        setErro(falha instanceof Error ? falha.message : "não deu para criar a etiqueta");
      } finally {
        setOcupado(false);
      }
    },
    [todas, junta],
  );

  const tecla = (evento: React.KeyboardEvent<HTMLInputElement>) => {
    if (evento.key === "Enter" || evento.key === ",") {
      evento.preventDefault();
      void aceita(sugestoes.length && !jaExiste && !escrito.endsWith(" ") ? sugestoes[0]!.titlePt : escrito);
      return;
    }
    // Apagar com o campo vazio tira a última, como em qualquer campo de fichas.
    if (evento.key === "Backspace" && !escrito && escolhidas.length) {
      setValue(escolhidas.slice(0, -1));
    }
  };

  /** Colar «marketing, tecnologia, IA» põe as três. */
  const cola = (evento: React.ClipboardEvent<HTMLInputElement>) => {
    const texto = evento.clipboardData.getData("text");
    if (!texto.includes(",")) return;
    evento.preventDefault();
    void (async () => {
      for (const pedaco of texto.split(",")) await aceita(pedaco);
    })();
  };

  return (
    <div className="field-type" style={{ marginBottom: "1.5rem" }}>
      <FieldLabel label={(field?.label as string) ?? "Etiquetas"} path={caminho} />

      <div
        onClick={() => entrada.current?.focus()}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.4rem",
          minHeight: "2.75rem",
          padding: "0.4rem 0.6rem",
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: "3px",
          background: "var(--theme-input-bg)",
          cursor: "text",
        }}
      >
        {escolhidas.map((id) => (
          <span
            key={String(id)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.15rem 0.2rem 0.15rem 0.55rem",
              borderRadius: "999px",
              background: "var(--theme-elevation-100)",
              fontSize: "0.8rem",
            }}
          >
            {porId.get(String(id))?.titlePt ?? `#${id}`}
            <button
              type="button"
              aria-label={`Tirar ${porId.get(String(id))?.titlePt ?? id}`}
              onClick={(evento) => {
                evento.stopPropagation();
                setValue(escolhidas.filter((posta) => String(posta) !== String(id)));
              }}
              style={{
                border: 0,
                background: "none",
                cursor: "pointer",
                color: "var(--theme-elevation-500)",
                padding: "0 0.3rem",
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </span>
        ))}

        <input
          ref={entrada}
          value={escrito}
          disabled={ocupado}
          onChange={(evento) => setEscrito(evento.target.value)}
          onKeyDown={tecla}
          onPaste={cola}
          onBlur={() => void aceita(escrito)}
          placeholder={escolhidas.length ? "" : "escreve e carrega em enter"}
          style={{
            flex: "1 1 8rem",
            minWidth: "8rem",
            border: 0,
            outline: "none",
            background: "none",
            color: "inherit",
            fontSize: "0.9rem",
            padding: "0.35rem 0",
          }}
        />
      </div>

      {sugestoes.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.5rem" }}>
          {sugestoes.map((etiqueta) => (
            <button
              key={String(etiqueta.id)}
              type="button"
              onClick={() => {
                junta(etiqueta.id);
                setEscrito("");
                entrada.current?.focus();
              }}
              style={{
                border: "1px solid var(--theme-elevation-150)",
                borderRadius: "999px",
                background: "none",
                color: "inherit",
                cursor: "pointer",
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
              }}
            >
              {etiqueta.titlePt}
            </button>
          ))}
        </div>
      ) : null}

      <p style={{ color: erro ? "var(--theme-error-500)" : "var(--theme-elevation-500)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
        {erro ??
          (escrito && !jaExiste && !sugestoes.length
            ? `Enter cria «${escrito.trim()}».`
            : "Aquilo de que o artigo fala. Vírgula ou enter separa. A categoria é uma só — a prateleira; estas são quantas forem precisas.")}
      </p>
    </div>
  );
}

export default CampoEtiquetas;
