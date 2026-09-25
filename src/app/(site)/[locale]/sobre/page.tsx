import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { amostraDoDia } from "@/lib/equipa";
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

/*
 * A página redesenha-se uma vez por dia.
 *
 * É estática como as outras, e as outras só se redesenham quando o painel purga
 * o site. Aqui isso não chegava: o sorteio das caras tem o dia por semente, e
 * uma página congelada no dia em que foi construída mostrava as mesmas seis
 * caras até ao deploy seguinte — que é exactamente o que isto veio resolver.
 *
 * Um dia, e não uma hora: são mais de vinte pessoas, e a casa inteira passa pela
 * chamada em poucos dias. Mudar este número muda o ritmo, nada mais.
 */
export const revalidate = 86400;

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const team = await getTeam();

  // Seis caras para a chamada da equipa, sorteadas com o dia por semente: hoje
  // estas, amanhã outras, e a mesma página para toda a gente no mesmo dia. Eram
  // as seis primeiras da lista do painel, que está por ordem de nome — as mesmas
  // seis sempre, e quinze pessoas da casa que não apareciam nunca.
  const caras = amostraDoDia(
    team.filter((membro) => membro.photo?.src),
    6,
  ).map((membro) => ({ nome: membro.name, src: membro.photo?.src }));

  const stats = [
    // Contado, não escrito: em janeiro passava a estar errado sem ninguém notar.
    // A chave era `stats.years`, e o painel guardava lá «anos de casa», que
    // tapava a frase nova. Com outro nome, a cópia antiga deixa de contar.
    { value: String(new Date().getFullYear() - FUNDACAO), label: t("stats.activity") },
    // Arredondado à dezena de baixo, com o «+»: o número exacto mudava a cada
    // entrada e saída, e a página dizia 23 num sítio e 21 noutro.
    { value: `${Math.floor(team.length / 10) * 10}+`, label: t("stats.people") },
    { value: "68", label: t("stats.projects") },
    { value: "40+", label: t("stats.clients") },
  ];

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
            // A folga à esquerda é para o número não assentar no fio que separa
            // as colunas. A primeira de cada linha não tem fio à esquerda e
            // fica encostada à margem, alinhada com o título.
            <div key={stat.label} className="bg-paper py-6 pl-6 pr-6 max-lg:odd:pl-0 lg:first:pl-0">
              <dt className="font-display text-4xl leading-none tabular-nums text-red">{stat.value}</dt>
              <dd className="mt-2 text-sm text-fg-soft">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Quem somos, em vermelho Jelly: o bloco que abria a página antiga, e
          que diz o que a casa é antes de a página mostrar quem lá trabalha.
          Junta o que eram duas secções — as ideias contra a execução, e o
          manifesto da ação — porque contam a mesma coisa por ordem: ter ideias
          não chega, o digital são pessoas, e por isso a estratégia é agir.

          A missão fica ao lado, num tom de vermelho mais fechado: é a frase que
          alguém copia para descrever a Jelly, e tem de se encontrar sem ler o
          resto. No telemóvel desce para o fim do bloco. */}
      <section className="surface-red text-paper">
        <div className="mx-auto grid max-w-[1200px] gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,34%)] lg:items-end lg:gap-16 lg:py-24">
          <div>
            <span className="eyebrow text-paper/80">{t("whoEyebrow")}</span>
            <h2 className="mt-5 max-w-[22ch] text-chapter text-paper">{t("whoTitle")}</h2>
            <div className="mt-8 max-w-[62ch] space-y-5 text-md leading-relaxed text-paper/90">
              <p>{t("whoBody")}</p>
              <p>{t("whoDigital")}</p>
            </div>
            <h3 className="mt-12 font-display text-[clamp(26px,2.6vw,36px)] leading-[1.1] text-paper">
              {t("actionTitle")}
            </h3>
            <p className="mt-4 max-w-[62ch] text-md leading-relaxed text-paper/90">{t("actionBody")}</p>
          </div>
          <aside className="rounded-[10px] bg-ink/12 p-7 sm:p-8">
            <span className="eyebrow text-paper/75">{t("missionEyebrow")}</span>
            <p className="mt-4 text-lg leading-[1.45] text-paper">{t("mission")}</p>
          </aside>
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
          {/* Dez pixéis entre os quadrados, que é o mesmo intervalo dos cartões da
              página da equipa — as duas páginas mostram a mesma gente e passam a
              respirar igual. Era `gap-px` sobre `bg-paper-3`, o fio de um pixel
              que a casa usa nas grelhas de texto aqui ao lado: entre fotografias
              lia-se como uma tira contínua de caras coladas. Sem o fundo no `ul`,
              porque a esta distância deixava de ser um fio e passava a ser uma
              faixa cinzenta; fica só por baixo de cada quadrado, à espera da
              fotografia. */}
          <ul aria-hidden="true" className="mt-8 grid grid-cols-3 gap-[10px] sm:grid-cols-6">
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
          {/* As vagas em vermelho: é o convite da página, e ao lado do cartão
              chartreuse dos projetos são as duas portas que se vêem primeiro. */}
          <Link href="/recrutamento" className="card flex flex-col justify-between bg-red p-8 text-paper shadow-none">
            <div>
              <h3 className="text-xl text-paper">{t("careersTitle")}</h3>
              <p className="mt-3 text-sm text-paper/85">{t("careersLead")}</p>
            </div>
            <span className="mt-6 text-sm font-semibold text-paper">{t("careersLink")} →</span>
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
