"use client";

import { toast, useDocumentInfo, useFormFields } from "@payloadcms/ui";
import { useState, useSyncExternalStore } from "react";
import { leResposta } from "../resposta";

const semAssinatura = () => () => {};

/** O endereço do site em que se está (produção ou local), só no browser. */
export function useOrigem() {
  return useSyncExternalStore(semAssinatura, () => window.location.origin, () => "");
}

/** Copiar e abrir: os dois botões que todos os links dos inquéritos têm. */
export function BotoesDoLink({ link, extra }: { link: string; extra?: React.ReactNode }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não deu para copiar: selecione o link e copie à mão.");
    }
  };
  return (
    <>
      <code className="inq-link__endereco">{link}</code>
      <div className="inq-link__botoes">
        <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => void copiar()}>
          <span className="btn__content">
            <span className="btn__label">Copiar o link</span>
          </span>
        </button>
        <a className="btn btn--style-secondary btn--size-small" href={link} target="_blank" rel="noopener">
          <span className="btn__content">
            <span className="btn__label">Abrir ↗</span>
          </span>
        </a>
        {extra}
      </div>
    </>
  );
}

/**
 * O link geral do inquérito: o que se manda a toda a gente.
 *
 * Em rascunho, o link só abre a quem tem sessão no painel, e nada do que lá
 * se responde é gravado — serve para ver o inquérito como o cliente o vai
 * ver. Trocar a chave fecha o link antigo.
 */
export function LinkDoInquerito() {
  const { id } = useDocumentInfo();
  const guardada = useFormFields(([campos]) => campos?.chave?.value as string | undefined);
  const estado = useFormFields(([campos]) => campos?.estado?.value as string | undefined);
  const [trocada, setTrocada] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const origem = useOrigem();
  const chave = trocada ?? guardada;

  if (!id || !chave) {
    return <div className="inq-link inq-link--vazio">Grave o inquérito para ter o link.</div>;
  }
  if (!origem) return null;
  const link = `${origem}/inquerito/${chave}`;

  const trocar = async () => {
    if (!window.confirm("Trocar a chave? O link atual deixa de abrir — quem o tem vai precisar do novo.")) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/inqueritos/${id}/trocar-chave`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ chave?: string; error?: string }>(resposta);
      if (!resposta.ok || !corpo.chave) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      toast.success("Chave trocada. O link antigo já não abre.");
      setTrocada(corpo.chave);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível trocar a chave.");
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="inq-link">
      <span className="inq-link__rotulo">Link geral</span>
      <BotoesDoLink
        link={link}
        extra={
          <button type="button" className="btn btn--style-secondary btn--size-small" disabled={ocupado} onClick={() => void trocar()}>
            <span className="btn__content">
              <span className="btn__label">{ocupado ? "A trocar…" : "Trocar a chave"}</span>
            </span>
          </button>
        }
      />
      {estado !== "aberto" ? (
        <p className="inq-link__nota">
          {estado === "fechado"
            ? "Fechado: quem abrir o link vê que o inquérito terminou."
            : "Em rascunho: o link só abre a quem tem sessão no painel, para ver como fica. Nada do que se responde é gravado. Mude para «Aberto» para começar a receber respostas."}
        </p>
      ) : null}
    </div>
  );
}

/** O link de um link pessoal: o mesmo endereço, com a chave dele. */
export function LinkPessoalDoInquerito() {
  const { id } = useDocumentInfo();
  const chave = useFormFields(([campos]) => campos?.chave?.value as string | undefined);
  const respondido = useFormFields(([campos]) => campos?.respondidoEm?.value as string | undefined);
  const origem = useOrigem();
  if (!id || !chave) return <div className="inq-link inq-link--vazio">Escolha o inquérito e grave para ter o link.</div>;
  if (!origem) return null;
  return (
    <div className="inq-link">
      <span className="inq-link__rotulo">Link pessoal</span>
      <BotoesDoLink link={`${origem}/inquerito/${chave}`} />
      <p className="inq-link__nota">
        {respondido
          ? `Respondido a ${new Date(respondido).toLocaleString("pt-PT", { dateStyle: "short", timeStyle: "short" })}. O link mostra agora um agradecimento.`
          : "Aceita uma única resposta. Quem o abrir não precisa de escrever a empresa."}
      </p>
    </div>
  );
}

export default LinkDoInquerito;
