import { abrirConvite, ErroDeDebito } from "@/lib/debitos/fluxo";
import { CREDOR } from "@/lib/debitos/modelo";
import { CASA } from "@/lib/email-papel";
import { cms } from "../../[token]/comum";
import { Moldura } from "../../Moldura";
import { FormularioDebito } from "./FormularioDebito";

export const dynamic = "force-dynamic";

/**
 * A ligação que a Jelly manda ao cliente: preencher a autorização de débito
 * direto. Daqui segue para a página de assinatura de sempre, com o documento
 * já preenchido — ou, se quem assina é outra pessoa, para o email dela.
 */
export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let autorizacao: Awaited<ReturnType<typeof abrirConvite>>;
  try {
    autorizacao = await abrirConvite(await cms(), token, true);
  } catch (erro) {
    return (
      <Moldura>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">Esta ligação não abre</h1>
        <p className="mt-4 max-w-[56ch] text-fg-soft">{erro instanceof ErroDeDebito ? erro.message : "Não foi possível abrir esta autorização."}</p>
        <p className="mt-6 text-sm text-fg-soft">
          Dúvidas: <a className="text-red underline" href={`mailto:${CASA.email}`}>{CASA.email}</a>
        </p>
      </Moldura>
    );
  }

  if (["assinada", "registada"].includes(autorizacao.estado)) {
    return (
      <Moldura>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">Esta autorização já está assinada</h1>
        <p className="mt-4 max-w-[56ch] text-fg-soft">Obrigado. Não é preciso fazer mais nada. A cópia assinada seguiu por email para quem assinou.</p>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <span className="eyebrow text-red">Débito direto SEPA · {CASA.legal}</span>
      <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">Autorização de débito direto</h1>
      <p className="mt-4 max-w-[64ch] text-fg-soft">
        Com esta autorização, a {CASA.legal} passa a cobrar as faturas da <strong className="text-fg">{autorizacao.empresa}</strong> por
        débito direto na conta que indicar. Pode sempre pedir ao seu banco o reembolso de um débito até oito semanas depois, e revogar
        a autorização quando quiser.
      </p>
      <p className="mt-3 max-w-[64ch] text-sm text-fg-soft">
        Credor: {CREDOR.nome} · NIF {CREDOR.nif} · Identificador de credor {CREDOR.ics}
      </p>
      <FormularioDebito
        token={token}
        empresa={autorizacao.empresa}
        email={autorizacao.contactoEmail}
        anterior={
          autorizacao.referencia
            ? {
                nif: autorizacao.nif ?? "",
                morada: autorizacao.morada ?? "",
                recorrente: autorizacao.recorrente !== false,
                signatarioNome: autorizacao.signatarioNome ?? "",
                signatarioCargo: autorizacao.signatarioCargo ?? "",
                signatarioEmail: autorizacao.signatarioEmail ?? "",
              }
            : null
        }
      />
      <p className="mt-12 max-w-[70ch] text-xs leading-relaxed text-fg-soft">
        Estes dados servem para a autorização de débito direto e para a cobrança das faturas, e são tratados pela {CASA.legal} nos
        termos da sua{" "}
        <a className="underline" href="https://www.jelly.pt/legal/politica-de-privacidade-2" target="_blank" rel="noopener">
          política de privacidade
        </a>
        . Ao assinar fica registado o nome, o email confirmado com o código, a data e hora, o endereço IP e o browser.
      </p>
    </Moldura>
  );
}
