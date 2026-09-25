"use client";

import { toast, useAllFormFields, useForm } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "./resposta";

/**
 * O assistente do resumo de um projeto, por baixo do campo «Resumo».
 *
 * Pede contexto primeiro — o que o cliente precisava, o que se fez, o que mudou
 * — porque é isso que um resumo tem de dizer e é o que a ficha não sabe. Junta
 * o que já está no formulário (cliente, título, linha de apoio, disciplinas, o
 * texto do caso) e devolve o português e o inglês juntos. Mostra as duas antes
 * de as pôr nos campos: uma sugestão lê-se primeiro, e só depois se usa.
 *
 * Não grava. O formulário fica alterado, e quem edita grava como sempre.
 */
const val = (campos: Record<string, unknown> | undefined, caminho: string) =>
  (campos?.[caminho] as { value?: unknown } | undefined)?.value;

export function ResumoDoProjetoIA() {
  const [campos] = useAllFormFields();
  const { dispatchFields } = useForm();
  const [aberto, setAberto] = useState(false);
  const [contexto, setContexto] = useState("");
  const [busy, setBusy] = useState(false);
  const [sugestao, setSugestao] = useState<{ pt: string; en: string } | null>(null);

  // O texto do caso, em português: títulos e corpos dos blocos da história.
  const historia = Object.entries(campos ?? {})
    .filter(([caminho]) => caminho.startsWith("story.") && /\.(heading|body)$/.test(caminho))
    .map(([, campo]) => String((campo as { value?: unknown })?.value ?? "").trim())
    .filter(Boolean)
    .join("\n");

  const sugerir = async () => {
    setBusy(true);
    try {
      const disciplinas = val(campos, "disciplines");
      const response = await fetch("/api/projects/resumo", {
        method: "post",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contexto,
          cliente: String(val(campos, "client") ?? ""),
          titulo: String(val(campos, "title.pt") ?? ""),
          linha: String(val(campos, "subtitle") ?? ""),
          disciplinas: Array.isArray(disciplinas) ? disciplinas.map(String) : [],
          historia,
          atual: { pt: String(val(campos, "summary.pt") ?? ""), en: String(val(campos, "summary.en") ?? "") },
        }),
      });
      const corpo = await leResposta<{ pt?: string; en?: string; error?: string }>(response);
      if (!response.ok || !corpo.pt || !corpo.en) throw new Error(corpo?.error ?? `erro ${response.status}`);
      setSugestao({ pt: corpo.pt, en: corpo.en });
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setBusy(false);
    }
  };

  const usar = () => {
    if (!sugestao) return;
    dispatchFields({ type: "UPDATE", path: "summary.pt", value: sugestao.pt });
    dispatchFields({ type: "UPDATE", path: "summary.en", value: sugestao.en });
    toast.success("Resumo posto nos dois campos. Lê antes de gravar.");
    setSugestao(null);
    setAberto(false);
  };

  const botao = (rotulo: string, onClick: () => void, opcoes: { primario?: boolean; desligado?: boolean } = {}) => (
    <button
      type="button"
      className={`btn ${opcoes.primario ? "btn--style-primary" : "btn--style-secondary"} btn--size-small`}
      disabled={opcoes.desligado}
      onClick={onClick}
      style={{ margin: 0 }}
    >
      <span className="btn__content">
        <span className="btn__label">{rotulo}</span>
      </span>
    </button>
  );

  const caixa: React.CSSProperties = {
    border: "1px solid var(--theme-elevation-150)",
    borderRadius: "var(--style-radius-m, 6px)",
    padding: "0.9rem 1rem",
    margin: "0 0 1.5rem",
    background: "var(--theme-elevation-50)",
  };
  const nota: React.CSSProperties = { color: "var(--theme-elevation-500)", fontSize: "0.75rem" };

  if (!aberto) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", margin: "-0.5rem 0 1.5rem", flexWrap: "wrap" }}>
        {botao("Escrever o resumo com IA", () => setAberto(true))}
        <span style={nota}>Em português e inglês de uma vez. Só escreve nos campos quando carregares em «Usar».</span>
      </div>
    );
  }

  return (
    <div style={caixa}>
      <label htmlFor="resumo-ia-contexto" style={{ display: "block", fontWeight: 600, marginBottom: "0.35rem" }}>
        Contexto para o resumo
      </label>
      <p style={{ ...nota, margin: "0 0 0.5rem" }}>
        O que o cliente precisava, o que fizemos e o que mudou. Números e resultados só se forem verdadeiros — o
        assistente não inventa, mas também não adivinha.
        {historia ? " O texto do caso também vai junto." : ""}
      </p>
      <textarea
        id="resumo-ia-contexto"
        value={contexto}
        onChange={(evento) => setContexto(evento.target.value)}
        rows={5}
        placeholder="Ex.: A marca vendia só em lojas próprias. Criámos a loja online e a estratégia de performance; em seis meses o online passou a 18% das vendas."
        style={{
          width: "100%",
          resize: "vertical",
          padding: "0.6rem 0.75rem",
          borderRadius: "var(--style-radius-s, 4px)",
          border: "1px solid var(--theme-elevation-150)",
          background: "var(--theme-input-bg, var(--theme-elevation-0))",
          color: "var(--theme-text)",
          font: "inherit",
        }}
      />

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
        {botao(busy ? "A escrever…" : sugestao ? "Sugerir outra" : "Sugerir resumo", sugerir, {
          primario: !sugestao,
          desligado: busy || (contexto.trim().length < 20 && historia.length < 200),
        })}
        {botao("Fechar", () => {
          setAberto(false);
          setSugestao(null);
        })}
      </div>

      {sugestao ? (
        <div style={{ marginTop: "1rem", display: "grid", gap: "0.75rem" }}>
          {(["pt", "en"] as const).map((lingua) => (
            <div key={lingua}>
              <div style={{ ...nota, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.2rem" }}>
                {lingua === "pt" ? "Português" : "English"} · {sugestao[lingua].length} caracteres
                {sugestao[lingua].length > 160 ? " — o Google corta perto dos 155" : ""}
              </div>
              <p style={{ margin: 0, lineHeight: 1.5 }}>{sugestao[lingua]}</p>
            </div>
          ))}
          <div>{botao("Usar nos dois campos", usar, { primario: true })}</div>
        </div>
      ) : null}
    </div>
  );
}

export default ResumoDoProjetoIA;
