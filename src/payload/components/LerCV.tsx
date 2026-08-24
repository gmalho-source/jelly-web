"use client";

import { toast, useField } from "@payloadcms/ui";
import { leResposta } from "./resposta";
import { useRef, useState } from "react";

/**
 * «Ler um CV»: escolhe-se o ficheiro, e os campos da ficha aparecem preenchidos.
 *
 * Não grava nada — como o botão do resumo dos artigos, escreve nos campos e a
 * ficha só existe quando alguém carregar em guardar. O que fica guardado à
 * partida é o ficheiro, na caixa privada dos documentos: é o CV, e é o que se
 * quer de qualquer maneira.
 *
 * O resumo que o modelo escreve vai para «Leitura do CV», ao lado do ficheiro de
 * onde saiu — não para as notas de quem entrevista, que são de pessoas.
 */
export function LerCV() {
  const escolha = useRef<HTMLInputElement>(null);
  const [ocupado, setOcupado] = useState(false);

  const name = useField<string>({ path: "name" });
  const email = useField<string>({ path: "email" });
  const phone = useField<string>({ path: "phone" });
  const city = useField<string>({ path: "city" });
  const country = useField<string>({ path: "country" });
  const linkedin = useField<string>({ path: "linkedin" });
  const portfolio = useField<string>({ path: "portfolio" });
  const experienceYears = useField<string>({ path: "experienceYears" });
  const contractWanted = useField<string>({ path: "contractWanted" });
  const cv = useField<number | string>({ path: "cv" });
  const source = useField<string>({ path: "source" });
  const leitura = useField<string>({ path: "cvReading" });

  const ler = async (ficheiro: File) => {
    setOcupado(true);
    try {
      const resposta = await fetch(`/api/applications/ler-cv?nome=${encodeURIComponent(ficheiro.name)}`, {
        method: "post",
        credentials: "include",
        headers: { "content-type": ficheiro.type || "application/octet-stream" },
        body: ficheiro,
      });
      const corpo = await leResposta<{
        documento?: number | string;
        campos?: Record<string, unknown>;
        aviso?: string;
        error?: string;
      }>(resposta);
      if (!resposta.ok) throw new Error(corpo?.error ?? `erro ${resposta.status}`);

      if (corpo.documento) cv.setValue(corpo.documento);
      const campos = corpo.campos ?? {};
      const poe = (campo: { setValue: (valor: string) => void }, valor: unknown) => {
        if (typeof valor === "string" && valor.trim()) campo.setValue(valor.trim());
      };
      poe(name, campos.name);
      poe(email, campos.email);
      poe(phone, campos.phone);
      poe(city, campos.city);
      poe(country, campos.country);
      poe(linkedin, campos.linkedin);
      poe(portfolio, campos.portfolio);
      poe(experienceYears, campos.experienceYears);
      poe(contractWanted, campos.contractWanted);
      if (!source.value) source.setValue("CV lido no painel");

      const areas = Array.isArray(campos.areas) ? (campos.areas as string[]) : [];
      const resumo = typeof campos.resumo === "string" ? campos.resumo : "";
      if (resumo || areas.length) {
        const bloco = [
          resumo,
          areas.length ? `Áreas que o CV demonstra: ${areas.join(", ")}.` : "",
          "— leitura automática do CV, por confirmar.",
        ]
          .filter(Boolean)
          .join("\n\n");
        leitura.setValue(leitura.value ? `${leitura.value}\n\n${bloco}` : bloco);
      }

      toast[corpo.aviso ? "warning" : "success"](
        corpo.aviso ?? "Campos preenchidos a partir do CV. Confirma antes de guardar.",
      );
    } catch (error) {
      toast.error(`Não deu: ${error instanceof Error ? error.message : "erro desconhecido"}`);
    } finally {
      setOcupado(false);
      if (escolha.current) escolha.current.value = "";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "0.7rem",
        margin: "0 0 1.4rem",
        padding: "0.9rem 1rem",
        border: "1px solid var(--theme-border-color)",
        borderRadius: "var(--style-radius-m)",
        background: "var(--theme-elevation-50)",
      }}
    >
      <input
        ref={escolha}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: "none" }}
        onChange={(evento) => {
          const ficheiro = evento.target.files?.[0];
          if (ficheiro) void ler(ficheiro);
        }}
      />
      <button
        type="button"
        className="btn btn--style-primary btn--size-small"
        disabled={ocupado}
        onClick={() => escolha.current?.click()}
      >
        <span className="btn__content">
          <span className="btn__label">{ocupado ? "A ler o currículo…" : "Ler um CV"}</span>
        </span>
      </button>
      <span style={{ color: "var(--theme-elevation-500)", fontSize: "0.78rem", maxWidth: "46ch" }}>
        Escolhe o PDF e os campos aparecem preenchidos. O ficheiro fica guardado como CV; a ficha só existe quando
        guardares.
      </span>
    </div>
  );
}

export default LerCV;
