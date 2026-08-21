import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Chapter } from "@/components/Chapter";
import { Marquee } from "@/components/Marquee";
import { ProjectRail, type RailProject } from "@/components/ProjectRail";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import {
  getArchivedProjects,
  getClientLogos,
  getMilestones,
  getPageImages,
  getPosts,
  getServices,
  getTeam,
} from "@/lib/cms";
import { alternates, organizationJsonLd } from "@/lib/seo";

const tones = ["bg-red", "bg-lavender", "bg-chartreuse", "bg-coral"];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { description: t("lead"), alternates: alternates("/", locale) };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [archive, services, posts, logos, team, milestones, heroImages] =
    await Promise.all([
      getArchivedProjects(),
      getServices(),
      getPosts(),
      getClientLogos(),
      getTeam(),
      getMilestones(),
      getPageImages("home"),
    ]);

  const withCover = archive.filter((project) => project.cover?.src);
  // Do mais recente para o mais antigo; o carrossel escolhe ao acaso deste lote.
  const recent = [...withCover].sort((a, b) => b.date.localeCompare(a.date));
  const featured = recent.slice(0, 9);
  const rail: RailProject[] = recent.slice(0, 24).map((project) => ({
    slug: project.slug,
    client: project.client,
    year: project.year,
    subtitle: project.subtitle,
    disciplines: project.disciplines,
    cover: project.cover!.src,
  }));
  const covers = withCover.slice(0, 22).map((project) => project.cover!.src);
  const since = milestones[0]?.year ?? "2010";
  const years = new Date().getFullYear() - Number(since);
  const workHref = getPathname({ href: "/projetos", locale });

  const stats = [
    { value: `${years}`, label: t("statYears") },
    { value: `${withCover.length}`, label: t("statProjects") },
    { value: `${logos.length}`, label: t("statBrands") },
    { value: `${team.length}`, label: t("statPeople") },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd()),
        }}
      />

      {/* ── Herói: a tese em escala, a prova ao lado ── */}
      <header className="surface-ink relative flex min-h-[100svh] flex-col justify-between pt-24">
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,52%)_minmax(0,44%)] lg:gap-12">
          <h1 className="font-display text-[clamp(50px,8.6vw,132px)] leading-[0.9] tracking-[-0.035em]">
            <span className="relative inline-block">
              Estratégia
              <span
                aria-hidden="true"
                className="absolute inset-x-[-3%] top-[50%] h-[5px] -rotate-[1.4deg] bg-red lg:h-[10px]"
              />
            </span>
            <br />
            <span className="type-outline">Ação</span> é a
            <br />
            nossa estratégia.
          </h1>

          {heroImages.length ? (
            <div className="relative">
              {/* Empilhadas no mesmo enquadramento: com mais do que uma, o CSS
                  troca-as em fundido, sem javascript e sem salto de layout. */}
              <div
                className="relative aspect-square overflow-hidden"
                data-hero-count={heroImages.length}
              >
                {heroImages.map((photo, index) => (
                  <Image
                    key={photo.src}
                    src={photo.src}
                    alt={photo.alt || t("heroImageAlt")}
                    width={photo.width ?? 1600}
                    height={photo.height ?? 1600}
                    priority={index === 0}
                    sizes="(max-width: 1024px) 100vw, 44vw"
                    className={
                      heroImages.length > 1
                        ? "hero-fade absolute inset-0 h-full w-full object-cover"
                        : "h-full w-full object-cover"
                    }
                    style={
                      heroImages.length > 1
                        ? {
                            animationDuration: `${5.2 * heroImages.length}s`,
                            animationDelay: `-${5.2 * index}s`,
                          }
                        : undefined
                    }
                  />
                ))}
              </div>
              {/* A legenda fica fora da imagem: quem troca a fotografia no
                  painel não tem de pensar se o texto ainda se lê por cima. */}
              <p className="mt-3 text-right text-[11px] uppercase tracking-[0.1em] text-fg-soft sm:pr-32">
                {t("heroSince")} {since} · {t("heroPlace")}
              </p>
              <Link
                href="/projetos"
                aria-label={t("workArchive")}
                className="absolute bottom-8 right-3 grid h-16 w-16 place-items-center rounded-full bg-red text-xl text-white transition-colors duration-200 hover:bg-red-deep sm:-bottom-2 sm:right-6 sm:h-[92px] sm:w-[92px] sm:text-2xl"
              >
                ↗
              </Link>
            </div>
          ) : featured[0] ? (
            <div className="relative">
              <Image
                src={featured[0].cover!.src}
                alt={featured[0].client}
                width={1200}
                height={1200}
                priority
                sizes="(max-width: 1024px) 100vw, 44vw"
                className="aspect-square w-full object-cover"
              />
              <p className="absolute right-3 top-3 text-right text-[11px] uppercase tracking-[0.1em] text-paper/70">
                {t("heroSince")} {since}
                <br />
                {t("heroPlace")}
              </p>
              <Link
                href="/projetos"
                aria-label={t("workArchive")}
                className="absolute -bottom-6 right-6 grid h-[92px] w-[92px] place-items-center rounded-full bg-red text-2xl text-white transition-colors duration-200 hover:bg-red-deep"
              >
                ↗
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-end justify-between gap-6 border-t border-line px-5 py-6 sm:px-8">
          <p className="subtitle max-w-[52ch] text-fg-soft">{t("lead")}</p>
          <a
            href="#trabalho"
            className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-fg-soft hover:text-fg"
          >
            {t("heroScroll")}
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full border border-line"
            >
              ↓
            </span>
          </a>
        </div>
      </header>

      {/* ── 01 Posição ── */}
      <section className="surface-paper">
        <div className="mx-auto flex min-h-[80svh] max-w-[1600px] flex-col justify-center px-5 py-24 sm:px-8">
          <Chapter label={t("chapters.position")} number="01" />
          <p className="mt-12 max-w-[26ch] font-display text-[clamp(36px,7vw,116px)] leading-[0.92] tracking-[-0.03em]">
            {t("positionStatement")}{" "}
            <span className="text-red">{t("positionEmphasis")}</span>
          </p>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-line pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-fg-soft">
              {t("positionFoot")}
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">
              {t("positionChain")}
            </p>
          </div>
        </div>
      </section>

      {/* ── 02 Trabalho ── */}
      <section id="trabalho" className="surface-ink py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
          <Chapter label={t("chapters.work")} number="02" />
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-[clamp(32px,5.4vw,80px)] leading-[0.92] tracking-[-0.03em]">
              {withCover.length} {t("workTitleA")}
              <br />
              <span className="type-outline">{t("workTitleOutline")}</span>{" "}
              {t("workTitleB")}
            </h2>
            <Link
              href="/projetos"
              className="shrink-0 border-b border-red pb-1 text-sm font-semibold hover:text-red"
            >
              {t("workArchive")}
            </Link>
          </div>
        </div>

        <ProjectRail projects={rail} show={9} archiveLabel={t("workArchive")} />

        <div className="mt-16">
          <Marquee images={covers} />
        </div>
      </section>

      {/* ── 03 Serviços e clientes ── */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1600px] px-5 pt-24 sm:px-8">
          <Chapter label={t("chapters.services")} number="03" />
        </div>
        <div className="mt-10 border-t border-line">
          {services.map((service, index) => (
            <Link
              key={service.slug}
              href={{
                pathname: "/servicos/[slug]",
                params: { slug: service.slug },
              }}
              className="group relative block overflow-hidden border-b border-line"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${tones[index % tones.length]}`}
              />
              <span className="relative mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-12">
                <span className="flex items-baseline gap-5">
                  <span className="text-xs tabular-nums text-fg-soft">
                    0{index + 1}
                  </span>
                  <span className="font-display text-[clamp(28px,4.4vw,60px)] leading-none tracking-[-0.025em]">
                    {service.name[locale]}
                  </span>
                </span>
                <span className="subtitle max-w-[52ch] text-fg-soft">
                  {service.claim[locale]}
                </span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8">
          <p className="eyebrow text-fg-soft">{t("clientsWall")}</p>
          <div className="mt-8 grid grid-cols-3 gap-x-8 gap-y-10 sm:grid-cols-5 lg:grid-cols-8">
            {logos.map((logo) => (
              <span key={logo.src} className="grid place-items-center">
                <Image
                  src={logo.src}
                  alt={logo.name}
                  width={200}
                  height={80}
                  sizes="140px"
                  className="max-h-[34px] w-auto max-w-full object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                />
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── 04 A diferença: vermelho cheio, números reais ── */}
      <section className="surface-red relative overflow-hidden">
        <span aria-hidden="true" className="ghost-word text-center">
          AÇÃO
        </span>
        <div className="relative mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
          <Chapter label={t("chapters.difference")} number="04" />
          <p className="mt-12 max-w-[30ch] font-display text-[clamp(32px,5.4vw,84px)] leading-[0.94] tracking-[-0.03em]">
            {t("differenceStatement")}
          </p>
          <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-line pt-8 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-[clamp(38px,5vw,72px)] leading-none tabular-nums">
                  {stat.value}
                </dt>
                <dd className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-fg-soft">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 05 Field notes ── */}
      <section className="surface-paper">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Chapter label={t("chapters.notes")} number="05" />
              <h2 className="mt-6 max-w-[20ch] font-display text-[clamp(32px,5.4vw,80px)] leading-[0.92] tracking-[-0.03em]">
                {t("notesTitle")}
              </h2>
            </div>
            <Link
              href="/blog"
              className="shrink-0 border-b border-fg pb-1 text-sm font-semibold hover:text-red"
            >
              {posts.length} {t("notesAll")} ↗
            </Link>
          </div>

          <ul className="mt-14 border-t border-line">
            {posts.slice(0, 5).map((post) => (
              <li key={post.slug} className="border-b border-line">
                <Link
                  href={{
                    pathname: "/blog/[slug]",
                    params: { slug: post.slug },
                  }}
                  className="group grid items-baseline gap-2 py-6 lg:grid-cols-[240px_minmax(0,1fr)_40px]"
                >
                  <span className="text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.08em] text-fg-soft">
                    {post.category[locale]}
                    <span className="hidden lg:inline">
                      <br />
                    </span>
                    <span className="lg:hidden"> · </span>
                    {post.date.split("-").reverse().join(".")}
                  </span>
                  <span className="font-display text-[clamp(21px,2.6vw,34px)] leading-tight transition-colors duration-200 group-hover:text-red">
                    {post.title[locale]}
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden text-right text-xl lg:block"
                  >
                    ↗
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── 06 Fecho ── */}
      <section className="surface-ink">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
          <Chapter label={t("chapters.next")} number="06" />
          <p className="mt-10 font-display text-[clamp(52px,11vw,180px)] leading-[0.86] tracking-[-0.04em] text-red">
            {t("nextTitle")}
          </p>
          <a
            href="mailto:geral@jelly.pt"
            className="mt-10 flex items-center justify-between gap-6 border-y border-line py-8 font-display text-[clamp(26px,4.6vw,62px)] tracking-[-0.02em] transition-colors duration-200 hover:text-red"
          >
            geral@jelly.pt
            <span aria-hidden="true">↗</span>
          </a>
          <Link
            href="/contactos"
            className="mt-8 inline-block rounded-full bg-red px-6 py-3.5 font-semibold text-white transition-colors duration-200 hover:bg-red-deep"
          >
            {t("contactCta")}
          </Link>
        </div>
      </section>
    </>
  );
}
