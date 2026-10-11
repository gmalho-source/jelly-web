import { chaveValida } from "@/lib/assinaturas/link";
import { CASA } from "@/lib/email-papel";
import { cms } from "../../[token]/comum";
import { Moldura } from "../../Moldura";
import { FormularioNda } from "./FormularioNda";

export const dynamic = "force-dynamic";

/**
 * O link fixo do NDA. Quem o recebeu escreve os seus dados, e daqui segue para
 * a página de assinatura de sempre, com o NDA já preenchido. A chave no
 * endereço é o que deixa entrar: sem ela, ou com o link desligado no painel,
 * a página diz que não está disponível.
 */
export default async function Pagina({ params }: { params: Promise<{ chave: string }> }) {
  const { chave } = await params;
  if (!(await chaveValida(await cms(), chave))) {
    return (
      <Moldura>
        <h1 className="font-display text-[clamp(28px,4vw,40px)] leading-tight">Este link não está disponível</h1>
        <p className="mt-4 max-w-[56ch] text-fg-soft">Pode ter sido substituído por um novo. Peça o link atual a quem lho enviou.</p>
        <p className="mt-6 text-sm text-fg-soft">
          Dúvidas: <a className="text-red underline" href={`mailto:${CASA.email}`}>{CASA.email}</a>
        </p>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <span className="eyebrow text-red">Acordo de confidencialidade · {CASA.legal}</span>
      <h1 className="mt-3 font-display text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">Os seus dados para o NDA</h1>
      <p className="mt-4 max-w-[62ch] text-fg-soft">
        Antes de trabalhar connosco em projetos de clientes, pedimos-lhe que assine o nosso acordo de confidencialidade. Escreva os
        seus dados como estão no seu documento de identificação: o NDA sai preenchido com eles. No passo seguinte lê o documento
        inteiro e assina, com um código que enviamos para o seu email.
      </p>
      <FormularioNda chave={chave} />
      <p className="mt-12 max-w-[70ch] text-xs leading-relaxed text-fg-soft">
        Estes dados servem para preparar e assinar o acordo de confidencialidade e para a sua ficha de prestador de serviços na{" "}
        {CASA.legal}, que os trata nos termos da sua{" "}
        <a className="underline" href="https://www.jelly.pt/legal/politica-de-privacidade-2" target="_blank" rel="noopener">
          política de privacidade
        </a>
        . Ao assinar fica registado o seu nome, o email confirmado com o código, a data e hora, o endereço IP e o browser.
      </p>
    </Moldura>
  );
}
