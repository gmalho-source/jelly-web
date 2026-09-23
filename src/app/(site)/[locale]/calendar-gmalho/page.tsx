import type { Metadata } from "next";
import Image from "next/image";
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
    assinatura: "Gonçalo Malho Rodrigues",
    iframe: "Marcação de reuniões com Gonçalo Malho Rodrigues",
    retrato: "Retrato de Gonçalo Malho Rodrigues",
    aCarregar: "A carregar o calendário…",
    fallback: "O calendário não abre? Abra-o numa janela nova",
  },
  en: {
    eyebrow: "Book a meeting",
    titulo: "Pick a time to talk",
    lead: "The slots below are the ones I have free. Choose whichever suits you and the invitation arrives by email, with the video call link already in it.",
    assinatura: "Gonçalo Malho Rodrigues",
    iframe: "Meeting scheduling with Gonçalo Malho Rodrigues",
    retrato: "Portrait of Gonçalo Malho Rodrigues",
    aCarregar: "Loading the calendar…",
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
      {/* O retrato ao lado do texto, e não por cima: quem abre o link foi
          convidado por uma pessoa, e é a cara dessa pessoa que confirma que
          chegou ao sítio certo. Redondo porque é um retrato, não uma
          fotografia de página. */}
      <div className="flex flex-col gap-7 sm:flex-row sm:items-center sm:gap-10">
        <Image
          src="/media/equipa/goncalo-malho-rodrigues-redondo.webp"
          alt={copy.retrato}
          width={640}
          height={640}
          priority
          sizes="(min-width: 640px) 160px, 112px"
          className="h-28 w-28 shrink-0 rounded-full object-cover sm:h-40 sm:w-40"
        />
        <div className="min-w-0">
          <span className="eyebrow">{copy.eyebrow}</span>
          {/* `chapter` e não `display`: isto é uma página de serviço para um
              link, não um herói. Ao tamanho do herói, o título empurrava o
              retrato para um canto e o calendário para fora do ecrã. */}
          <h1 className="mt-4 text-chapter">{copy.titulo}</h1>
          <p className="subtitle mt-4 max-w-[52ch] text-fg-soft">{copy.lead}</p>
          <p className="mt-2 text-sm text-fg-soft">{copy.assinatura}</p>
        </div>
      </div>

      {/* A ligação adiantada ao domínio do Google. A moldura só começa a pedir
          a página depois de o browser a desenhar, e aí paga DNS, ligação e TLS
          a um domínio que ainda não conhece — num telemóvel são centenas de
          milissegundos antes do primeiro byte do calendário. */}
      <link rel="preconnect" href="https://calendar.google.com" />

      {/* O aviso fica por baixo da moldura, não dentro: uma moldura vazia é
          transparente, por isso lê-se enquanto o Google não pinta, e desaparece
          sozinho quando ele pinta. Sem um só byte de JavaScript. */}
      <div className="relative mt-10 overflow-hidden rounded-2xl bg-paper-2">
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm text-ink/60">
          {copy.aCarregar}
        </p>
        <iframe
          src={`${AGENDA}?gv=true`}
          title={copy.iframe}
          className="relative block h-[680px] w-full border-0 sm:h-[720px]"
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
