"use client";

import { toast, useAuth, useDocumentInfo } from "@payloadcms/ui";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { leResposta } from "./resposta";
import { tem, type ComModulos } from "../acesso";

type Ficha = { id: number | string; nome?: string | null };

const nota = { margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--theme-elevation-500)" } as const;

/**
 * Na ficha da candidatura: «Passar a prestador».
 *
 * Cria a ficha em Faturação — nome, email e telefone, estado «parado» — liga-a
 * a esta candidatura, marca a candidatura como «contratado», e abre a ficha
 * nova para se completar. Quando a ligação já existe, mostra-a em vez do botão.
 */
export function PassarAPrestador() {
  const { id } = useDocumentInfo();
  // Mexe noutro módulo: só aparece a quem também o tem.
  const { user } = useAuth();
  const pode = tem(user as ComModulos, "prestadores");
  const router = useRouter();
  const [ficha, setFicha] = useState<Ficha | null | undefined>(undefined);
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    fetch(`/api/prestadores?where[candidatura][equals]=${encodeURIComponent(String(id))}&limit=1&depth=0`, { credentials: "include" })
      .then((resposta) => (resposta.ok ? resposta.json() : { docs: [] }))
      .then((corpo: { docs?: Ficha[] }) => vivo && setFicha(corpo.docs?.[0] ?? null))
      .catch(() => vivo && setFicha(null));
    return () => {
      vivo = false;
    };
  }, [id]);

  if (!id || !pode || ficha === undefined) return null;

  if (ficha) {
    return (
      <div style={{ margin: "0 0 1.2rem" }}>
        <a className="btn btn--style-secondary btn--size-small" href={`/admin/collections/prestadores/${ficha.id}`} style={{ margin: 0 }}>
          <span className="btn__content">
            <span className="btn__label">Já é prestador · ver ficha</span>
          </span>
        </a>
      </div>
    );
  }

  const passar = async () => {
    const certo = window.confirm(
      "Cria a ficha de prestador com o nome, email e telefone desta candidatura (estado «Parado») e marca a candidatura como «Contratado». Continuar?",
    );
    if (!certo) return;
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/applications/${id}/prestador`, { method: "post", credentials: "include" });
      const corpo = await leResposta<{ id?: number | string; existia?: boolean; estado?: string | null; error?: string }>(resposta);
      if (!resposta.ok || !corpo.id) throw new Error(corpo?.error ?? `erro ${resposta.status}`);
      if (corpo.existia) {
        toast.info(
          corpo.estado === "desqualificado"
            ? "Já havia um prestador com este email, e está desqualificado. Ficou ligado; o estado não mudou."
            : "Já havia um prestador com este email. Ficou ligado a esta candidatura.",
        );
      }
      router.push(`/admin/collections/prestadores/${corpo.id}`);
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível criar a ficha.");
      setOcupado(false);
    }
  };

  return (
    <div style={{ margin: "0 0 1.2rem" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" disabled={ocupado} onClick={() => void passar()} style={{ margin: 0 }}>
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A criar…" : "Passar a prestador"}</span>
        </span>
      </button>
      <p style={nota}>
        Para quem foi contratado. Cria a ficha em Faturação com nome, email e telefone; a morada, o NIF e o IBAN preenchem-se lá. O CV fica aqui.
      </p>
    </div>
  );
}

export default PassarAPrestador;
