"use client";

import { toast, useDocumentInfo, useField, useForm } from "@payloadcms/ui";
import { useRef, useState } from "react";
import type { CampoDaFicha, Ficha } from "@/lib/ficha-tecnica";
import type { FichaResolvida } from "../endpoints/markdown-import";
import { docxParaMarkdown, type Falha } from "./docx";
import { leResposta } from "./resposta";

type Resultado = {
  body?: unknown;
  imagens?: { entraram: number; novas?: number; reaproveitadas?: number; falharam: Falha[] };
  ficha?: FichaResolvida;
  error?: string;
};

type Resumo = { preenchidos: string[]; mantidos: string[]; avisos: string[]; falharam: Falha[] };

/** O modelo Word com a norma: estilo «Título», secções e a ficha técnica no fim. */
const MODELO = "/modelos/modelo-artigo-jelly.docx";

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
 * O corpo escreve-se por cima do que lá estiver, e por isso pergunta antes. Os
 * outros campos — título, slug, data, autor, categoria, etiquetas, capa,
 * resumo, vindos da ficha técnica ou do cabeçalho do Markdown — só se
 * preenchem quando estão vazios: numa reimportação, o que alguém já mudou no
 * painel fica como está. O que ficou por preencher, e porquê, diz-se por baixo
 * do botão. Nada se grava sozinho.
 */
export function MarkdownImport({ campo = "body" }: { campo?: string }) {
  const corpo = useField<unknown>({ path: campo });
  const { dispatchFields, getDataByPath, setModified } = useForm();
  const { id } = useDocumentInfo();
  const entrada = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);
  const [resumo, setResumo] = useState<Resumo | null>(null);

  // O corpo inglês preenche os campos ingleses; os que não têm língua — data,
  // autor, categoria, etiquetas, capa — são os mesmos nos dois.
  const ingles = campo === "bodyEn";
  const CAMINHOS: Record<CampoDaFicha, string> = {
    titulo: ingles ? "titleEn" : "titlePt",
    slug: ingles ? "slugEn" : "slug",
    resumo: ingles ? "excerpt.en" : "excerpt.pt",
    data: "date",
    autor: "authorRef",
    categoria: "category",
    etiquetas: "tags",
    capa: "cover",
  };
  const vazio = (caminho: string) => {
    const valor = getDataByPath(caminho);
    return valor == null || valor === "" || (Array.isArray(valor) && !valor.length);
  };

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
      let ficha: Ficha | null = null;
      let semAlt: (number | string)[] = [];
      let novasAqui = 0;
      let reaproveitadasAqui = 0;
      if (word) {
        const lido = await docxParaMarkdown(ficheiro);
        ({ markdown, ficha, semAlt } = lido);
        novasAqui = lido.novas;
        reaproveitadasAqui = lido.reaproveitadas;
        falharamAqui = lido.falharam;
      } else {
        markdown = await ficheiro.text();
      }

      const preencher = (Object.keys(CAMINHOS) as CampoDaFicha[]).filter((qual) => vazio(CAMINHOS[qual]));
      const resposta = await fetch("/api/posts/markdown", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          markdown,
          nome: ficheiro.name,
          ficha,
          preencher,
          lingua: ingles ? "en" : "pt",
          id,
          tituloAtual: String(getDataByPath(CAMINHOS.titulo) ?? ""),
        }),
      });
      const dados = await leResposta<Resultado>(resposta);
      if (!resposta.ok) throw new Error(dados?.error ?? `erro ${resposta.status}`);

      // Por despacho, com `value` e `initialValue` juntos: com `setValue` só, a
      // árvore entrava no formulário e o editor continuava a desenhar o campo
      // vazio (a razão está em `TraduzirArtigo.tsx`).
      dispatchFields({ type: "UPDATE", path: corpo.path ?? campo, value: dados.body, initialValue: dados.body });

      const { campos = {}, presentes = [], avisos = [] } = dados.ficha ?? {};
      const preenchidos: string[] = [];
      const poe = (qual: CampoDaFicha, valor: unknown, descricao: string) => {
        dispatchFields({ type: "UPDATE", path: CAMINHOS[qual], value: valor });
        preenchidos.push(descricao);
      };
      if (campos.titulo) poe("titulo", campos.titulo, `título «${campos.titulo}»`);
      if (campos.slug) poe("slug", campos.slug, `slug ${campos.slug}`);
      if (campos.data) poe("data", campos.data, `data ${campos.data.slice(0, 10).split("-").reverse().join("/")}`);
      if (campos.autor) poe("autor", campos.autor.id, `autor ${campos.autor.nome}`);
      if (campos.categoria) poe("categoria", campos.categoria.id, `categoria ${campos.categoria.nome}`);
      if (campos.etiquetas?.length) {
        const novas = campos.etiquetas.filter((etiqueta) => etiqueta.nova).length;
        poe(
          "etiquetas",
          campos.etiquetas.map((etiqueta) => etiqueta.id),
          `${campos.etiquetas.length} ${campos.etiquetas.length > 1 ? "etiquetas" : "etiqueta"}${novas ? ` (${novas} ${novas > 1 ? "novas" : "nova"})` : ""}`,
        );
      }
      if (campos.capa) {
        poe("capa", campos.capa.id, "capa");
        // A capa sem texto alternativo no Word subiu com um genérico; o título do
        // artigo descreve-a melhor do que «documento — imagem 4».
        const titulo = campos.titulo ?? String(getDataByPath(CAMINHOS.titulo) ?? "");
        if (titulo && semAlt.some((semTexto) => String(semTexto) === String(campos.capa!.id))) {
          void fetch(`/api/media/${campos.capa.id}`, {
            method: "PATCH",
            credentials: "include",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ alt: titulo }),
          }).catch(() => undefined);
        }
      }
      if (campos.resumo) poe("resumo", campos.resumo, "resumo");
      setModified(true);

      const nomes: Record<CampoDaFicha, string> = {
        titulo: "título",
        slug: "slug",
        data: "data",
        autor: "autor",
        categoria: "categoria",
        etiquetas: "etiquetas",
        capa: "capa",
        resumo: "resumo",
      };
      const mantidos = presentes.filter((qual) => !preencher.includes(qual)).map((qual) => nomes[qual]);
      const falharam = [...falharamAqui, ...(dados.imagens?.falharam ?? [])];
      setResumo({ preenchidos, mantidos, avisos, falharam });

      const novas = novasAqui + (dados.imagens?.novas ?? 0);
      const reaproveitadas = reaproveitadasAqui + (dados.imagens?.reaproveitadas ?? 0);
      const imagens = [
        novas ? `${novas} ${novas > 1 ? "imagens novas" : "imagem nova"} na biblioteca` : "",
        reaproveitadas ? `${reaproveitadas} ${reaproveitadas > 1 ? "reaproveitadas" : "reaproveitada"}` : "",
      ]
        .filter(Boolean)
        .join(" e ");
      toast.success(
        `Artigo importado${imagens ? `, ${imagens}` : ""}${
          preenchidos.length ? `, ${preenchidos.length} ${preenchidos.length > 1 ? "campos preenchidos" : "campo preenchido"}` : ""
        }${falharam.length + avisos.length ? `, ${falharam.length + avisos.length} por resolver` : ""}. Falta gravar.`,
      );
    } catch (erro) {
      toast.error(`Não deu: ${erro instanceof Error ? erro.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
    }
  };

  const linha: React.CSSProperties = { margin: "0 0 0.35rem" };
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
        Texto, imagens e a ficha técnica do fim (título, data, autor, categoria, etiquetas, capa).{" "}
        <a href={MODELO} download style={{ color: "inherit", textDecoration: "underline" }}>
          Descarregar o modelo Word
        </a>
      </span>

      {resumo ? (
        <div style={{ marginTop: "0.7rem", fontSize: "0.8rem", color: "var(--theme-elevation-600)" }}>
          {resumo.preenchidos.length ? (
            <p style={linha}>
              <strong>Preenchidos:</strong> {resumo.preenchidos.join(", ")}.
            </p>
          ) : null}
          {resumo.mantidos.length ? (
            <p style={linha}>
              <strong>Já tinham valor, não mexi:</strong> {resumo.mantidos.join(", ")}.
            </p>
          ) : null}
          {resumo.avisos.length || resumo.falharam.length ? (
            <div>
              <p style={{ ...linha, color: "var(--theme-error-500)" }}>
                <strong>Por resolver à mão:</strong>
              </p>
              <ul style={{ margin: 0, paddingLeft: "1.1rem" }}>
                {resumo.avisos.map((aviso) => (
                  <li key={aviso}>{aviso}</li>
                ))}
                {resumo.falharam.map((falha) => (
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
