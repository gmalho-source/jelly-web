import { abrir, ErroDeAssinatura, quando } from "@/lib/assinaturas/fluxo";
import { CASA } from "@/lib/email-papel";
import { Assinar } from "./Assinar";
import { cms, emailEscondido } from "./comum";

export const dynamic = "force-dynamic";

/**
 * A página que a ligação do email abre: o documento inteiro, à vista, e por
 * baixo o pedido do código e a assinatura. Sem sessão nem conta — a ligação é
 * a chave, e o código no email confirma que quem a usa é o dono do endereço.
 */
export default async function Pagina({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let sessao: Awaited<ReturnType<typeof abrir>>;
  try {
    sessao = await abrir(await cms(), token);
  } catch (erro) {
    const mensagem = erro instanceof ErroDeAssinatura ? erro.message : "Não foi possível abrir este documento.";
    return (
      <Moldura>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">Esta ligação não abre</h1>
        <p className="mt-4 max-w-[56ch] text-fg-soft">{mensagem}</p>
        <p className="mt-6 text-sm text-fg-soft">
          Dúvidas: <a className="text-red underline" href={`mailto:${CASA.email}`}>{CASA.email}</a>
        </p>
      </Moldura>
    );
  }

  const { pedido, linha } = sessao;
  const documento = `/assinar/${token}/documento`;
  const concluido = pedido.estado === "concluido";

  return (
    <Moldura>
      <span className="eyebrow text-red">Assinatura digital · {CASA.legal}</span>
      <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">{pedido.titulo}</h1>
      <p className="mt-3 text-fg-soft">
        Para assinar por <strong className="text-fg">{linha.nome}</strong> ({emailEscondido(linha.email)}).
      </p>

      {/* No telemóvel um PDF dentro da página lê-se mal: abre-se no leitor do
          próprio telefone. A partir do tablet, fica à vista aqui. */}
      <a href={documento} target="_blank" rel="noopener" className="btn-pill btn-pill-ink mt-8 sm:hidden">
        Ler o documento
      </a>
      <div className="mt-8 hidden overflow-hidden rounded-[10px] border border-line bg-white sm:block">
        <iframe src={documento} title={pedido.titulo} className="block h-[70vh] min-h-[420px] w-full" />
      </div>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <a className="text-red underline" href={documento} target="_blank" rel="noopener">
          Abrir o documento numa janela nova
        </a>
        <a className="text-red underline" href={`${documento}?descarregar`}>
          Descarregar o PDF
        </a>
      </p>

      <section className="mt-10 border-t border-line pt-8">
        {linha.estado === "assinado" ? (
          <div>
            <h2 className="font-display text-2xl">Já assinou este documento</h2>
            <p className="mt-2 text-fg-soft">Assinado em {quando(linha.assinadoEm)}.</p>
            {concluido ? (
              <p className="mt-4">
                <a className="btn-pill btn-pill-ink" href={`${documento}?versao=assinado&descarregar`}>
                  Descarregar o documento assinado
                </a>
              </p>
            ) : (
              <p className="mt-2 text-fg-soft">Falta a assinatura de outra parte. Quando estiver completo, recebe uma cópia por email.</p>
            )}
          </div>
        ) : (
          <Assinar token={token} nome={linha.nome} email={emailEscondido(linha.email)} />
        )}
      </section>

      <p className="mt-12 max-w-[70ch] text-xs leading-relaxed text-fg-soft">
        Assinatura eletrónica simples (Regulamento (UE) n.º 910/2014, eIDAS). Ao assinar, fica registado o seu nome, o email
        confirmado com o código, a data e hora, o endereço IP e o browser, e a impressão digital do documento. Estes dados servem
        apenas como prova da assinatura e são tratados pela {CASA.legal} nos termos da sua política de privacidade.
      </p>
    </Moldura>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[920px] px-5 py-10 sm:px-8 sm:py-14">
      <a href="https://www.jelly.pt" className="mb-10 block w-fit font-display text-2xl text-red" aria-label="Jelly">
        Jelly
      </a>
      {children}
    </main>
  );
}
