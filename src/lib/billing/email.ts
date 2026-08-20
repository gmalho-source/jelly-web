import { Resend } from "resend";
import { MAGIC_LINK_TTL_SECONDS } from "./auth";

const minutes = Math.round(MAGIC_LINK_TTL_SECONDS / 60);

function template(link: string) {
  return `<!doctype html>
<html lang="pt"><body style="margin:0;background:#f4f6f8;font-family:Poppins,Helvetica,Arial,sans-serif;color:#151719">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="font:500 12px/1 'IBM Plex Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:#dd364a;padding-bottom:20px">Jelly &middot; area de prestadores</td></tr>
      <tr><td style="font:600 28px/1.15 Georgia,serif;letter-spacing:-.02em;padding-bottom:14px">O seu link de acesso</td></tr>
      <tr><td style="font-size:15px;line-height:1.6;color:#2a384a;padding-bottom:24px">Carregue no bot&atilde;o para entrar e submeter a sua fatura. O link &eacute; v&aacute;lido durante ${minutes} minutos e s&oacute; pode ser usado uma vez.</td></tr>
      <tr><td style="padding-bottom:24px"><a href="${link}" style="display:inline-block;background:#dd364a;color:#fff;text-decoration:none;font-weight:500;font-size:15px;padding:13px 24px">Entrar</a></td></tr>
      <tr><td style="font-size:13px;line-height:1.6;color:#78848f">Se n&atilde;o pediu este link, ignore este email. Problemas de acesso: pagamentos@jelly.pt</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

export async function sendMagicLinkEmail(to: string, link: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Em desenvolvimento nao ha envio: o link fica no log do servidor.
    console.info(`[billing] magic link para ${to}: ${link}`);
    return;
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: process.env.BILLING_FROM_EMAIL ?? "Jelly <pagamentos@jelly.pt>",
    to,
    subject: "O seu link de acesso a area de prestadores",
    html: template(link),
  });

  if (error) throw new Error(error.message);
}
