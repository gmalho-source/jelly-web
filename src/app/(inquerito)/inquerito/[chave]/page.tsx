import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { JellyWordmark } from "@/components/JellyLogo";
import { CASA } from "@/lib/email-papel";
import { formularioDe, porChave } from "@/lib/inqueritos/servidor";
import { Inquerito, type Modo } from "./Inquerito";

export const dynamic = "force-dynamic";

const AVISOS = {
  pt: {
    naoExiste: ["Este link não está disponível", "Pode ter sido substituído por um novo. Peça o link atual a quem lho enviou."],
    fechado: ["Este inquérito já terminou", "Obrigado pelo interesse. Já não estamos a receber respostas."],
    respondido: ["Já respondeu a este inquérito", "A sua resposta chegou. Obrigado por nos ajudar a melhorar."],
    duvidas: "Dúvidas",
  },
  en: {
    naoExiste: ["This link is not available", "It may have been replaced. Please ask whoever sent it for the current link."],
    fechado: ["This survey has ended", "Thank you for your interest. We are no longer collecting answers."],
    respondido: ["You have already answered this survey", "Your answers reached us. Thank you for helping us improve."],
    duvidas: "Questions",
  },
};

function Aviso({ titulo, texto, lingua }: { titulo: string; texto: string; lingua: "pt" | "en" }) {
  return (
    <main lang={lingua} className="mx-auto flex min-h-[100svh] max-w-[760px] flex-col px-5 py-10 sm:px-8">
      <a href="https://www.jelly.pt" aria-label="Jelly" className="-mt-10 grid h-[72px] w-[72px] place-items-center bg-red">
        <JellyWordmark className="w-[54px] text-paper" />
      </a>
      <div className="my-auto py-16">
        <h1 className="font-display text-[clamp(28px,4vw,44px)] leading-[1.08] tracking-[-0.02em]">{titulo}</h1>
        <p className="mt-4 max-w-[56ch] text-lg text-fg-soft">{texto}</p>
        <p className="mt-8 text-sm text-fg-soft">
          {AVISOS[lingua].duvidas}:{" "}
          <a className="text-red underline" href={`mailto:${CASA.email}`}>
            {CASA.email}
          </a>
        </p>
      </div>
    </main>
  );
}

/**
 * O inquérito, para quem tem o link.
 *
 * A chave no endereço é o que deixa entrar: a do link geral do inquérito, ou a
 * de um link pessoal. Um inquérito em rascunho só abre a quem tem sessão no
 * painel, e aí nada é gravado; quem tem sessão e responde a um inquérito
 * aberto fica registado como resposta da equipa.
 */
export default async function Pagina({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  const payload = await getPayload({ config });
  const encontrado = await porChave(payload, chave);
  const { user } = await payload.auth({ headers: await headers() }).catch(() => ({ user: null }));

  const lingua = encontrado?.inquerito.lingua === "en" ? "en" : "pt";
  const avisos = AVISOS[lingua];
  if (!encontrado || (encontrado.inquerito.estado === "rascunho" && !user)) {
    return <Aviso titulo={avisos.naoExiste[0]} texto={avisos.naoExiste[1]} lingua={lingua} />;
  }
  const { inquerito, link } = encontrado;
  if (inquerito.estado === "fechado") return <Aviso titulo={avisos.fechado[0]} texto={avisos.fechado[1]} lingua={lingua} />;
  if (link?.respondidoEm) return <Aviso titulo={avisos.respondido[0]} texto={avisos.respondido[1]} lingua={lingua} />;

  const formulario = formularioDe(inquerito);
  // As perguntas que o link pessoal já sabe responder não aparecem: a
  // resposta junta-se no servidor, ao gravar.
  const preenchidas = formulario.perguntas
    .filter((pergunta) => (pergunta.preencher === "empresa" && link?.empresa) || (pergunta.preencher === "nome" && link?.nome))
    .map((pergunta) => pergunta.chave);

  const modo: Modo = inquerito.estado === "rascunho" ? "previa" : user ? "equipa" : "normal";
  const quem = user ? String((user as { name?: string | null; email?: string }).name || (user as { email?: string }).email || "") : "";

  return <Inquerito chave={chave} formulario={formulario} preenchidas={preenchidas} modo={modo} quem={quem} empresa={link?.empresa ?? ""} />;
}
