import type { PayloadHandler } from "payload";
import { enviaEmail } from "@/lib/email";
import { papel, corpoDeTexto } from "@/lib/email-papel";

type Candidatura = {
  id: number | string;
  name?: string | null;
  email?: string | null;
  status?: string | null;
  job?: { titlePt?: string | null } | number | null;
  emails?: { kind?: string | null }[] | null;
};

/**
 * O que se escreve a quem se candidatou, em cada estado.
 *
 * Tratamento por «tu»: é a única parte do site que fala assim, e é de
 * propósito — a casa trata o cliente por «você» e o talento por «tu».
 *
 * A rejeição é a que importa escrever bem. Diz o que é preciso dizer, não
 * inventa razões que ninguém escreveu, não deixa esperança falsa, e dá à pessoa
 * a escolha de ficar ou sair da base de dados. É o email que uma pessoa vai
 * reler; vale a pena não ser um formulário.
 */
const TEXTOS: Record<string, (nome: string, vaga: string) => { subject: string; body: string }> = {
  em_avaliacao: (nome, vaga) => ({
    subject: `A tua candidatura${vaga ? ` a ${vaga}` : ""} está em avaliação`,
    body: `Olá ${nome},

A tua candidatura${vaga ? ` a ${vaga}` : ""} está a ser avaliada pela equipa. Lemos tudo o que nos enviaste — e lemos mesmo, não é uma triagem automática.

Damos notícias dentro de duas semanas, seja qual for a decisão. Se entretanto quiseres acrescentar alguma coisa, responde a este email.

Obrigado pelo tempo que investiste nisto.

Equipa Jelly`,
  }),
  entrevista: (nome, vaga) => ({
    subject: `Queremos falar contigo${vaga ? ` sobre ${vaga}` : ""}`,
    body: `Olá ${nome},

Gostámos do que vimos e queremos conhecer-te melhor. Propomos uma conversa de 45 minutos, sem teste nem armadilhas: queremos saber o que já fizeste, como pensas, e responder às tuas perguntas sobre a Jelly.

Diz-nos dois ou três horários que te sirvam nos próximos dias e marcamos.

Até breve,
Equipa Jelly`,
  }),
  aprovado: (nome, vaga) => ({
    subject: `Boas notícias${vaga ? ` sobre ${vaga}` : ""}`,
    body: `Olá ${nome},

Queremos avançar contigo. Escrevemos nos próximos dias com a proposta e com as condições, para as poderes ler com calma antes de decidires.

Se tiveres perguntas antes disso, responde a este email.

Até já,
Equipa Jelly`,
  }),
  rejeitado: (nome, vaga) => ({
    subject: `A tua candidatura${vaga ? ` a ${vaga}` : ""}`,
    body: `Olá ${nome},

Obrigado pelo tempo que investiste na tua candidatura${vaga ? ` a ${vaga}` : ""}. Depois de a analisarmos, decidimos não avançar desta vez.

Não é um juízo sobre o teu valor: é uma escolha entre pessoas boas para um lugar só, e essas escolhas fazem-se por diferenças pequenas.

Se estiveres de acordo, guardamos a tua candidatura durante doze meses e voltamos a olhar para ela quando abrir uma vaga próxima do teu perfil. Se preferires que a apaguemos agora, responde a este email e fica feito no mesmo dia.

Desejamos-te o melhor,
Equipa Jelly`,
  }),
};

const nomeDaVaga = (candidatura: Candidatura) =>
  candidatura.job && typeof candidatura.job === "object" ? (candidatura.job.titlePt ?? "") : "";

const primeiroNome = (nome?: string | null) => (nome ?? "").trim().split(/\s+/)[0] || "olá";

/** Sessão no painel, e perfil que pode ver candidaturas. */
function porta(req: Parameters<PayloadHandler>[0]) {
  const user = req.user as { roles?: string[] | null } | null | undefined;
  if (!user) return Response.json({ error: "Sem sessão." }, { status: 401 });
  const perfis = user.roles ?? [];
  if (perfis.length && !perfis.includes("admin") && !perfis.includes("recrutamento")) {
    return Response.json({ error: "Sem perfil de recrutamento." }, { status: 403 });
  }
  return null;
}

async function candidatura(req: Parameters<PayloadHandler>[0]) {
  const id = req.routeParams?.id;
  if (!id) return null;
  return (await req.payload.findByID({ collection: "applications", id: String(id), depth: 1 })) as unknown as Candidatura;
}

/**
 * O rascunho, para quem envia poder ler e corrigir antes de sair.
 *
 * GET /api/applications/:id/email
 */
export const candidateEmailDraft: PayloadHandler = async (req) => {
  const barrado = porta(req);
  if (barrado) return barrado;

  const doc = await candidatura(req);
  if (!doc) return Response.json({ error: "Candidatura não encontrada." }, { status: 404 });

  const estado = doc.status ?? "nova";
  const modelo = TEXTOS[estado];
  if (!modelo) {
    return Response.json({ error: "Este estado não tem email para o candidato." }, { status: 400 });
  }

  const { subject, body } = modelo(primeiroNome(doc.name), nomeDaVaga(doc));
  const jaEnviado = (doc.emails ?? []).some((registo) => registo.kind === estado);
  return Response.json({ status: estado, to: doc.email, subject, body, jaEnviado });
};

/**
 * Envia, e deixa registo de quem enviou e quando.
 *
 * POST /api/applications/:id/email  { subject, body }
 */
export const sendCandidateEmail: PayloadHandler = async (req) => {
  const barrado = porta(req);
  if (barrado) return barrado;

  const doc = await candidatura(req);
  if (!doc?.email) return Response.json({ error: "Candidatura sem email." }, { status: 400 });

  const enviado = (await req.json?.()) as { subject?: string; body?: string } | undefined;
  const estado = doc.status ?? "nova";
  const modelo = TEXTOS[estado];
  const padrao = modelo ? modelo(primeiroNome(doc.name), nomeDaVaga(doc)) : null;
  const subject = (enviado?.subject ?? padrao?.subject ?? "").trim();
  const body = (enviado?.body ?? padrao?.body ?? "").trim();

  if (!subject || !body) return Response.json({ error: "Falta o assunto ou o texto." }, { status: 400 });

  const responderPara = process.env.TALENT_TO_EMAIL?.trim() || "talent@jelly.pt";

  // O que se edita no painel é texto; o papel da casa põe-se por cima no
  // momento do envio. Pedir HTML a quem está a redigir uma recusa com cuidado
  // era pedir a coisa errada — e o texto vai também, tal como foi escrito.
  const html = papel({
    locale: "pt",
    titulo: subject,
    antevisao: body.split(/\n/)[0] ?? subject,
    sobretitulo: "Jelly · Talento",
    cabeca: subject,
    corpo: corpoDeTexto(body),
    rodape: "cliente",
  });

  const enviadoAgora = await enviaEmail({
    voz: "talento",
    to: doc.email,
    replyTo: responderPara,
    subject,
    text: body,
    html,
  });
  if (!enviadoAgora.ok && enviadoAgora.via !== "log") {
    req.payload.logger.error(`email ao candidato ${doc.id}: ${enviadoAgora.erro}`);
    return Response.json({ error: enviadoAgora.erro }, { status: 502 });
  }

  const registo = {
    kind: estado,
    sentAt: new Date().toISOString(),
    sentBy: req.user?.id,
    to: doc.email,
    subject,
    body,
  };

  await req.payload.update({
    collection: "applications",
    id: String(doc.id),
    data: { emails: [...((doc.emails ?? []) as Record<string, unknown>[]), registo] },
  });

  return Response.json({ ok: true, enviadoPara: doc.email, simulado: enviadoAgora.via === "log" });
};
