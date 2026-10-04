import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { FaixaDeAreas } from "@/components/FaixaDeAreas";
import { FaixaDeParceiros } from "@/components/FaixaDeParceiros";
import { marketing } from "@/content/marketing";
import { getLogoWall, getProjects, getProjectsBySlugs, getService, getServices } from "@/lib/cms";
import { alternates, SITE_URL } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

/**
 * A página-mãe de Marketing.
 *
 * Uma rota fixa que ganha à dinâmica `[slug]`, como a de Branding. A genérica
 * descrevia o serviço com quatro bullets e quatro fases; este é o serviço pelo
 * qual mais nos procuram, e a página tem de ser o chapéu de tudo o que cabe
 * nele: dez serviços em quatro áreas, cada área com a sua unidade de medida.
 *
 * Logo a seguir ao topo, as quatro áreas numa faixa de quadrados que viram e
 * mostram no verso as páginas dos serviços (outubro de 2026: saíram o mapa em
 * colunas e a secção longa das áreas, que repetiam o mesmo caminho). As fases
 * e a frase de promessa continuam a vir do serviço no painel — é a parte que a
 * casa edita; as áreas vivem em `content/marketing.ts`.
 */
const SLUG = "marketing";

/** Quantos casos no fim da página, quando o painel não os escolhe. */
const CASOS = 5;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  const service = await getService(SLUG);
  const nome = service?.name[locale] ?? "Marketing";
  return {
    title: nome,
    description: marketing.descricao[locale],
    alternates: alternates(
      (candidate) => ({ pathname: "/servicos/[slug]" as const, params: { slug: service ? slugFor(service, candidate) : SLUG } }),
      locale,
    ),
    openGraph: { type: "website", title: nome, description: marketing.descricao[locale], images: [{ url: `${SITE_URL}${marketing.topo.poster.src}` }] },
  };
}

export default async function MarketingPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("services");
  const m = marketing;
  const [service, all, parceiros, escritos] = await Promise.all([getService(SLUG), getServices(), getLogoWall("parceiros-marketing"), getProjects()]);
  // Os casos: os que o painel escolher no serviço, se escolher; senão, os
  // projetos com o caso escrito e marketing na disciplina, primeiro os que têm
  // o número validado. Só os escritos, porque é a história que se mostra aqui.
  const casos = service?.caseSlugs?.length
    ? await getProjectsBySlugs(service.caseSlugs)
    : escritos
        .filter((projeto) => /marketing|paid media|performance/i.test(projeto.disciplines.pt))
        .sort((a, b) => Number(Boolean(b.numbersValidated)) - Number(Boolean(a.numbersValidated)))
        .slice(0, CASOS);
  const outros = all.filter((item) => item.slug !== SLUG);
  const ia = all.find((item) => item.slug === "inteligencia-artificial");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service?.name[locale] ?? "Marketing",
    description: m.descricao[locale],
    provider: { "@type": "Organization", name: "Jelly", url: SITE_URL },
    areaServed: "PT",
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: service?.name[locale] ?? "Marketing",
      itemListElement: m.lista.flatMap((area) =>
        area.servicos.map((s) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: s.nome[locale], category: area.nome[locale] } })),
      ),
    },
  };

  const chamada = (
    <Link href="/contactos" className="btn-pill">
      {m.cta[locale]} <span aria-hidden="true">→</span>
    </Link>
  );

  // O título entra palavra a palavra ao carregar; `--vez` é a ordem de cada uma.
  const palavras = [
    ...m.titulo.forte[locale].split(" ").map((p) => ({ p, vermelha: false })),
    ...m.titulo.vermelho[locale].split(" ").map((p) => ({ p, vermelha: true })),
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Abertura ─────────────────────────────────────────────────────────
          Curta e em tinta: uma frase, uma linha. O chapéu está logo a seguir,
          em papel — é ele a imagem desta página. Acima da dobra, e por isso a
          entrada é uma animação de tempo, como no manifesto do Branding. */}
      <header className="surface-cover relative isolate -mt-6 flex min-h-[100lvh] flex-col justify-end overflow-hidden bg-ink pb-32 pt-[140px] sm:-mt-24 sm:pb-14 lg:pb-16">
        {/* O vídeo é textura, não cena: escurecido até o título mandar. O
            primeiro fotograma serve de capa enquanto o vídeo chega, e a quem
            pediu menos movimento fica só ele. */}
        <Image src={m.topo.poster.src} alt="" fill priority fetchPriority="high" sizes="100vw" className="topo-paralaxe -z-30 object-cover" />
        <video
          className="video-fundo topo-paralaxe absolute inset-0 -z-20 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={m.topo.poster.src}
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src={m.topo.video} type="video/mp4" />
        </video>
        <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/97 via-ink/86 to-ink/72" />
        <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
          <span className="eyebrow text-red">{m.eyebrow[locale]}</span>
          <h1
            className="mt-6 max-w-[16ch] font-display text-[clamp(44px,7vw,110px)] leading-[0.96] tracking-[-0.03em]"
            aria-label={`${m.titulo.forte[locale]} ${m.titulo.vermelho[locale]}`}
          >
            {palavras.map(({ p, vermelha }, i) => (
              <span key={p + i} aria-hidden="true">
                <span className={`manifesto-palavra ${vermelha ? "text-red" : ""}`} style={{ "--vez": i } as React.CSSProperties}>
                  {p}
                </span>{" "}
              </span>
            ))}
          </h1>
          <div className="mt-10 flex flex-wrap items-end justify-between gap-7 border-t border-line pt-6">
            <p className="subtitle max-w-[46ch]">{m.lead[locale]}</p>
            {chamada}
          </div>
        </div>
      </header>

      {/* ── As áreas, numa faixa ──────────────────────────────────────────
          Quatro quadrados de ponta a ponta, um por área. Não se anima: pode
          estar no ecrã quando a página abre. */}
      <FaixaDeAreas areas={m.lista} locale={locale} titulo={m.areas.eyebrow[locale]} rotulos={{ ver: m.areas.verServicos[locale], voltar: m.areas.voltar[locale] }} />

      {/* ── Trabalho e parceiros ────────────────────────────────────────────── */}
      <section className="surface-paper py-24 lg:py-28">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-8 border-b border-line pb-6">
            <div className="entra">
              <span className="eyebrow text-red">{m.trabalho.eyebrow[locale]}</span>
              <h2 className="mt-4 max-w-[26ch] text-chapter">{m.trabalho.titulo[locale]}</h2>
            </div>
            <Link href="/projetos" className="btn-pill btn-pill-ink">
              {m.trabalho.todos[locale]} <span aria-hidden="true">→</span>
            </Link>
          </div>
          {casos.length ? (
            <div>
              {casos.map((project) => (
                <Link
                  key={project.slug}
                  href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(project, locale) } }}
                  className="entra group grid grid-cols-[minmax(0,1fr)_76px] items-baseline gap-4 border-b border-line py-4 row-flip hover:pl-3 sm:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)_96px]"
                >
                  <span className="font-display text-xl transition-colors duration-200 group-hover:text-red lg:text-2xl">{project.client}</span>
                  {/* Sem frase própria, o título é o nome do cliente: não se repete. */}
                  <span className="hidden text-sm text-fg-soft sm:block">{project.title[locale] !== project.client ? project.title[locale] : ""}</span>
                  {/* O número só vai para o ecrã depois de validado com o cliente. */}
                  <span className="text-right font-display tabular-nums text-red lg:text-lg">{project.numbersValidated ? project.headline.value : ""}</span>
                </Link>
              ))}
            </div>
          ) : null}
          <FaixaDeParceiros eyebrow={m.trabalho.parceirosEyebrow[locale]} logos={parceiros} />
        </div>
      </section>

      {/* ── O método, em vermelho ───────────────────────────────────────────
          As fases vêm do painel. É a única secção vermelha antes do fecho: o
          meio da página tem de ter uma cor a mais que papel e tinta. Vem
          depois do trabalho e não logo a seguir à faixa das áreas, onde o
          quadrado vermelho da Performance se colava a ela. */}
      {service?.phases?.length ? (
        <section className="surface-red py-24 lg:py-28">
          <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
              <div>
                <span className="eyebrow text-ink/70">{m.metodo.eyebrow[locale]}</span>
                <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(34px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.metodo.titulo[locale]}</h2>
              </div>
              <p className="max-w-[44ch] text-md text-fg-soft lg:justify-self-end">{m.metodo.nota[locale]}</p>
            </div>
            <ol className="relative mt-14 grid gap-12 pl-7 sm:pl-10">
              <span aria-hidden="true" className="camada-fio camada-fio-curto absolute left-0 top-2 block h-[calc(100%-1rem)] w-px bg-gradient-to-b from-ink to-ink/30" />
              {service.phases.map((fase, i) => (
                <li key={fase.name.pt} className="camada relative grid gap-4 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)] sm:gap-10">
                  <span aria-hidden="true" className="type-outline type-outline-ink font-display text-[clamp(48px,6vw,88px)] leading-[0.8]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="editorial text-2xl lg:text-3xl">{fase.name[locale]}</h3>
                    <p className="mt-3 max-w-[58ch] text-md text-fg-soft">{fase.body[locale]}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
      ) : null}

      {/* ── A IA, transversal ──────────────────────────────────────────────── */}
      <section className="surface-ink py-20 lg:py-24">
        <div className="mx-auto grid max-w-[1200px] gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-14">
          <div className="entra">
            <span className="eyebrow text-red">{m.ia.eyebrow[locale]}</span>
            <h2 className="mt-4 max-w-[22ch] font-display text-[clamp(30px,3.6vw,54px)] leading-[1.02] tracking-[-0.025em]">{m.ia.titulo[locale]}</h2>
            <p className="mt-5 max-w-[46ch] text-md text-fg-soft">{m.ia.texto[locale]}</p>
            {ia ? (
              <Link href={{ pathname: "/servicos/[slug]", params: { slug: slugFor(ia, locale) } }} className="btn-pill mt-7">
                {m.ia.cta[locale]} <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </div>
          <ul className="entra-tarde border-t border-line">
            {m.ia.itens.map((item) => (
              <li key={item.nome.pt} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-4 border-b border-line py-4">
                {"href" in item && item.href ? (
                  <Link href={item.href as "/contactos"} className="font-medium transition-colors duration-200 hover:text-red">
                    {item.nome[locale]}
                  </Link>
                ) : (
                  <span className="font-medium">{item.nome[locale]}</span>
                )}
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-red">{item.area[locale]}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Fecho e outras disciplinas ───────────────────────────────────── */}
      <section className="surface-paper py-24">
        <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
          <div className="surface-red grid gap-8 rounded-[6px] px-8 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:px-16 lg:py-16">
            <div className="entra-perto">
              <h2 className="max-w-[14ch] font-display text-[clamp(32px,4.4vw,64px)] leading-[1.0] tracking-[-0.025em]">{m.fecho.titulo[locale]}</h2>
              <p className="mt-4 max-w-[46ch] text-md text-fg-soft">{m.fecho.texto[locale]}</p>
            </div>
            <Link href="/contactos" className="btn-pill btn-pill-ink">
              {m.fecho.cta[locale]} <span aria-hidden="true">→</span>
            </Link>
          </div>
          <h2 className="entra-perto eyebrow mt-24 text-red">{t("others")}</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {outros.map((item) => (
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
        </div>
      </section>
    </>
  );
}
