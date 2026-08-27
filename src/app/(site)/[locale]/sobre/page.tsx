import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { alternates } from "@/lib/seo";
import Image from "next/image";
import { getTeam } from "@/lib/cms";
import { fonteDeVideo } from "@/lib/video";
import { VideoEmbed } from "@/components/VideoEmbed";

/** O ano em que a casa abriu. Os anos de casa contam-se daqui, não à mão. */
const FUNDACAO = 2010;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("eyebrow"), description: t("credoLead"), alternates: alternates("/sobre", locale) };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const team = await getTeam();

  // Seis caras para a chamada da equipa. As primeiras da lista, que é a ordem
  // que o painel define.
  const caras = team
    .filter((membro) => membro.photo?.src)
    .slice(0, 6)
    .map((membro) => ({ nome: membro.name, src: membro.photo?.src }));

  const stats = [
    // Contado, não escrito: em janeiro passava a estar errado sem ninguém notar.
    { value: String(new Date().getFullYear() - FUNDACAO), label: t("stats.years") },
    { value: String(team.length), label: t("stats.people") },
    { value: "68", label: t("stats.projects") },
    { value: "40+", label: t("stats.clients") },
  ];

  const qualidades = (["creativity", "resilience", "flexibility"] as const).map((chave) => ({
    titulo: t(`qualities.${chave}`),
    corpo: t(`qualities.${chave}Body`),
  }));

  const video = fonteDeVideo(t("video"));

  return (
    <div className="surface-paper">
      {/* O credo primeiro, e em inglês, como está na parede da casa e no rodapé
          do site. A frase portuguesa por baixo é que o explica. */}
      <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow">{t("eyebrow")}</span>
            <h1 className="mt-5 text-display">{t("credo")}</h1>
          </div>
          <p className="subtitle">{t("credoLead")}</p>
        </div>
        <dl className="mt-14 grid grid-cols-2 gap-px bg-paper-3 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-paper py-6 pr-6">
              <dt className="font-display text-4xl leading-none tabular-nums text-red">{stat.value}</dt>
              <dd className="mt-2 text-sm text-fg-soft">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Ideias contra execução, e as três palavras que a casa usa para dizer o
          que é preciso para atravessar o meio. Vêm da página antiga, e são a
          coisa mais própria que lá estava escrita. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <div className="border-t border-line pt-14">
          <h2 className="max-w-[24ch] text-chapter">{t("ideasTitle")}</h2>
          <p className="mt-5 max-w-[62ch] text-md text-fg-soft">{t("ideasBody")}</p>
          <dl className="mt-12 grid gap-px bg-paper-3 sm:grid-cols-3">
            {qualidades.map((qualidade) => (
              <div key={qualidade.titulo} className="bg-paper p-6 pl-0 sm:pl-6 sm:first:pl-0">
                <dt className="font-display text-xl text-red">{qualidade.titulo}</dt>
                <dd className="mt-2 max-w-[34ch] text-sm text-fg-soft">{qualidade.corpo}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* O manifesto: a frase que dá o nome ao bloco vermelho da homepage. */}
      <section className="surface-ink py-16 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] items-end gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
          <div>
            <span className="eyebrow text-chartreuse">{t("manifestoEyebrow")}</span>
            <h2 className="mt-4 max-w-[22ch] text-chapter text-paper">{t("actionTitle")}</h2>
          </div>
          <p className="text-md text-paper/75">{t("actionBody")}</p>
        </div>
      </section>

      {/* O vídeo da casa, com fachada: nada do YouTube carrega antes de alguém
          querer ver. O endereço vive na copy, e por isso troca-se no painel. */}
      {video ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
          <span className="eyebrow text-fg-soft">{t("videoLabel")}</span>
          <div className="mt-5 max-w-[900px]">
            <VideoEmbed fonte={video} titulo={t("videoLabel")} />
          </div>
        </section>
      ) : null}

      {/* A equipa tem página própria: aqui fica a chamada, com as caras a
          servirem de convite. A lista de nomes que estava aqui era uma lista. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <Link href="/equipa" className="group block border-t border-line pt-14">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-chapter">{t("teamTitle")}</h2>
              <p className="mt-3 max-w-[46ch] text-md text-fg-soft">{t("teamLead")}</p>
            </div>
            <span className="text-sm font-semibold text-red group-hover:underline">{t("teamLink")} →</span>
          </div>
          <ul aria-hidden="true" className="mt-8 grid grid-cols-3 gap-px bg-paper-3 sm:grid-cols-6">
            {caras.map((cara) => (
              <li key={cara.nome} className="relative aspect-square overflow-clip bg-paper-3">
                {cara.src ? (
                  <Image
                    src={cara.src}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 33vw, 16vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </Link>
      </section>

      {/* Três saídas, e duas delas são portas: quem lê isto até ao fim quer ver
          o trabalho, quer trabalhar aqui, ou tem um problema para resolver. */}
      <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="card p-8">
            <h3 className="text-xl">{t("method")}</h3>
            <p className="mt-3 text-sm text-fg-soft">{t("methodBody")}</p>
          </div>
          <Link href="/recrutamento" className="card flex flex-col justify-between p-8">
            <div>
              <h3 className="text-xl">{t("careersTitle")}</h3>
              <p className="mt-3 text-sm text-fg-soft">{t("careersLead")}</p>
            </div>
            <span className="mt-6 text-sm font-semibold text-red">{t("careersLink")} →</span>
          </Link>
          <Link href="/projetos" className="card flex flex-col justify-between bg-chartreuse p-8 shadow-none">
            <div>
              <h3 className="text-xl">{t("workTitle")}</h3>
              <p className="mt-3 text-sm text-ink/70">{t("workLead")}</p>
            </div>
            <span className="mt-6 text-sm font-semibold text-red-deep">{t("workLink")} →</span>
          </Link>
        </div>
      </section>

      {/* O fim da página antiga era uma pergunta. Fica a ser. */}
      <section className="surface-red">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-6 px-5 py-14 sm:px-8">
          <h2 className="max-w-[20ch] text-chapter text-paper">{t("ctaTitle")}</h2>
          <Link href="/contactos" className="btn-pill w-fit">
            {t("ctaButton")}
          </Link>
        </div>
      </section>
    </div>
  );
}
