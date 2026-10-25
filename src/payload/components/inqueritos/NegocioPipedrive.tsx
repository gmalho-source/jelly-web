"use client";

import { useField } from "@payloadcms/ui";
import { useEffect, useRef, useState } from "react";
import { leResposta } from "../resposta";

type Negocio = { id: number; titulo: string; estado: string; organizacao: string; pessoa: string };

const ESTADOS: Record<string, string> = { open: "Em aberto", won: "Ganho", lost: "Perdido", deleted: "Apagado" };

/**
 * A proposta no Pipedrive a que o link pertence.
 *
 * Abre com os negócios perdidos mais recentes — é deles que sai o inquérito
 * da proposta rejeitada — e procura pelo título quando se escreve. Escolher um
 * preenche a empresa, se ainda estiver vazia: o título dos negócios da casa é
 * «Desafio de Nome | Empresa», e a empresa é o que vem depois da barra.
 *
 * Quando a resposta chegar, fica uma nota nesse negócio com o que foi
 * respondido.
 */
export function NegocioPipedrive() {
  const id = useField<number | null>({ path: "pipedriveId" });
  const titulo = useField<string | null>({ path: "pipedriveTitulo" });
  const organizacao = useField<string | null>({ path: "pipedriveOrganizacao" });
  const empresa = useField<string | null>({ path: "empresa" });

  const [aberto, setAberto] = useState(!id.value);
  const [termo, setTermo] = useState("");
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  const [estado, setEstado] = useState<"pronto" | "a procurar" | "erro">("pronto");
  const [erro, setErro] = useState("");
  const pedido = useRef(0);

  useEffect(() => {
    if (!aberto) return;
    const numero = ++pedido.current;
    const espera = setTimeout(
      async () => {
        setEstado("a procurar");
        try {
          const resposta = await fetch(`/api/inqueritos-links/negocios?q=${encodeURIComponent(termo)}`, { credentials: "include" });
          const corpo = await leResposta<{ ok?: boolean; negocios?: Negocio[]; erro?: string; error?: string }>(resposta);
          if (numero !== pedido.current) return;
          if (!resposta.ok || !corpo.ok) throw new Error(corpo.erro ?? corpo.error ?? `erro ${resposta.status}`);
          setNegocios(corpo.negocios ?? []);
          setEstado("pronto");
        } catch (falha) {
          if (numero !== pedido.current) return;
          setErro(falha instanceof Error ? falha.message : "O Pipedrive não respondeu.");
          setEstado("erro");
        }
      },
      termo ? 350 : 0,
    );
    return () => clearTimeout(espera);
  }, [termo, aberto]);

  const escolhe = (negocio: Negocio) => {
    id.setValue(negocio.id);
    titulo.setValue(negocio.titulo);
    organizacao.setValue(negocio.organizacao || null);
    if (!empresa.value) {
      const daBarra = negocio.titulo.includes("|") ? negocio.titulo.split("|").pop()?.trim() : "";
      empresa.setValue(negocio.organizacao || daBarra || null);
    }
    setAberto(false);
  };

  const tira = () => {
    id.setValue(null);
    titulo.setValue(null);
    organizacao.setValue(null);
    setAberto(true);
  };

  return (
    <div className="inq-negocio">
      <span className="inq-link__rotulo">Proposta no Pipedrive</span>
      {id.value && !aberto ? (
        <div className="inq-negocio__escolhido">
          <a href={`https://app.pipedrive.com/deal/${id.value}`} target="_blank" rel="noopener">
            {titulo.value || `Negócio ${id.value}`} ↗
          </a>
          <button type="button" className="btn btn--style-secondary btn--size-small" onClick={tira}>
            <span className="btn__content">
              <span className="btn__label">Trocar</span>
            </span>
          </button>
        </div>
      ) : (
        <>
          <input
            className="inq-negocio__procura"
            type="search"
            placeholder="Procurar pelo título do negócio…"
            value={termo}
            onChange={(evento) => setTermo(evento.target.value)}
          />
          {!termo ? <p className="inq-link__nota">Os negócios perdidos mais recentes:</p> : null}
          {estado === "erro" ? <p className="inq-link__nota inq-link__nota--erro">{erro}</p> : null}
          <ul className="inq-negocio__lista" aria-busy={estado === "a procurar"}>
            {negocios.map((negocio) => (
              <li key={negocio.id}>
                <button type="button" onClick={() => escolhe(negocio)}>
                  <strong>{negocio.titulo}</strong>
                  <span>{[negocio.organizacao, negocio.pessoa, ESTADOS[negocio.estado] ?? negocio.estado].filter(Boolean).join(" · ")}</span>
                </button>
              </li>
            ))}
            {estado === "pronto" && !negocios.length ? <li className="inq-link__nota">Nenhum negócio encontrado.</li> : null}
          </ul>
          <p className="inq-link__nota">Opcional: um link pessoal também serve sem negócio, só com a empresa.</p>
        </>
      )}
    </div>
  );
}

export default NegocioPipedrive;
