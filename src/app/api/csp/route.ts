/**
 * Onde chegam os avisos da Content-Security-Policy, enquanto está em modo de
 * relatório (ver `headers()` no `next.config.ts`).
 *
 * Não se guarda nada: cada aviso vira uma linha nos registos da Vercel, com o
 * que seria bloqueado, a regra e a página. É o que chega para afinar a lista
 * antes de a política passar a valer. Corpo limitado e resposta vazia: isto é
 * um endereço público, e não tem de ser útil a mais ninguém.
 */
export async function POST(request: Request) {
  const texto = (await request.text()).slice(0, 8000);
  try {
    const corpo = JSON.parse(texto) as Record<string, unknown>;
    // `report-uri` manda { "csp-report": {...} }; `report-to` manda uma lista.
    const avisos = Array.isArray(corpo) ? corpo.map((item) => item?.body) : [corpo["csp-report"]];
    for (const aviso of avisos.slice(0, 20)) {
      const a = (aviso ?? {}) as Record<string, unknown>;
      console.warn(
        "[csp]",
        a["effective-directive"] ?? a.effectiveDirective ?? a["violated-directive"],
        a["blocked-uri"] ?? a.blockedURL,
        "em",
        a["document-uri"] ?? a.documentURL,
      );
    }
  } catch {
    // Um corpo que não se lê não é um aviso.
  }
  return new Response(null, { status: 204 });
}
