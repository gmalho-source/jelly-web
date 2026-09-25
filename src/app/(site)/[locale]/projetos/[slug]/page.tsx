import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import Image from "next/image";
import { CaseStory } from "@/components/CaseStory";
import { getArchivedProject, getArchivedProjects, getNextProject, getProject, getProjects } from "@/lib/cms";
import { alternates } from "@/lib/seo";
import { slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

/** A seta de voltar. Traço e não mancha, como o resto dos sinais da casa. */
function Seta() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="h-5 w-5"
    >
      <path d="M14.5 5 7.5 12l7 7" />
    </svg>
  );
}

export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const [projects, archive] = await Promise.all([getProjects(), getArchivedProjects()]);
  return [...projects, ...archive].map((project) => ({ slug: slugFor(project, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const [project, archived] = await Promise.all([getProject(slug), getArchivedProject(slug)]);
  if (!project && !archived) return {};

  const title = project ? `${project.client} — ${project.title[locale]}` : `${archived!.client} — ${archived!.subtitle || archived!.disciplines.join(", ")}`;
  const description = project?.summary[locale] || archived?.summary || `${archived?.client}: ${archived?.disciplines.join(", ")}.`;

  const peca = project ?? archived!;
  return {
    title,
    description,
    alternates: alternates(
      (candidate) => ({ pathname: "/projetos/[slug]" as const, params: { slug: slugFor(peca, candidate) } }),
      locale,
    ),
  };
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  // Um caso pode ter as duas metades: a ficha escrita (título, equipa, citação)
  // e o registo do portfolio antigo (capa, disciplinas, narrativa). A página é
  // uma só, e usa o que existir.
  const [project, archived] = await Promise.all([getProject(slug), getArchivedProject(slug)]);
  if (!project && !archived) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308.
  const canonico = slugFor(project ?? archived!, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/projetos/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("work");

  const client = project?.client ?? archived!.client;
  const headline = project?.title[locale] ?? client;
  const eyebrow = archived?.subtitle || project?.disciplines[locale] || archived?.disciplines.join(" · ") || "";
  const lead = project?.summary[locale] || archived?.summary || "";
  const cover = archived?.cover?.src;
  // O topo da página: a imagem primeiro e o título por cima dela — um caso
  // vende-se pelo que se vê antes de se ler. A capa serve quase sempre; quando
  // não serve, escolhe-se outra no painel, e é essa que manda aqui.
  const topo = archived?.heroImage ?? archived?.cover;
  // Um vídeo sem primeiro fotograma é um retângulo à espera, e por isso a capa
  // servia de fotograma a todos. Com a capa no topo da página isso passou a pôr
  // a mesma fotografia duas vezes na mesma página — era o que se via no caso do
  // Pedro Chagas Freitas. A capa continua a servir, mas só quando o topo está
  // ocupado por outra imagem; senão, o vídeo fica com o seu próprio poster ou
  // com nenhum, e quem quiser um escolhe-o no painel.
  const posterDosVideos = topo?.src === cover ? undefined : cover;
  // A história inglesa sai do mesmo sítio no painel: é a mesma estrutura com os
  // textos na outra língua, e cada bloco por traduzir serve o português.
  const story = (locale === "en" ? archived?.storyEn : archived?.story) ?? archived?.story ?? [];
  const citacao = project?.quote ?? archived?.quote;

  const facts = [
    { term: t("client"), value: client },
    { term: t("year"), value: project?.year ?? archived?.year ?? "" },
    { term: t("disciplines"), value: project?.disciplines[locale] ?? archived?.disciplines.join(", ") ?? "" },
    ...(project ? [{ term: t("team"), value: project.team[locale] }] : []),
  ].filter((fact) => fact.value);

  // Os números só aparecem depois de validados com o cliente. Até lá, a página
  // vive da história, que é verdadeira.
  const kpis = project?.numbersValidated ? [project.headline, ...project.kpis] : [];
  const next = project ? await getNextProject(slug) : null;

  return (
    <article className="surface-ink mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-20">
      {/* A seta de volta à galeria, no canto de cima. A página de um caso é
          quase sempre a primeira que alguém abre — chega-lhe por um link ou
          por uma pesquisa — e sem isto o caminho para o resto do trabalho é
          descer a página inteira até ao fim. Leva o nome escrito em `title` e
          em `aria-label`: uma seta sozinha é um símbolo, e um símbolo tem de
          se poder ler. */}
      {topo?.src ? (
        /* A capa a fazer de topo. O véu por cima dela não é decoração: uma
           fotografia clara come um título branco, e qual delas vai ser clara
           não se sabe de antemão — são cinquenta e quatro capas de clientes
           diferentes. O degradê é mais fechado em baixo, que é onde o texto
           assenta, e quase transparente em cima, para a imagem se ver. */
        <header className="relative isolate overflow-hidden rounded-[20px]">
          {/* A camada encosta ao topo da moldura e tem mais 32% de altura: a
              fotografia começa onde foi enquadrada, e a folga toda fica em
              baixo, que é por onde a paralaxe a gasta a subir. A conta está no
              globals.css, ao lado da classe. */}
          <div className="capa-paralaxe absolute inset-x-0 top-0 h-[132%]">
            <Image
              src={topo.src}
              alt={topo.alt || client}
              fill
              priority
            fetchPriority="high"
              sizes="(max-width: 1200px) 100vw, 1140px"
              className="object-cover"
            />
          </div>
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />
          {/* Sobre a fotografia, e por isso com fundo próprio: o véu do topo é
              quase transparente aí em cima, e uma seta clara sobre uma imagem
              clara não se vê. */}
          <Link
            href="/projetos"
            title={t("back")}
            aria-label={t("back")}
            className="absolute left-6 top-6 z-10 grid h-11 w-11 place-items-center rounded-full bg-ink/55 text-paper backdrop-blur-sm transition-colors duration-200 hover:bg-red sm:left-10 sm:top-10 lg:left-12 lg:top-12"
          >
            <Seta />
          </Link>
          <div className="relative flex min-h-[380px] flex-col justify-end p-6 sm:min-h-[480px] sm:p-10 lg:min-h-[560px] lg:p-12">
            <div className="capa-paralaxe-titulo">
              {eyebrow ? <span className="eyebrow text-paper/85">{eyebrow}</span> : null}
              <h1 className="mt-4 max-w-[22ch] text-display text-paper">{headline}</h1>
            </div>
          </div>
        </header>
      ) : (
        <header className="grid items-end gap-8 lg:grid-cols-[minmax(0,60%)_minmax(0,34%)] lg:justify-between lg:gap-14">
          <div>
            {/* Sem capa não há fotografia por baixo, e a seta pode andar com o
                nome à vista em vez de o esconder num `title`. */}
            <Link href="/projetos" title={t("back")} className="link-quiet mb-6 inline-flex items-center gap-2 text-sm text-fg-soft">
              <Seta />
              {t("back")}
            </Link>
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h1 className="mt-5 max-w-[22ch] text-display">{headline}</h1>
          </div>
        </header>
      )}

      {/* A ficha do caso desce para debaixo da capa, ao lado da abertura: em
          cima competia com o título, aqui é o primeiro detalhe de quem já
          decidiu continuar a ler. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,60%)_minmax(0,34%)] lg:justify-between lg:gap-14">
        {lead ? <p className="subtitle max-w-[58ch] text-lg">{lead}</p> : null}
        {facts.length ? (
          <dl className="text-[13px] lg:mt-1">
            {facts.map((fact) => (
              <div key={fact.term} className="flex justify-between gap-4 border-b border-line py-2.5">
                <dt className="text-fg-soft">{fact.term}</dt>
                <dd className="text-right">{fact.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {kpis.length ? (
        <dl className="mt-12 grid grid-cols-1 border-t border-line sm:grid-cols-3">
          {/* O fio que separa as colunas é o `border-r` do vizinho da
              esquerda, e sem folga o número seguinte encostava-lhe. A folga
              cai no primeiro de cada linha, para a coluna da esquerda
              continuar a alinhar com o resto da página, e o fio cai no último
              de cada linha, para não sobrar um traço na margem. */}
          {kpis.map((kpi) => (
            <div
              key={kpi.value}
              className="border-b border-line py-6 pr-5 sm:border-b-0 sm:border-r sm:pl-6 sm:pr-6 sm:[&:nth-child(3n)]:border-r-0 sm:[&:nth-child(3n+1)]:pl-0"
            >
              <dt className="font-display text-4xl leading-none tabular-nums tracking-tight text-red lg:text-[50px]">{kpi.value}</dt>
              <dd className="mt-2 text-[13px] text-fg-soft">{kpi.label[locale]}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {/* Os rótulos da lente saem daqui, que é onde a língua se sabe: o
          `CaseStory` desenha blocos e não devia ir buscar traduções. */}
      <CaseStory
        blocks={story}
        client={client}
        poster={posterDosVideos}
        textos={{
          ver: t("galleryOpen"),
          fechar: t("galleryClose"),
          anterior: t("galleryPrev"),
          seguinte: t("galleryNext"),
          contador: t.raw("galleryCount") as string,
        }}
      />

      {/* O testemunho, tenha o projeto caso escrito ou não: vive no mesmo
          registo, e só dependia do caso por ter nascido com ele. A fotografia
          vai num círculo e sempre a preto e branco — retratos tirados por
          pessoas diferentes, com luzes diferentes, só se leem como uma série
          quando perdem a cor, e é assim que a equipa aparece na grelha dela. */}
      {citacao ? (
        // `entra-perto`: a citação está a pouco mais de um ecrã do fim do
        // documento, e numa janela larga ficava a meio caminho para sempre.
        <blockquote className="entra-perto mt-16 border-t border-line pt-8">
          {/* Poppins Light e não Bree Serif: a Bree só tem um peso, e a 38px
              uma frase de cliente lia-se como mais um título da página — pesava
              mais do que o que o cliente disse. Mais pequena e mais leve, lê-se
              como uma voz de fora, que é o que é. */}
          <p className="max-w-[46ch] font-sans text-[19px] font-light leading-[1.5] lg:text-[24px]">
            “{citacao.text[locale]}”
          </p>
          <footer className="mt-6 flex items-center gap-4">
            {citacao.photo ? (
              <Image
                src={citacao.photo.src}
                alt={citacao.photo.alt ?? citacao.author}
                width={112}
                height={112}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-full object-cover grayscale"
              />
            ) : null}
            <span className="eyebrow text-fg-soft">
              {citacao.author}
              {citacao.role[locale] ? ` · ${citacao.role[locale]}` : ""}
            </span>
          </footer>
        </blockquote>
      ) : null}

      {!story.length ? (
        <div className="entra-perto mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-8">
          <p className="subtitle max-w-[48ch]">
            {locale === "pt"
              ? "Deste projeto guardámos o trabalho, não a história. Queres saber o que fizemos aqui?"
              : "For this project we kept the work, not the story. Want to know what we did here?"}
          </p>
          <Link href="/contactos" className="btn-pill btn-pill-ink">
            {locale === "pt" ? "Falar connosco" : "Get in touch"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      ) : null}

      <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-5">
        <Link href="/projetos" className="text-sm font-semibold text-red">
          ← {t("back")}
        </Link>
        {next ? (
          <Link
            href={{ pathname: "/projetos/[slug]", params: { slug: slugFor(next, locale) } }}
            className="flex items-center gap-2 text-sm font-semibold text-red"
          >
            <span className="eyebrow text-fg-soft">{t("next")}</span>
            <span aria-hidden="true" className="block h-px w-8 bg-red" />
            {next.client}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
