"use client";

import { toast, useDocumentInfo, useFormFields, useFormModified } from "@payloadcms/ui";
import { useState } from "react";
import { leResposta } from "../resposta";

type Respostas = { criadas?: number; faltam?: number; noTypeform?: number; jaExistiam?: number; semValores?: number; error?: string };

/**
 * Os dois botões do Typeform, na barra lateral do inquérito.
 *
 * «Trazer as perguntas» só aparece num inquérito sem perguntas. «Trazer as
 * respostas» pode carregar-se as vezes que se quiser: as que já cá estão não
 * se repetem. As respostas vêm aos lotes — o botão continua sozinho até não
 * faltar nenhuma, para nenhum pedido passar do tempo da Vercel.
 */
export function ImportarTypeform() {
  const { id } = useDocumentInfo();
  const codigo = useFormFields(([campos]) => campos?.typeformId?.value as string | undefined);
  const perguntas = useFormFields(([campos]) => Number(campos?.perguntas?.value ?? 0));
  const alterado = useFormModified();
  const [ocupado, setOcupado] = useState<"" | "perguntas" | "respostas">("");
  const [relato, setRelato] = useState<string[]>([]);
  const [trazidas, setTrazidas] = useState(false);

  if (!id || !codigo) return null;

  const trazerPerguntas = async (substituir: boolean) => {
    if (alterado) {
      toast.error("Grave primeiro as alterações.");
      return;
    }
    if (
      substituir &&
      !window.confirm(
        "Trazer as perguntas outra vez do Typeform? As perguntas daqui são substituídas pelas de lá, e as correções feitas no painel perdem-se. As respostas ficam, ligadas às mesmas perguntas.",
      )
    )
      return;
    setOcupado("perguntas");
    try {
      const resposta = await fetch(`/api/inqueritos/${id}/typeform/perguntas${substituir ? "?substituir=1" : ""}`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ perguntas?: number; notas?: string[]; error?: string }>(resposta);
      if (!resposta.ok) throw new Error(corpo.error ?? `erro ${resposta.status}`);
      toast.success(`${corpo.perguntas} perguntas trazidas do Typeform.`);
      // As notas dizem que condições vieram e o que ficou por acertar: ficam à
      // vista até se carregar no botão que abre o inquérito outra vez.
      setRelato(corpo.notas ?? []);
      setTrazidas(true);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível trazer as perguntas.");
    } finally {
      setOcupado("");
    }
  };

  const trazerRespostas = async () => {
    setOcupado("respostas");
    let criadas = 0;
    let ultima: Respostas = {};
    // As que já cá estavam contam-se na primeira volta; nas seguintes, as da volta anterior também lá estão.
    let jaEstavam = 0;
    try {
      for (let volta = 0; volta < 50; volta += 1) {
        const resposta = await fetch(`/api/inqueritos/${id}/typeform/respostas`, { method: "post", credentials: "include" });
        ultima = await leResposta<Respostas>(resposta);
        if (!resposta.ok) throw new Error(ultima.error ?? `erro ${resposta.status}`);
        if (volta === 0) jaEstavam = ultima.jaExistiam ?? 0;
        criadas += ultima.criadas ?? 0;
        setRelato([`${criadas} respostas trazidas até agora…`]);
        if (!ultima.faltam) break;
      }
      const linhas = [
        `${ultima.noTypeform ?? 0} respostas completas no Typeform.`,
        `${criadas} trazidas agora; ${jaEstavam} já cá estavam.`,
      ];
      if (ultima.semValores) linhas.push(`${ultima.semValores} vieram sem nenhuma resposta reconhecida: confira se as perguntas foram trazidas do mesmo formulário.`);
      setRelato(linhas);
      toast.success(criadas ? `${criadas} respostas trazidas do Typeform.` : "Não havia respostas novas no Typeform.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível trazer as respostas.");
    } finally {
      setOcupado("");
    }
  };

  return (
    <div className="inq-typeform">
      {trazidas ? (
        <button type="button" className="btn btn--style-primary btn--size-small" onClick={() => window.location.reload()}>
          <span className="btn__content">
            <span className="btn__label">Ver as perguntas trazidas</span>
          </span>
        </button>
      ) : !perguntas ? (
        <button type="button" className="btn btn--style-secondary btn--size-small" disabled={Boolean(ocupado)} onClick={() => void trazerPerguntas(false)}>
          <span className="btn__content">
            <span className="btn__label">{ocupado === "perguntas" ? "A trazer…" : "Trazer as perguntas do Typeform"}</span>
          </span>
        </button>
      ) : (
        <>
          <button type="button" className="btn btn--style-secondary btn--size-small" disabled={Boolean(ocupado)} onClick={() => void trazerRespostas()}>
            <span className="btn__content">
              <span className="btn__label">{ocupado === "respostas" ? "A trazer…" : "Trazer as respostas do Typeform"}</span>
            </span>
          </button>
          <button type="button" className="inq-typeform__outra-vez" disabled={Boolean(ocupado)} onClick={() => void trazerPerguntas(true)}>
            {ocupado === "perguntas" ? "A trazer…" : "Trazer as perguntas outra vez"}
          </button>
        </>
      )}
      {relato.length ? (
        <ul className="inq-typeform__relato">
          {relato.map((linha) => (
            <li key={linha}>{linha}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default ImportarTypeform;
