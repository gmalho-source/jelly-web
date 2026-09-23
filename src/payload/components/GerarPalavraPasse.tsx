"use client";

import { toast, useField } from "@payloadcms/ui";
import { useState } from "react";

/**
 * Um botão que inventa uma palavra-passe e a escreve nos dois campos.
 *
 * Criar um utilizador à mão termina quase sempre da mesma maneira: uma senha
 * pensada na altura, curta, parecida com a anterior, e escrita duas vezes. Isto
 * tira essa decisão de cima de quem cria a conta.
 *
 * Nasce no browser, no `crypto.getRandomValues`, e não no servidor: assim não
 * viaja pela rede antes de existir, e não passa por nenhum registo pelo
 * caminho. Só sai daqui quando o formulário for gravado, como qualquer senha
 * escrita à mão — e aí vai cifrada, que é o que o Payload faz com ela.
 *
 * Mostra-se uma vez, em claro, com um botão para copiar. Tem de ser: depois de
 * gravada não há como a ler outra vez, nem aqui nem na base de dados, e alguém
 * tem de a entregar a quem vai usá-la.
 *
 * Vinte e quatro caracteres de um alfabeto de sessenta e seis. São cerca de 145
 * bits, o que é muito mais do que preciso e não custa nada — isto vai para um
 * gestor de senhas, não para a memória de ninguém. Ficaram de fora o `l`, o `I`,
 * o `O` e os algarismos que se confundem com eles, para o dia em que alguém a
 * tiver de ditar ao telefone.
 */
const ALFABETO = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_=+!@#%";
const COMPRIMENTO = 24;

/**
 * Sorteio sem viés: um byte de 0 a 255 dividido por um alfabeto de 64 não dá
 * todos os caracteres com a mesma probabilidade, e os primeiros sairiam mais
 * vezes. Os bytes que caem fora do último múltiplo inteiro deitam-se fora e
 * pede-se outro.
 */
function inventa(): string {
  const limite = Math.floor(256 / ALFABETO.length) * ALFABETO.length;
  const letras: string[] = [];
  while (letras.length < COMPRIMENTO) {
    const bytes = crypto.getRandomValues(new Uint8Array(COMPRIMENTO));
    for (const b of bytes) {
      if (b >= limite) continue;
      letras.push(ALFABETO[b % ALFABETO.length]);
      if (letras.length === COMPRIMENTO) break;
    }
  }
  return letras.join("");
}

export function GerarPalavraPasse() {
  const senha = useField<string>({ path: "password" });
  const confirmacao = useField<string>({ path: "confirm-password" });
  const [aVista, setAVista] = useState<string | null>(null);
  const [copiada, setCopiada] = useState(false);

  const gerar = () => {
    const nova = inventa();
    senha.setValue(nova);
    confirmacao.setValue(nova);
    setAVista(nova);
    setCopiada(false);
    toast.success("Palavra-passe gerada. Copia-a antes de gravar — depois não há como a ler.");
  };

  const copiar = async () => {
    if (!aVista) return;
    try {
      await navigator.clipboard.writeText(aVista);
      setCopiada(true);
      toast.success("Copiada.");
    } catch {
      // Sem permissão para a área de transferência — fica à vista para copiar à mão.
      toast.error("O browser não deixou copiar. Selecciona e copia à mão.");
    }
  };

  return (
    <div className="field-type" style={{ marginBottom: "1.5rem" }}>
      <button type="button" className="btn btn--style-secondary btn--size-small" onClick={gerar}>
        {aVista ? "Gerar outra" : "Gerar palavra-passe"}
      </button>

      {aVista ? (
        <div
          style={{
            marginTop: ".75rem",
            padding: ".75rem .9rem",
            border: "1px solid var(--theme-elevation-150)",
            borderRadius: "4px",
            background: "var(--theme-elevation-50)",
          }}
        >
          <code style={{ fontSize: "15px", letterSpacing: ".02em", wordBreak: "break-all" }}>{aVista}</code>
          <div style={{ marginTop: ".6rem", display: "flex", alignItems: "center", gap: ".75rem" }}>
            <button type="button" className="btn btn--style-secondary btn--size-small" onClick={copiar}>
              {copiada ? "Copiada" : "Copiar"}
            </button>
            <span style={{ fontSize: "12px", color: "var(--theme-elevation-500)" }}>
              Só aparece agora. Depois de gravar não há como a ler outra vez.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
