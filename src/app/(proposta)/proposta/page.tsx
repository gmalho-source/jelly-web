import Image from "next/image";
import Link from "next/link";
import { IndexSheet, type SheetTile } from "@/components/IndexSheet";
import { Marquee } from "@/components/Marquee";
import {
  getArchivedProjects,
  getClientLogos,
  getMilestones,
  getPosts,
  getServices,
  getTeam,
} from "@/lib/cms";

const tones = ["bg-red", "bg-lavender", "bg-chartreuse", "bg-coral"];

/** Etiqueta numerada: dá espinha à página e diz sempre onde vais. */
function Chapter({
  label,
  number,
  dark,
}: {
  label: string;
  number: string;
  dark?: boolean;
}) {
  return (
    <p className={`eyebrow ${dark ? "text-paper/60" : "text-ink/60"}`}>
      {label} <span className="text-red">/ {number}</span>
    </p>
  );
}

export default async function Proposta() {
  const [archive, services, posts, logos, team, milestones] = await Promise.all(
    [
      getArchivedProjects(),
      getServices(),
      getPosts(),
      getClientLogos(),
      getTeam(),
      getMilestones(),
    ],
  );

  const withCover = archive.filter((project) => project.cover?.src);
  const featured = withCover.slice(0, 9);
  const covers = withCover.slice(0, 22).map((project) => project.cover!.src);
  const editorial = posts.slice(0, 5);
  const anos = new Date().getFullYear() - Number(milestones[0]?.year ?? 2010);

  const tiles: SheetTile[] = [
    { label: "Sobre", kind: "página", href: "/sobre", tone: "bg-slate" },
    ...services.map((service, index) => ({
      label: service.name.pt,
      kind: "serviço",
      href: `/servicos/${service.slug}`,
      tone: tones[index % tones.length],
    })),
    ...withCover.slice(0, 24).map((project) => ({
      label: project.client,
      kind: project.disciplines[0] ?? "projeto",
      href: `/projetos/${project.slug}`,
      image: project.cover!.src,
    })),
    ...posts.slice(0, 12).map((post) => ({
      label: post.title.pt,
      kind: "artigo",
      href: `/blog/${post.slug}`,
      image: post.cover?.src,
      tone: "bg-slate",
    })),
    { label: "Clientes", kind: "página", href: "/clientes", tone: "bg-coral" },
    { label: "Newsroom", kind: "página", href: "/newsroom", tone: "bg-slate" },
    {
      label: "Falar connosco",
      kind: "página",
      href: "/contactos",
      tone: "bg-red",
    },
  ];

  return (
    <>
      <IndexSheet
        tiles={tiles}
        homeHref="/"
        contactHref="/contactos"
        copy={{
          index: "Índice",
          placeholder: "escreve para encontrar — cliente, serviço, artigo",
          filterLabel: "Filtrar o índice",
          empty: "Nada com esse nome. Apaga uma letra.",
          of: "de",
          close: "Fechar o índice",
          contact: "Start The Change",
        }}
      />

      {/* ── Barra: marca à esquerda, ação à direita ── */}
      {/* ── 00 Herói ── */}
      <header className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-24">
        <div className="mx-auto grid w-full max-w-[1600px] flex-1 items-center gap-8 px-5 sm:px-8 lg:grid-cols-[minmax(0,52%)_minmax(0,44%)] lg:gap-12">
          <h1 className="font-display text-[clamp(50px,8.6vw,132px)] leading-[0.9] tracking-[-0.035em]">
            {/* A palavra riscada sai do branco: já não é o que somos, e a cor
                diz isso antes de o risco o dizer. */}
            <span className="relative inline-block text-fg-soft">
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

          {featured[0] ? (
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
                Independentes desde {milestones[0]?.year ?? 2010}
                <br />
                Sintra · Lisboa
              </p>
              <Link
                href="/projetos"
                aria-label="Ver os projetos"
                className="absolute -bottom-6 right-6 grid h-[92px] w-[92px] place-items-center rounded-full bg-red text-2xl text-white transition-colors duration-200 hover:bg-red-deep"
              >
                ↗
              </Link>
            </div>
          ) : null}
        </div>

        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-end justify-between gap-6 border-t border-paper/15 px-5 py-6 sm:px-8">
          <p className="subtitle max-w-[46ch] text-paper/70">
            Ligamos marca, dados e tecnologia para empresas que precisam de
            resultados, não de apresentações.
          </p>
          <a
            href="#trabalho"
            className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.1em] text-paper/70 hover:text-paper"
          >
            Ver a mudança em ação
            <span
              aria-hidden="true"
              className="grid h-9 w-9 place-items-center rounded-full border border-paper/30"
            >
              ↓
            </span>
          </a>
        </div>
      </header>

      {/* ── 01 Posição: uma frase por ecrã, com a ênfase em vermelho ── */}
      <section className="bg-paper text-ink">
        <div className="mx-auto flex min-h-[86svh] max-w-[1600px] flex-col justify-center px-5 py-24 sm:px-8">
          <Chapter label="A nossa posição" number="01" />
          <p className="mt-12 max-w-[26ch] font-display text-[clamp(38px,7.5vw,124px)] leading-[0.92] tracking-[-0.03em]">
            Estratégia sem execução é uma apresentação bonita.{" "}
            <span className="text-red">Nós ficamos até funcionar.</span>
          </p>
          <div className="mt-16 flex flex-wrap items-center justify-between gap-6 border-t border-ink/15 pt-6">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink/60">
              Por isso juntamos o que outras agências separam
            </p>
            <p className="text-xs font-semibold uppercase tracking-[0.1em]">
              Marca <span className="text-red">→</span> Dados{" "}
              <span className="text-red">→</span> Tecnologia
            </p>
          </div>
        </div>
      </section>

      {/* ── 02 Trabalho: a prova, em imagem ── */}
      <section id="trabalho" className="py-24 lg:py-32">
        <div className="mx-auto max-w-[1600px] px-5 sm:px-8">
          <Chapter label="O trabalho" number="02" dark />
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <h2 className="font-display text-[clamp(34px,5.6vw,84px)] leading-[0.92] tracking-[-0.03em]">
              {withCover.length} projetos.
              <br />
              <span className="type-outline">Nenhum</span> igual ao anterior.
            </h2>
            <Link
              href="/projetos"
              className="shrink-0 border-b border-red pb-1 text-sm font-semibold hover:text-red"
            >
              Ver o arquivo completo
            </Link>
          </div>
        </div>

        <div className="mt-14 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8 [scrollbar-width:thin]">
          {featured.map((project) => (
            <Link
              key={project.slug}
              href={`/projetos/${project.slug}`}
              className="group w-[80vw] shrink-0 snap-start sm:w-[46vw] lg:w-[32vw]"
            >
              <span className="block overflow-hidden">
                <Image
                  src={project.cover!.src}
                  alt={project.client}
                  width={1200}
                  height={880}
                  sizes="(max-width: 640px) 80vw, (max-width: 1024px) 46vw, 32vw"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                />
              </span>
              <span className="mt-4 flex items-baseline justify-between gap-4 border-t border-paper/15 pt-3">
                <span className="font-display text-2xl">{project.client}</span>
                <span className="text-xs tabular-nums text-paper/45">
                  {project.year}
                </span>
              </span>
              <span className="mt-1 block text-sm text-paper/55">
                {project.subtitle || project.disciplines.join(" · ")}
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-16">
          <Marquee images={covers} />
        </div>
      </section>

      {/* ── 03 Serviços: quatro linhas que se pintam ── */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-[1600px] px-5 pt-24 sm:px-8">
          <Chapter label="O que fazemos" number="03" />
        </div>
        <div className="mt-10 border-t border-ink/15">
          {services.map((service, index) => (
            <Link
              key={service.slug}
              href={`/servicos/${service.slug}`}
              className="group relative block overflow-hidden border-b border-ink/15"
            >
              <span
                aria-hidden="true"
                className={`absolute inset-0 origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100 ${tones[index % tones.length]}`}
              />
              <span className="relative mx-auto flex max-w-[1600px] flex-col gap-3 px-5 py-9 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:py-12">
                <span className="flex items-baseline gap-5">
                  <span className="text-xs tabular-nums text-ink/40">
                    0{index + 1}
                  </span>
                  <span className="font-display text-[clamp(30px,4.6vw,64px)] leading-none tracking-[-0.025em]">
                    {service.name.pt}
                  </span>
                </span>
                <span className="subtitle max-w-[52ch] text-ink/70">
                  {service.claim.pt}
                </span>
              </span>
            </Link>
          ))}
        </div>

        {/* Parede de clientes, em paper para os logos existirem */}
        <div className="mx-auto max-w-[1600px] px-5 py-20 sm:px-8">
          <p className="eyebrow text-ink/60">Confiaram-nos a marca</p>
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

      {/* ── 04 A diferença: vermelho cheio, palavra fantasma, números reais ── */}
      <section className="relative overflow-hidden bg-red text-ink">
        <span aria-hidden="true" className="ghost-word text-center text-ink">
          AÇÃO
        </span>
        <div className="relative mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
          <Chapter label="A diferença Jelly" number="04" />
          <p className="mt-12 max-w-[30ch] font-display text-[clamp(34px,5.6vw,88px)] leading-[0.94] tracking-[-0.03em]">
            Não vendemos transformação à distância. Entramos na equipa e
            ficamos.
          </p>
          <dl className="mt-16 grid grid-cols-2 gap-8 border-t border-ink/20 pt-8 lg:grid-cols-4">
            {[
              { value: `${anos}`, label: "anos de casa" },
              { value: `${withCover.length}`, label: "projetos no arquivo" },
              { value: `${logos.length}`, label: "marcas na parede" },
              { value: `${team.length}`, label: "pessoas na equipa" },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="font-display text-[clamp(40px,5vw,76px)] leading-none tabular-nums">
                  {stat.value}
                </dt>
                <dd className="mt-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink/70">
                  {stat.label}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── 05 Field notes: índice editorial em linhas ── */}
      <section className="bg-paper text-ink">
        <div className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <Chapter label="Field notes" number="05" />
              <h2 className="mt-6 font-display text-[clamp(34px,5.6vw,84px)] leading-[0.92] tracking-[-0.03em]">
                Escrevemos o<br />
                que aprendemos.
              </h2>
            </div>
            <Link
              href="/blog"
              className="shrink-0 border-b border-ink pb-1 text-sm font-semibold hover:text-red"
            >
              {posts.length} artigos ↗
            </Link>
          </div>

          <ul className="mt-14 border-t border-ink/15">
            {editorial.map((post) => (
              <li key={post.slug} className="border-b border-ink/15">
                <Link
                  href={`/blog/${post.slug}`}
                  className="group grid items-baseline gap-2 py-6 lg:grid-cols-[240px_minmax(0,1fr)_40px]"
                >
                  <span className="text-[11px] font-semibold uppercase leading-[1.5] tracking-[0.08em] text-ink/50">
                    {post.category.pt}
                    <span className="hidden lg:inline">
                      <br />
                    </span>
                    <span className="lg:hidden"> · </span>
                    {post.date.split("-").reverse().join(".")}
                  </span>
                  <span className="font-display text-[clamp(22px,2.6vw,36px)] leading-tight transition-colors duration-200 group-hover:text-red">
                    {post.title.pt}
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
      <footer className="mx-auto max-w-[1600px] px-5 py-24 sm:px-8 lg:py-32">
        <Chapter label="A próxima mudança" number="06" dark />
        <p className="mt-12 font-display text-[clamp(56px,12vw,196px)] leading-[0.86] tracking-[-0.04em] text-red">
          E se…?
        </p>
        <a
          href="mailto:geral@jelly.pt"
          className="mt-10 flex items-center justify-between gap-6 border-y border-paper/20 py-8 font-display text-[clamp(28px,5vw,68px)] tracking-[-0.02em] transition-colors duration-200 hover:text-red"
        >
          geral@jelly.pt
          <span aria-hidden="true">↗</span>
        </a>

        <nav className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-sm text-paper/50">
          {[
            "/sobre",
            "/servicos",
            "/projetos",
            "/clientes",
            "/blog",
            "/newsroom",
            "/contactos",
          ].map((href) => (
            <Link key={href} href={href} className="hover:text-paper">
              {href}
            </Link>
          ))}
        </nav>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 text-[11px] uppercase tracking-[0.1em] text-paper/40">
          <span>Jelly · Sintra · Portugal</span>
          <span>Proposta visual · 2026</span>
        </div>
      </footer>
    </>
  );
}
