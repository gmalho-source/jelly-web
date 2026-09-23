import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";

/** O horário do Google, tal como ele o serve. Muda-se aqui e em mais lado nenhum. */
const AGENDA =
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2SVcHT3HV_0lm_NehOJHsZtPKaa1_rUbX3R25LGSbl9ZEJ_db83z_WN_pGiPS_xQA5IqkIaRY9";

const COPY = {
  pt: {
    eyebrow: "Marcar reunião",
    titulo: "Escolha uma hora para falarmos",
    lead: "Os horários em baixo são os que tenho livres. Escolha o que lhe der jeito e recebe o convite por email, já com a ligação para a videochamada.",
    assinatura: "Gonçalo Malho Rodrigues, Founder & CEO da Jelly",
    iframe: "Marcação de reuniões com Gonçalo Malho Rodrigues",
    fallback: "O calendário não abre? Abra-o numa janela nova",
  },
  en: {
    eyebrow: "Book a meeting",
    titulo: "Pick a time to talk",
    lead: "The slots below are the ones I have free. Choose whichever suits you and the invitation arrives by email, with the video call link already in it.",
    assinatura: "Gonçalo Malho Rodrigues, Founder & CEO at Jelly",
    iframe: "Meeting scheduling with Gonçalo Malho Rodrigues",
    fallback: "Calendar not loading? Open it in a new window",
  },
} as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const copy = COPY[locale];
  return {
    title: copy.eyebrow,
    description: copy.lead,
    alternates: alternates("/calendar-gmalho", locale),
    // Fora do índice e fora do mapa do site: é um endereço que se dá a quem se
    // quer, não uma porta da casa. Aparecer em pesquisas só traria marcações
    // de quem não foi convidado a marcar.
    robots: { index: false, follow: false },
  };
}

/**
 * A página de marcação de reuniões com o Gonçalo.
 *
 * É o link que vai nos emails e nas propostas, e por isso a página faz uma
 * coisa só: mostra o horário do Google e sai da frente. O que é nosso é a
 * moldura — a casa onde a pessoa aterra tem de ser reconhecível, ou o link
 * parece de outra gente.
 *
 * O `iframe` é de terceiros e o bloqueio automático da Iubenda pode segurá-lo
 * até haver consentimento; é para isso que existe a ligação por baixo, que
 * abre o mesmo horário numa janela do Google e funciona sempre.
 */
export default async function CalendarioPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const copy = COPY[locale];

  return (
    <section data-pagina="calendar-gmalho" className="mx-auto max-w-[900px] px-5 py-16 sm:px-8 lg:py-24">
      <span className="eyebrow">{copy.eyebrow}</span>
      <h1 className="mt-5 text-display">{copy.titulo}</h1>
      <p className="subtitle mt-5 max-w-[52ch] text-fg-soft">{copy.lead}</p>
      <p className="mt-2 text-sm text-fg-soft">{copy.assinatura}</p>

      <div className="mt-10 overflow-hidden rounded-2xl bg-paper-2">
        <iframe
          src={`${AGENDA}?gv=true`}
          title={copy.iframe}
          className="block h-[680px] w-full border-0 sm:h-[720px]"
        />
      </div>

      <p className="mt-4 text-sm">
        <a href={AGENDA} target="_blank" rel="noopener noreferrer" className="text-red underline underline-offset-4">
          {copy.fallback}
        </a>
      </p>
    </section>
  );
}
