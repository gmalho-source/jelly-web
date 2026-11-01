"use client";

import { FieldDescription, FieldLabel, useField, useFormFields } from "@payloadcms/ui";
import { useEffect, useMemo, useState } from "react";
import { leResposta } from "./resposta";

type Logo = { id: number; nome: string; src: string };

type Props = {
  path: string;
  field?: { label?: string; admin?: { description?: string } };
};

const semAcentos = (texto: string) =>
  texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

/**
 * O logo do cliente de um projeto, escolhido da parede «Clientes».
 *
 * Uma lista de imagens e não um menu de nomes: dois terços dos logos dessa
 * parede não têm nome — vieram de um export que não os trazia — e um menu
 * mostraria trinta linhas em branco. Aqui vê-se a marca e carrega-se nela.
 *
 * Os logos com o nome do cliente aparecem primeiro: é quase sempre um deles.
 */
export function LogoDoCliente({ path, field }: Props) {
  const { value, setValue } = useField<number | { id: number } | null>({ path });
  const cliente = useFormFields(([campos]) => String(campos?.client?.value ?? ""));
  const escolhido = value && typeof value === "object" ? value.id : value;

  const [logos, setLogos] = useState<Logo[] | null>(null);
  const [erro, setErro] = useState("");
  const [aberto, setAberto] = useState(false);
  const [termo, setTermo] = useState("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const resposta = await fetch(
          "/api/logos?where[wall.slug][equals]=clientes&depth=1&limit=0&sort=order",
          { credentials: "include" },
        );
        const corpo = await leResposta<{
          docs?: { id: number; name?: string | null; image?: { url?: string; sizes?: { thumb?: { url?: string | null } } } | null }[];
          errors?: { message?: string }[];
        }>(resposta);
        if (!resposta.ok) throw new Error(corpo.errors?.[0]?.message ?? `erro ${resposta.status}`);
        if (!vivo) return;
        setLogos(
          (corpo.docs ?? [])
            .map((doc) => ({
              id: doc.id,
              nome: (doc.name ?? "").trim(),
              src: doc.image?.sizes?.thumb?.url || doc.image?.url || "",
            }))
            .filter((logo) => logo.src),
        );
      } catch (falha) {
        if (vivo) setErro(falha instanceof Error ? falha.message : "Não foi possível ler os logos.");
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);

  const atual = logos?.find((logo) => logo.id === escolhido);

  const lista = useMemo(() => {
    if (!logos) return [];
    const nomeDoCliente = semAcentos(cliente);
    const procura = semAcentos(termo);
    const condiz = (logo: Logo) => {
      const nome = semAcentos(logo.nome);
      return Boolean(nome && nomeDoCliente && (nome.includes(nomeDoCliente) || nomeDoCliente.includes(nome)));
    };
    return logos
      .filter((logo) => !procura || semAcentos(logo.nome).includes(procura))
      .sort((a, b) => Number(condiz(b)) - Number(condiz(a)));
  }, [logos, cliente, termo]);

  const escolhe = (id: number) => {
    setValue(id);
    setAberto(false);
    setTermo("");
  };

  return (
    <div className="field-type logo-cliente">
      <FieldLabel label={field?.label ?? "Logo do cliente"} path={path} />

      {escolhido && !aberto ? (
        <div className="logo-cliente__escolhido">
          <span className="logo-cliente__cartao">
            {atual ? (
              // O painel não passa pelo otimizador de imagens: é a miniatura da Blob, tal como está.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={atual.src} alt={atual.nome || cliente} />
            ) : (
              <span className="logo-cliente__nota">A carregar…</span>
            )}
          </span>
          <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setAberto(true)}>
            <span className="btn__content">
              <span className="btn__label">Trocar</span>
            </span>
          </button>
          <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setValue(null)}>
            <span className="btn__content">
              <span className="btn__label">Tirar</span>
            </span>
          </button>
        </div>
      ) : (
        <>
          {!aberto ? (
            <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setAberto(true)}>
              <span className="btn__content">
                <span className="btn__label">Escolher o logo</span>
              </span>
            </button>
          ) : (
            <div className="logo-cliente__painel">
              <div className="logo-cliente__barra">
                <input
                  type="search"
                  placeholder="Procurar pelo nome (nem todos o têm)…"
                  value={termo}
                  onChange={(evento) => setTermo(evento.target.value)}
                />
                <button type="button" className="btn btn--style-secondary btn--size-small" onClick={() => setAberto(false)}>
                  <span className="btn__content">
                    <span className="btn__label">Fechar</span>
                  </span>
                </button>
              </div>
              {erro ? <p className="logo-cliente__nota logo-cliente__nota--erro">{erro}</p> : null}
              {!logos && !erro ? <p className="logo-cliente__nota">A carregar os logos…</p> : null}
              <ul className="logo-cliente__grelha">
                {lista.map((logo) => (
                  <li key={logo.id}>
                    <button
                      type="button"
                      aria-pressed={logo.id === escolhido}
                      title={logo.nome || "Logo sem nome"}
                      onClick={() => escolhe(logo.id)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.src} alt={logo.nome} loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
              {logos && !lista.length ? <p className="logo-cliente__nota">Nenhum logo com esse nome.</p> : null}
            </div>
          )}
        </>
      )}

      {field?.admin?.description ? <FieldDescription description={field.admin.description} path={path} /> : null}
    </div>
  );
}

export default LogoDoCliente;
