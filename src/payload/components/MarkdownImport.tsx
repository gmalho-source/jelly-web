"use client";

import { toast, useField, useForm } from "@payloadcms/ui";
import { useRef, useState } from "react";
import { docxParaMarkdown, type Falha } from "./docx";
import { leResposta } from "./resposta";

type Resultado = {
  body?: unknown;
  meta?: { titulo?: string; resumo?: string; data?: string };
  imagens?: { entraram: number; falharam: { origem: string; erro?: string }[] };
  error?: string;
};

/**
 * Carregar um Markdown ou um Word e ficar com o artigo escrito.
 *
 * O ficheiro é lido aqui e o texto vai para o servidor, que converte e mete as
 * imagens na biblioteca — o trabalho tem de ser lá, porque é lá que se criam
 * ficheiros. O que volta é a árvore do editor, e é essa que se põe no campo.
 *
 * Um Word passa primeiro por `docx.ts`, que o abre aqui, sobe as imagens que
 * traz lá dentro e o transforma em Markdown. Daí para a frente o caminho é o
 * mesmo: o artigo sai igual venha de onde vier.
 *
 * Escreve por cima do que estiver no corpo, e por isso pergunta antes quando já
 * há texto lá. O que vem no cabeçalho do ficheiro — título, resumo, data — não
 * se escreve em campo nenhum: mostra-se, e quem importou copia se quiser. Um
 * título já escrito não se pisa por causa de uma linha de metadados.
 */
export function MarkdownImport({ campo = "body" }: { campo?: string }) {
  const corpo = useField<unknown>({ path: campo });
  const { dispatchFields, setModified } = useForm();
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resumo, setResumo] = useState<Resultado | null>(null);

  const escolher = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const ficheiro = event.target.files?.[0];
    event.target.value = "";
    if (!ficheiro) return;

    const jaTem = temTexto(corpo.value);
    if (jaTem && !window.confirm("Já há texto neste corpo. O ficheiro escreve por cima. Continuar?")) return;

    setOcupado(true);
    setResumo(null);
    try {
      const word = /\.docx$/i.test(ficheiro.name);
      let markdown: string;
      let falharamAqui: Falha[] = [];
      if (word) {
        const lido = await docxParaMarkdown(ficheiro);
        markdown = lido.markdown;
        falharamAqui = lido.falharam;
      } else {
        markdown = await ficheiro.text();
      }
      const resposta = await fetch("/api/posts/markdown", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markdown, nome: ficheiro.name }),
      });
      const dados = await leResposta<Resultado>(resposta);
      if (!resposta.ok) throw new Error(dados?.error ?? `erro ${resposta.status}`);
      if (falharamAqui.length) {
        dados.imagens = {
          entraram: dados.imagens?.entraram ?? 0,
          falharam: [...falharamAqui, ...(dados.imagens?.falharam ?? [])],
        };
      }

      // Por despacho, com `value` e `initialValue` juntos: com `setValue` só, a
      // árvore entrava no formulário e o editor continuava a desenhar o campo
      // vazio (a razão está em `TraduzirArtigo.tsx`).
      dispatchFields({ type: "UPDATE", path: corpo.path ?? campo, value: dados.body, initialValue: dados.body });
      setModified(true);
      setResumo(dados);

      const entraram = dados.imagens?.entraram ?? 0;
      const falharam = dados.imagens?.falharam.length ?? 0;
      toast.success(
        `Artigo importado${entraram ? `, ${entraram} ${entraram > 1 ? "imagens" : "imagem"} na biblioteca` : ""}${falharam ? `, ${falharam} por resolver` : ""}. Falta gravar.`,
      );
    } catch (erro) {
      toast.error(`Não deu: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div style={{ margin: "0.5rem 0 1rem" }}>
      <input
        ref={entrada}
        type="file"
        accept=".md,.markdown,.mdx,.txt,text/markdown,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        onChange={escolher}
        style={{ display: "none" }}
      />
      <button
        type="button"
        className="btn btn--style-secondary btn--size-small"
        disabled={ocupado}
        onClick={() => entrada.current?.click()}
      >
        {ocupado ? "A importar…" : "Importar Markdown ou Word"}
      </button>
      <span style={{ marginLeft: "0.6rem", color: "var(--theme-elevation-500)", fontSize: "0.75rem" }}>
        Texto, formatação e imagens. Num Word (.docx) as imagens vêm de dentro do documento; num Markdown têm de
        estar em endereços acessíveis.
      </span>

      {resumo ? (
        <div style={{ marginTop: "0.7rem", fontSize: "0.8rem", color: "var(--theme-elevation-600)" }}>
          {resumo.meta && Object.keys(resumo.meta).length ? (
            <p style={{ margin: "0 0 0.4rem" }}>
              O ficheiro trazia também:{" "}
              {[
                resumo.meta.titulo ? `título «${resumo.meta.titulo}»` : "",
                resumo.meta.resumo ? "um resumo" : "",
                resumo.meta.data ? `data ${resumo.meta.data}` : "",
              ]
                .filter(Boolean)
                .join(", ")}
              . Não foi escrito nos campos — copia daqui se quiseres.
            </p>
          ) : null}

          {resumo.imagens?.falharam.length ? (
            <div>
              <p style={{ margin: "0 0 0.3rem", color: "var(--theme-error-500)" }}>
                Estas imagens não entraram e têm de ser carregadas à mão:
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {resumo.imagens.falharam.map((falha) => (
                  <li key={falha.origem}>
                    {falha.origem} — {falha.erro}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Um corpo do editor com alguma coisa escrita lá dentro. */
function temTexto(valor: unknown): boolean {
  const raiz = (valor as { root?: { children?: unknown[] } } | null)?.root;
  if (!raiz?.children?.length) return false;
  return JSON.stringify(raiz.children).replace(/[^\p{L}\p{N}]/gu, "").length > 0;
}
