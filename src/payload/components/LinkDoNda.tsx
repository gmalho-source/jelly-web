"use client";

import { toast, useFormFields } from "@payloadcms/ui";
import { useState, useSyncExternalStore } from "react";

const semAssinatura = () => () => {};
import { leResposta } from "./resposta";

/**
 * No global «Link do NDA»: o link para copiar, e o botão que troca a chave.
 * Trocar a chave fecha o link antigo — quem o tinha deixa de conseguir abrir.
 */
export function LinkDoNda() {
  const guardada = useFormFields(([campos]) => campos?.chave?.value as string | undefined);
  // A chave nova fica aqui depois de trocada: o formulário só a relê ao abrir.
  const [trocada, setTrocada] = useState<string | null>(null);
  // O endereço do site em que se está (produção ou local), só no browser.
  const origem = useSyncExternalStore(semAssinatura, () => window.location.origin, () => "");
  const [ocupado, setOcupado] = useState(false);
  const chave = trocada ?? guardada;
  const link = chave && origem ? `${origem}/assinar/nda/${chave}` : "";
  if (chave && !origem) return null;

  const trocar = async () => {
    if (chave && !window.confirm("Trocar a chave? O link atual deixa de abrir — quem o tem vai precisar do novo.")) return;
    setOcupado(true);
    try {
      const resposta = await fetch("/api/globals/nda-link/trocar-chave", { method: "post", credentials: "include" });
      const corpo = await leResposta<{ chave?: string; error?: string }>(resposta);
      if (!resposta.ok || !corpo.chave) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      toast.success(chave ? "Chave trocada. O link antigo já não abre." : "Link criado.");
      setTrocada(corpo.chave);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível trocar a chave.");
    } finally {
      setOcupado(false);
    }
  };

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Link copiado.");
    } catch {
      toast.error("Não deu para copiar: seleciona o link e copia à mão.");
    }
  };

  return (
    <div
      style={{
        margin: "0 0 1.6rem",
        padding: "1rem",
        border: "1px solid var(--theme-border-color)",
        borderRadius: "var(--style-radius-m)",
        background: "var(--theme-elevation-50)",
        display: "flex",
        flexDirection: "column",
        gap: "0.7rem",
      }}
    >
      {link ? (
        <>
          <code style={{ fontSize: "0.85rem", wordBreak: "break-all", userSelect: "all" }}>{link}</code>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
            <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => void copiar()} style={{ margin: 0 }}>
              <span className="btn__content">
                <span className="btn__label">Copiar o link</span>
              </span>
            </button>
            <button type="button" className="btn btn--style-secondary btn--size-small" disabled={ocupado} onClick={() => void trocar()} style={{ margin: 0 }}>
              <span className="btn__content">
                <span className="btn__label">{ocupado ? "A trocar…" : "Trocar a chave"}</span>
              </span>
            </button>
          </div>
        </>
      ) : (
        <div>
          <button type="button" className="btn btn--style-primary btn--size-small" disabled={ocupado} onClick={() => void trocar()} style={{ margin: 0 }}>
            <span className="btn__content">
              <span className="btn__label">{ocupado ? "A criar…" : "Criar o link"}</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

export default LinkDoNda;
