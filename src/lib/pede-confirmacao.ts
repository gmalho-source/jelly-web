import { enviaEmail } from "@/lib/email";
import { cartaDeConfirmacao } from "@/lib/email-confirmacao";
import { DIAS_DE_VALIDADE, chaveNova, enderecoDaConfirmacao, resumoDaChave } from "@/lib/confirmacao";
import { SITE_URL } from "@/lib/seo";

/**
 * Pedir a confirmação a quem se candidatou — o gesto partilhado pelas duas
 * portas.
 *
 * Na porta do email sai sozinho: ninguém falou com a pessoa, e o consentimento
 * tem de vir dela. Na porta do painel fica a um clique, porque um currículo
 * entregue em mão pode já ter vindo com autorização, e um email automático a
 * pedir «confirma os teus dados» seria estranho a quem acabou de o entregar.
 *
 * Guarda o resumo da chave, não a chave. Regravar o pedido gera uma chave nova
 * e invalida a anterior: se o primeiro email se perdeu, o segundo manda.
 */
type Ficha = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  job?: unknown;
};

type Payload = {
  update: (args: { collection: "applications"; id: number | string; data: Record<string, unknown> }) => Promise<unknown>;
};

const tituloDaVaga = (job: unknown): string | undefined => {
  if (job && typeof job === "object" && "titlePt" in job) {
    const titulo = String((job as { titlePt?: string }).titlePt ?? "").trim();
    return titulo || undefined;
  }
  return undefined;
};

export async function pedeConfirmacao(
  payload: Payload,
  ficha: Ficha,
  locale: "pt" | "en" = "pt",
): Promise<{ ok: boolean; erro?: string }> {
  const email = String(ficha.email ?? "").trim();
  if (!email || !email.includes("@")) return { ok: false, erro: "a ficha não tem email" };

  const chave = chaveNova();
  const agora = new Date().toISOString();

  await payload.update({
    collection: "applications",
    id: ficha.id,
    data: { confirmTokenHash: resumoDaChave(chave), confirmSentAt: agora },
  });

  const carta = cartaDeConfirmacao({
    locale,
    nome: String(ficha.name ?? "").trim() || email,
    email,
    telefone: String(ficha.phone ?? "").trim() || undefined,
    cidade: String(ficha.city ?? "").trim() || undefined,
    vaga: tituloDaVaga(ficha.job),
    endereco: enderecoDaConfirmacao(SITE_URL, chave, locale),
    dias: DIAS_DE_VALIDADE,
  });

  const saiu = await enviaEmail({
    to: email,
    subject: carta.subject,
    html: carta.html,
    text: carta.text,
    voz: "talento",
  }).catch((erro) => ({ ok: false, erro: erro instanceof Error ? erro.message : String(erro) }));

  // A chave fica gravada mesmo que o email não saia: assim o pedido pode ser
  // repetido sem se perder o rasto de que já se tentou.
  return saiu.ok ? { ok: true } : { ok: false, erro: saiu.erro ?? "o email não saiu" };
}
