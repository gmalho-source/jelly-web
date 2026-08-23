import { SITE_URL } from "@/lib/seo";

/**
 * O papel de carta da casa: o que envolve qualquer email que o site envie.
 *
 * Um email não é uma página. Não há folha de estilos, não há fontes da casa
 * — nenhum cliente de email carrega uma —, metade das caixas começa com as
 * imagens desligadas e o Outlook ainda desenha tabelas. Por isso: tabelas,
 * estilos na linha, uma fonte que exista em qualquer máquina, e um desenho que
 * continua a ler-se com o logótipo em falta.
 *
 * O logótipo é servido pelo próprio site (`/brand/…-email.png`) e leva ao site.
 * Um PNG e não o SVG que a casa usa nas páginas: o Gmail não desenha SVG.
 */

const RED = "#dd364a";
const INK = "#151719";
const PAPER = "#f4f6f8";
const TEXTO = "#2a384a";
const SUAVE = "#78848f";
const LINHA = "#e2e6ea";

const SANS = "Poppins,-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
const SERIF = "Georgia,'Times New Roman',serif";

/** Texto de fora nunca entra em bruto no HTML. */
export function escapa(valor: string): string {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Parágrafos e mudanças de linha do que a pessoa escreveu, sem lhe tocar. */
function paragrafos(valor: string): string {
  return escapa(valor).replace(/\r?\n/g, "<br>");
}

export type Papel = {
  locale: "pt" | "en";
  /** Assunto — repetido no <title>, que alguns clientes mostram. */
  titulo: string;
  /** A linha de pré-visualização na lista da caixa de entrada. */
  antevisao: string;
  /** Sobretítulo curto, em maiúsculas. */
  sobretitulo: string;
  /** O título grande. */
  cabeca: string;
  /** O corpo, já em HTML. */
  corpo: string;
};

const RODAPE = {
  pt: {
    porque: "Recebeu este email porque enviou uma mensagem em",
    forma: "jelly.pt/contactos",
    contactos: "/contactos",
    privacidade: "Política de privacidade",
    talento: "Candidaturas",
  },
  en: {
    porque: "You received this email because you sent us a message at",
    forma: "jelly.pt/en/contact",
    contactos: "/en/contact",
    privacidade: "Privacy policy",
    talento: "Careers",
  },
} as const;

export function papel({ locale, titulo, antevisao, sobretitulo, cabeca, corpo }: Papel): string {
  const r = RODAPE[locale];
  const prefixo = locale === "pt" ? "" : "/en";
  const privacidade = `${SITE_URL}${prefixo}/legal/politica-de-privacidade-2`;

  return `<!doctype html>
<html lang="${locale}" style="margin:0;padding:0">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapa(titulo)}</title>
<style>
  /* O pouco que quase todos os clientes respeitam: o telefone e os links. */
  a { color: ${RED}; }
  @media (max-width: 620px) {
    .caixa { padding: 28px 22px !important; }
    .cabeca { font-size: 26px !important; line-height: 1.2 !important; }
    .margem { padding: 20px 14px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${PAPER};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">

<!-- A linha que a caixa de entrada mostra ao lado do assunto. Sem isto, mostra
     as primeiras palavras do email, que são as do logótipo. -->
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${escapa(antevisao)}&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;</div>

<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background:${PAPER}">
<tr><td align="center" class="margem" style="padding:32px 16px 40px">

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;width:100%">

    <!-- Logótipo. Leva ao site, e o texto alternativo faz o trabalho quando as
         imagens vêm desligadas — que é como metade das caixas abre. -->
    <tr><td style="padding:0 4px 22px">
      <a href="${SITE_URL}" style="text-decoration:none;display:inline-block">
        <img src="${SITE_URL}/brand/jelly-wordmark-red-email.png" width="108" height="41" alt="Jelly"
             style="display:block;width:108px;height:41px;border:0;outline:none;text-decoration:none;font:700 26px/41px ${SERIF};color:${RED}">
      </a>
    </td></tr>

    <tr><td class="caixa" style="background:#ffffff;border-radius:14px;padding:40px 40px 36px">

      <p style="margin:0 0 18px;font:600 11px/1.4 ${SANS};letter-spacing:.14em;text-transform:uppercase;color:${RED}">${escapa(sobretitulo)}</p>

      <h1 class="cabeca" style="margin:0 0 22px;font:600 30px/1.15 ${SERIF};letter-spacing:-.02em;color:${INK};mso-line-height-rule:exactly">${escapa(cabeca)}</h1>

      ${corpo}

    </td></tr>

    <!-- Identificação e contactos. -->
    <tr><td style="padding:30px 8px 0">
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr><td style="border-top:1px solid ${LINHA};padding-top:22px">

          <p style="margin:0 0 10px;font:600 13px/1.5 ${SANS};color:${INK}">Jelly &middot; Digital Agency</p>

          <p style="margin:0 0 14px;font:400 13px/1.7 ${SANS};color:${SUAVE}">
            Rua Dom Jo&atilde;o V, 29C &middot; 1250-091 Lisboa &middot; Portugal<br>
            <a href="mailto:hello@jelly.pt" style="color:${TEXTO};text-decoration:none">hello@jelly.pt</a>
            &nbsp;&middot;&nbsp;
            <a href="${SITE_URL}" style="color:${TEXTO};text-decoration:none">www.jelly.pt</a>
            &nbsp;&middot;&nbsp;
            <a href="mailto:talent@jelly.pt" style="color:${TEXTO};text-decoration:none">${r.talento}: talent@jelly.pt</a>
          </p>

          <p style="margin:0;font:400 12px/1.6 ${SANS};color:${SUAVE}">
            ${r.porque} <a href="${SITE_URL}${r.contactos}" style="color:${SUAVE}">${r.forma}</a>.
            <a href="${privacidade}" style="color:${SUAVE}">${r.privacidade}</a>.
          </p>

        </td></tr>
      </table>
    </td></tr>

  </table>

</td></tr>
</table>
</body>
</html>`;
}

/** Um parágrafo do corpo, com o estilo já posto. */
export function p(html: string, margem = "0 0 18px"): string {
  return `<p style="margin:${margem};font:400 15px/1.7 ${SANS};color:${TEXTO}">${html}</p>`;
}

/**
 * O recibo: o que a pessoa escreveu, devolvido.
 *
 * É a parte que o email antigo não tinha e que mais falta faz — quem envia um
 * briefing por um formulário fica sem cópia dele, e a única prova de que
 * chegou como devia é vê-lo de volta.
 */
export function recibo(titulo: string, linhas: { rotulo: string; valor: string }[], mensagem: string): string {
  const campos = linhas
    .filter((linha) => linha.valor)
    .map(
      (linha) =>
        `<tr>
          <td style="padding:0 14px 8px 0;font:600 12px/1.5 ${SANS};color:${SUAVE};white-space:nowrap;vertical-align:top;width:1%">${escapa(linha.rotulo)}</td>
          <td style="padding:0 0 8px;font:400 14px/1.5 ${SANS};color:${INK};vertical-align:top">${escapa(linha.valor)}</td>
        </tr>`,
    )
    .join("");

  return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 26px">
  <tr><td style="background:${PAPER};border-left:3px solid ${RED};border-radius:0 8px 8px 0;padding:20px 22px">
    <p style="margin:0 0 14px;font:600 11px/1.4 ${SANS};letter-spacing:.12em;text-transform:uppercase;color:${SUAVE}">${escapa(titulo)}</p>
    ${campos ? `<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px">${campos}</table>` : ""}
    <p style="margin:0;font:400 15px/1.7 ${SANS};color:${TEXTO}">${paragrafos(mensagem)}</p>
  </td></tr>
</table>`;
}
