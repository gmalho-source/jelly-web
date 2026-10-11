import { CREDOR } from "@/lib/debitos/modelo";
import { CASA } from "@/lib/email-papel";
import { chaveDoLinkValida } from "@/payload/globals/link-com-chave";
import { cms } from "../../[token]/comum";
import { Moldura } from "../../Moldura";
import { FormularioDebito } from "../../debito/[token]/FormularioDebito";

export const dynamic = "force-dynamic";

/**
 * O link único dos débitos diretos: o cliente preenche a autorização sem
 * convite. Daqui segue para a página de assinatura de sempre — ou, se quem
 * assina é outra pessoa, para o email dela.
 */
export default async function Pagina({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  if (!(await chaveDoLinkValida(await cms(), "debito-link", chave))) {
    return (
      <Moldura>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">Este link não está disponível</h1>
        <p className="mt-4 max-w-[56ch] text-fg-soft">Pode ter sido substituído por um novo. Peça o link atual à Jelly.</p>
        <p className="mt-6 text-sm text-fg-soft">
          Dúvidas: <a className="text-red underline" href={`mailto:${CASA.email}`}>{CASA.email}</a>
        </p>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <span className="eyebrow text-red">Débito direto SEPA · {CASA.legal}</span>
      <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">Autorização de débito direto</h1>
      <p className="mt-4 max-w-[64ch] text-fg-soft">
        Com esta autorização, a {CASA.legal} passa a cobrar as faturas da sua empresa por débito direto na conta que indicar. Pode
        sempre pedir ao seu banco o reembolso de um débito até oito semanas depois, e revogar a autorização quando quiser.
      </p>
      <p className="mt-3 max-w-[64ch] text-sm text-fg-soft">
        Credor: {CREDOR.nome} · NIF {CREDOR.nif} · Identificador de credor {CREDOR.ics}
      </p>
      <FormularioDebito acao={`/assinar/sepa/${encodeURIComponent(chave)}/preencher`} empresa="" email="" anterior={null} link />
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
