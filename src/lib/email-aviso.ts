import { papel, p, recibo, escapa, botao } from "@/lib/email-papel";
import { SITE_URL } from "@/lib/seo";

/**
 * O aviso que chega à casa quando alguém escreve pela página de contactos.
 *
 * Era texto simples, e um briefing em texto simples obriga a ir ao painel para
 * ver o essencial — o email da pessoa não é clicável e o ficheiro que ela
 * anexou não se sabe onde está. Agora traz o ficheiro consigo e dois caminhos:
 * o registo no painel e o próprio briefing.
 *
 * O link do briefing é protegido: a caixa dos anexos só se lê com sessão no
 * painel. É de propósito. Um email reencaminha-se sem se pensar, e um briefing
 * de cliente atrás de um endereço aberto sai da casa com ele.
 */

export type Aviso = {
  nome: string;
  empresa: string;
  email: string;
  /** A janela de arranque, em português. */
  janela: string;
  mensagem: string;
  /** O registo na base, para se abrir no painel. */
  mensagemId?: string | number;
  briefing?: {
    nome: string;
    url: string;
    bytes: number;
    /** Verdadeiro quando o ficheiro segue com o email. */
    segue: boolean;
  };
};

const kb = (bytes: number) =>
  bytes >= 1_000_000 ? `${(bytes / 1_000_000).toFixed(1)} MB` : `${Math.round(bytes / 1000)} KB`;

/** Um endereço do painel ou do ficheiro pode vir relativo; o email precisa dele inteiro. */
export const absoluto = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

export function avisoDeContacto({ nome, empresa, email, janela, mensagem, mensagemId, briefing }: Aviso) {
  const assunto = `Briefing de ${nome}${empresa ? ` (${empresa})` : ""}`;

  const acoes = [
    mensagemId ? botao(`${SITE_URL}/admin/collections/messages/${mensagemId}`, "Ver no painel") : "",
    briefing ? botao(absoluto(briefing.url), "Abrir o briefing", false) : "",
  ]
    .filter(Boolean)
    .join("\n");

  const corpo = [
    recibo(
      "Quem escreveu",
      [
        { rotulo: "Nome", valor: nome },
        { rotulo: "Empresa", valor: empresa },
        { rotulo: "Email", valor: email },
        { rotulo: "Arranque", valor: janela },
      ],
      mensagem,
    ),
    briefing
      ? p(
          briefing.segue
            ? `Vai em anexo: <strong>${escapa(briefing.nome)}</strong> (${kb(briefing.bytes)}). Está também guardado no painel.`
            : `O briefing — <strong>${escapa(briefing.nome)}</strong>, ${kb(briefing.bytes)} — é grande para seguir por email. Abre-se no painel.`,
        )
      : "",
    acoes,
    p(`Para responder, basta responder a este email: vai para <a href="mailto:${escapa(email)}" style="color:#dd364a">${escapa(email)}</a>.`, "24px 0 0"),
  ]
    .filter(Boolean)
    .join("\n");

  const html = papel({
    locale: "pt",
    titulo: assunto,
    antevisao: `${empresa || nome}: ${mensagem.slice(0, 90)}`,
    sobretitulo: "Briefing novo",
    cabeca: nome,
    corpo,
    rodape: "interno",
  });

  const texto = [
    `Nome: ${nome}`,
    `Empresa ou marca: ${empresa || "—"}`,
    `Email: ${email}`,
    `Quer arrancar: ${janela || "—"}`,
    "",
    mensagem,
    "",
    briefing
      ? `Briefing: ${briefing.nome} (${kb(briefing.bytes)})${briefing.segue ? ", em anexo" : ""}\n${absoluto(briefing.url)}`
      : null,
    mensagemId ? `No painel: ${SITE_URL}/admin/collections/messages/${mensagemId}` : null,
  ]
    .filter((linha): linha is string => linha !== null)
    .join("\n");

  return { subject: assunto, html, text: texto };
}
