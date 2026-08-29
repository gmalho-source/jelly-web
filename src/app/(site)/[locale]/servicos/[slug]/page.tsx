import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { ServiceHero } from "@/components/ServiceHero";
import { getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const services = await getServices();
  return services.map((service) => ({ slug: slugFor(service, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.name[locale],
    description: service.claim[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: slugFor(service, candidate) } }),
      locale,
    ),
  };
}

export default async function ServicePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const service = await getService(slug);
  if (!service) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  const canonico = slugFor(service, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/servicos/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("services");
  const [cases, all] = await Promise.all([getProjectsBySlugs(service.caseSlugs), getServices()]);
  const others = all.filter((item) => item.slug !== service.slug);
  const accent = service.accent === "lavender";

  /*
   * A cor da espinha das fases. Cada serviço tem o seu acento, e o vermelho da
   * casa serve quem não tiver nenhum.
   *
   * As classes vão escritas por inteiro porque o Tailwind lê o código à procura
   * delas — uma classe montada com um template não existe na folha de estilos.
   * E a cor do contorno entra por variável e não por uma classe de cor:
   * `type-outline` põe o `color` a transparente, e uma classe `text-…` a seguir
   * ganhava-lhe e enchia o número.
   */
  const espinha = {
    lavender: { fio: "to-lavender", contorno: "[--outline-color:var(--color-lavender)]" },
    chartreuse: { fio: "to-chartreuse", contorno: "[--outline-color:var(--color-chartreuse)]" },
    coral: { fio: "to-coral", contorno: "[--outline-color:var(--color-coral)]" },
    // Sem acento, a espinha vai do vermelho ao vermelho fundo.
    nenhum: { fio: "to-red-deep", contorno: "[--outline-color:var(--color-red)]" },
  }[service.accent ?? "nenhum"];
  const { fio, contorno } = espinha;

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {t("cta")} <span aria-hidden="true">→</span>
    </Link>
  );

  // Em papel a pílula é escura; sobre o vídeo e sobre ink é clara.
  const chamadaClara = (
    <Link href="/contactos" className="btn-pill btn-pill-ink">
      {t("cta")} <span aria-hidden="true">→</span>
    </Link>
  );

  return (
    <div className="surface-paper">
      {/* Com vídeo de topo o serviço abre em cheio; sem ele, abre como sempre
          abriu. As duas formas convivem: nem toda a página precisa de teatro. */}
      {service.heroVideo || service.heroPoster ? (
        <ServiceHero
          eyebrow={t("eyebrow")}
          title={service.heroTitle?.[locale] || service.name[locale]}
          claim={service.claim[locale]}
          video={service.heroVideo}
          poster={service.heroPoster}
          height={service.heroHeight}
          cta={chamada}
        />
      ) : (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,58%)_minmax(0,36%)] lg:justify-between lg:gap-14">
            <div>
              <span className="eyebrow">{t("eyebrow")}</span>
              <h1 className="mt-5 text-display">{service.name[locale]}</h1>
            </div>
            <div>
              <p className="subtitle">{service.claim[locale]}</p>
              <div className="mt-6">{chamadaClara}</div>
            </div>
          </div>
        </section>
      )}

      {/* A frase que dá a volta: primeira linha afirma, segunda vira. */}
      {service.statement ? (
        <section className="surface-red py-16 lg:py-24">
          {/* Esta faixa fica logo a seguir ao topo, e num ecrã de portátil está
              à vista mal a página abre. Por isso não leva a coreografia do
              `statement-in`, que é a da Imunidade: lá a faixa está abaixo da
              dobra e as três peças entram por ordem — a afirmação, o fio, a
              volta; aqui a última linha ficava invisível à chegada, à espera de
              um scroll que ainda não aconteceu. Medido: opacidade 0 com a faixa
              inteira dentro do ecrã. Uma frase que não se lê não é um efeito. */}
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <p className="max-w-[26ch] font-display text-[clamp(30px,5vw,72px)] leading-[1.0] tracking-[-0.025em]">
              {service.statement.first[locale]}
            </p>
            <span aria-hidden="true" className="mt-8 block h-px w-full max-w-[420px] bg-ink/30" />
            <p className="mt-8 max-w-[34ch] font-display text-[clamp(20px,2.6vw,34px)] leading-[1.14] text-fg-soft">
              {service.statement.second[locale]}
            </p>
          </div>
        </section>
      ) : null}

      {service.areas?.length ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="eyebrow">{t("areas")}</h2>
          {/* Numa grelha de duas colunas as duas da mesma linha estão à mesma
              altura e chegariam juntas: a da direita chega um compasso depois.
              As linhas seguintes escalonam-se sozinhas — cada uma tem a sua
              linha do tempo, e a posição na página faz o resto. */}
          <div className="mt-8 grid gap-px border-t border-line bg-line sm:grid-cols-2">
            {service.areas.map((area, indice) => (
              <div
                key={area.title.pt}
                className={`surface-paper flex flex-col gap-3 px-0 py-7 sm:px-7 ${indice % 2 ? "entra-tarde" : "entra"}`}
              >
                <h3 className="max-w-[26ch] text-xl">{area.title[locale]}</h3>
                <p className="max-w-[46ch] text-md text-fg-soft">{area.body[locale]}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {service.promise ? (
        <section className={`py-14 lg:py-20 ${accent ? "surface-accent-lavender" : "surface-ink"}`}>
          <div className="entra mx-auto max-w-[1200px] px-5 sm:px-8">
            <span className={`eyebrow ${accent ? "text-red-deep" : "text-chartreuse"}`}>{t("promise")}</span>
            <p className="mt-4 max-w-[34ch] font-display text-chapter text-fg">
              {service.promise[locale]}
            </p>
          </div>
        </section>
      ) : null}

      {/* Numa página longa as áreas já disseram o que inclui; aqui entra o
          texto, que é o que falta dizer. */}
      <section className="mx-auto max-w-[1200px] px-5 pt-16 sm:px-8">
        {service.essay?.length ? (
          <div className="entra max-w-[62ch]">
            {service.essayTitle ? <h2 className="text-chapter">{service.essayTitle[locale]}</h2> : null}
            <div className="mt-5 flex flex-col gap-4">
              {service.essay.map((paragraph) => (
                <p key={paragraph.pt} className="text-md text-fg-soft">
                  {paragraph[locale]}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <div className="entra max-w-[62ch]">
            <h2 className="eyebrow">{t("includes")}</h2>
            <ul className="mt-5 flex flex-col gap-3">
              {service.includes?.map((item) => (
                <li key={item.pt} className="flex gap-3 text-md text-fg-soft">
                  <span aria-hidden="true" className="mt-3 block h-px w-4 shrink-0 bg-red" />
                  {item[locale]}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Como se trabalha: as fases, com o fio a desenhar-se.

          Era uma tabela de quatro linhas numa coluna estreita ao lado do texto,
          e uma tabela é o que se usa quando a ordem não importa. Aqui a ordem é
          tudo — é a sequência de entrega, e cada fase só existe porque a
          anterior aconteceu. Ganha a largura toda e a forma que a casa já usa
          para o que se acumula: número contornado, o fio a crescer com o
          scroll, uma fase de cada vez a assentar.

          O fio é o mesmo componente da Imunidade Algorítmica, com outra cor: lá
          corria sobre tinta e acabava em papel, aqui corre sobre papel e acaba
          no acento do serviço. */}
      {service.phases?.length ? (
        <section className="mx-auto max-w-[1200px] px-5 py-16 sm:px-8 lg:py-24">
          <h2 className="eyebrow">{t("phases")}</h2>

          <ol className="relative mt-12 grid gap-14 pl-7 sm:pl-10">
            <span
              aria-hidden="true"
              className={`camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-red ${fio}`}
            />

            {service.phases.map((phase, index) => (
              <li
                key={phase.name.pt}
                className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10"
              >
                <span
                  aria-hidden="true"
                  className={`type-outline font-display text-[clamp(48px,6vw,88px)] leading-[0.8] ${contorno}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3 className="editorial text-2xl lg:text-3xl">{phase.name[locale]}</h3>
                  <p className="mt-3 max-w-[58ch] text-md text-fg-soft">{phase.body[locale]}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {cases.length ? (
        <section className="mx-auto max-w-[1200px] px-5 pb-16 sm:px-8">
          <h2 className="entra eyebrow">{t("cases")}</h2>
          <div className="mt-5 border-t border-line">
            {cases.map((project) => (
              <Link
                key={project.slug}
                href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
                className="entra group grid grid-cols-[minmax(0,1fr)_76px] items-baseline gap-4 border-b border-line py-4 row-flip hover:pl-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px]"
              >
                <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">
                  {project.client}
                </span>
                <span className="hidden text-sm text-fg-soft sm:block">{project.title[locale]}</span>
                <span className="text-right font-display tabular-nums text-red lg:text-lg">{project.headline.value}</span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {service.closing ? (
        <section className="surface-ink py-16 lg:py-24">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="entra">
              <p className="max-w-[28ch] font-display text-[clamp(26px,3.6vw,52px)] leading-[1.04] tracking-[-0.02em]">
                {service.closing.question[locale]}
              </p>
              <p className="mt-4 text-md text-fg-soft">{service.closing.answer[locale]}</p>
            </div>
            {chamada}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-[1200px] px-5 py-24 sm:px-8">
        <h2 className="entra-perto eyebrow">{t("others")}</h2>
        {/* `entra-perto` e não `entra`: isto é o último bloco antes do rodapé, e
            uma janela larga não chegaria a fechar — ver docs/MOVIMENTO.md. */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {others.map((item) => (
            <Link
              key={item.slug}
              href={{ pathname: "/servicos/[slug]", params: { slug: slugFor(item, locale) } }}
              className="entra-perto card flex flex-col gap-2 p-6"
            >
              <h3 className="text-xl">{item.name[locale]}</h3>
              <p className="text-sm text-fg-soft">{item.claim[locale]}</p>
              <span className="mt-auto pt-4 text-sm font-semibold text-red">{item.link[locale]} →</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
