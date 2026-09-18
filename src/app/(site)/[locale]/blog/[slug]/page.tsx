import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import Image from "next/image";
import { ArticleBody } from "@/components/ArticleBody";
import { SubscribeForm } from "@/app/(site)/[locale]/subscrever/SubscribeForm";
import { copyDaSubscricao } from "@/app/(site)/[locale]/subscrever/copy";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { OuvirArtigo } from "@/components/OuvirArtigo";
import { Link, getPathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getPost, getPostBody, getPosts, getRelatedPosts } from "@/lib/cms";
import { resumoPublicavel } from "@/lib/resumo";
import { alternates } from "@/lib/seo";
import { capaDe, slugFor } from "@/lib/slugs";

type Params = { locale: Locale; slug: string };

/** Uma árvore por língua: o inglês leva o slug inglês onde ele existe. */
export async function generateStaticParams({ params }: { params: { locale: string } }) {
  const locale = params.locale as Locale;
  const posts = await getPosts();
  return posts.map((post) => ({ slug: slugFor(post, locale) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  // O corpo vem em cache (é o mesmo pedido que a página faz) e serve de rede ao
  // resumo: sem ele, 123 artigos importados publicavam shortcodes como
  // description.
  const corpo = await getPostBody(slug);
  const blocos = (locale === "en" ? corpo?.blocksEn : corpo?.blocks) ?? corpo?.blocks ?? post.blocks;
  return {
    title: post.title[locale],
    description: resumoPublicavel(post.excerpt[locale], blocos),
    alternates: alternates(
      (candidate) => ({ pathname: "/blog/[slug]" as const, params: { slug: slugFor(post, candidate) } }),
      locale,
    ),
    openGraph: { type: "article", publishedTime: post.date, authors: [post.author.name] },
  };
}

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const post = await getPost(slug);
  const capa = post ? capaDe(post, locale) : undefined;
  if (!post) notFound();

  // Chegou pelo endereço da outra língua: serve-se o certo, com 308, para não
  // haver duas páginas com o mesmo artigo.
  const canonico = slugFor(post, locale);
  if (canonico !== slug) {
    permanentRedirect(getPathname({ href: { pathname: "/blog/[slug]", params: { slug: canonico } }, locale }));
  }

  const t = await getTranslations("blog");
  const tSub = await getTranslations("subscricao");
  const nav = await getTranslations("nav");
  const related = await getRelatedPosts(slug);
  const formatter = new Intl.DateTimeFormat(locale === "pt" ? "pt-PT" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  // O corpo segue a língua da página; sem tradução, serve o português — mais
  // vale um artigo em português do que uma página vazia.
  // O corpo vem à parte, e só o deste artigo: a lista não o traz, de propósito.
  const corpo = await getPostBody(slug);
  const blocks = corpo?.blocks ?? post.blocks;
  const blocksEn = corpo?.blocksEn ?? post.blocksEn;
  const body = locale === "en" && blocksEn?.length ? blocksEn : blocks;
  /*
   * O áudio segue o texto que está a ser mostrado, e não a língua da página.
   *
   * Um artigo sem tradução mostra o corpo português no site inglês — é a regra
   * desta casa. Se o leitor de áudio fosse pela língua da página, esse artigo
   * ficaria sem nada para tocar, tendo a gravação portuguesa ali ao lado. Daí
   * `emIngles`: só quando o que se lê é mesmo o texto inglês.
   */
  const emIngles = locale === "en" && Boolean(blocksEn?.length);
  const audio = post.audio?.[emIngles ? "en" : "pt"];
  const resumo = resumoPublicavel(post.excerpt[locale], body);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title[locale],
    description: resumo,
    datePublished: post.date,
    // A gravação, quando existe: é o mesmo artigo noutro suporte, e um motor de
    // respostas que a conheça pode oferecê-la a quem procura para ouvir.
    ...(audio
      ? {
          audio: {
            "@type": "AudioObject",
            contentUrl: audio.src,
            encodingFormat: "audio/mpeg",
            ...(audio.segundos ? { duration: `PT${Math.floor(audio.segundos / 60)}M${audio.segundos % 60}S` } : {}),
          },
        }
      : {}),
    // A casa é uma organização, uma pessoa é uma pessoa: o schema.org distingue
    // as duas, e é isso que decide como o artigo aparece nos resultados.
    author: {
      "@type": /^(Jelly|Equipa Jelly)$/.test(post.author.name) ? "Organization" : "Person",
      name: post.author.name,
      ...(post.author.role ? { jobTitle: post.author.role } : {}),
    },
    publisher: { "@type": "Organization", name: "Jelly" },
    inLanguage: locale === "pt" ? "pt-PT" : "en",
  };

  // O caminho até aqui: casa, índice do blog, e a categoria do artigo. O título
  // não entra — é onde o leitor está, e ocuparia duas linhas.
  const crumbs = [
    { label: nav("home"), href: "/" as const, path: locale === "pt" ? "/" : "/en" },
    { label: nav("blog"), href: "/blog" as const, path: getPathname({ href: "/blog", locale }) },
    { label: post.category[locale] },
  ];

  return (
    <>
      <article className="sheet-in surface-paper mx-auto max-w-[1200px] px-5 py-16 sm:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Breadcrumbs items={crumbs} />
      <div className="mt-8 grid gap-8 lg:grid-cols-[150px_minmax(0,1fr)] lg:gap-14">
        {/* Marginália: autor, data, tempo de leitura. */}
        <aside className="flex flex-col gap-1 text-sm text-fg-soft">
          {/* A assinatura: cara, nome e função. A fotografia é redonda e pequena
              — nesta coluna de 150px é um sinal de presença, não um retrato. */}
          {post.author.photo?.src ? (
            <Image
              src={post.author.photo.src}
              alt={post.author.photo.alt ?? post.author.name}
              width={80}
              height={80}
              sizes="40px"
              className="mb-2 size-10 rounded-full object-cover"
            />
          ) : null}
          <span className="text-fg">{post.author.name}</span>
          {post.author.role ? <span className="text-xs">{post.author.role}</span> : null}
          <span>{formatter.format(new Date(post.date))}</span>
          <span>
            {post.readingMinutes} {t("minutes")}
          </span>
          {/* Ouvir, para quem não tem mãos livres para ler. O leitor só existe
              quando o ficheiro existe: um artigo por gerar fica exatamente como
              estava. A língua é a da página — um artigo lido em português numa
              página inglesa seria pior do que não haver leitor nenhum. */}
          {audio ? (
            <OuvirArtigo
              src={audio.src}
              segundos={audio.segundos}
              textos={{
                convite: t("listenInvite"),
                ouvir: t("listen"),
                pausar: t("pause"),
                barra: t("listenBar"),
              }}
            />
          ) : null}
          {post.draft && !blocks?.length ? (
            <span className="mt-3 w-fit rounded-[12px] bg-chartreuse px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-fg">
              {t("draft")}
            </span>
          ) : null}
        </aside>

        <div>
          <h1 className="editorial max-w-[26ch] text-display">{post.title[locale]}</h1>
          <hr className="mt-8 border-line" />

          {capa?.src ? (
            <Image
              src={capa.src}
              alt={capa.alt ?? ""}
              width={capa.width ?? 1200}
              height={capa.height ?? 675}
              priority
              sizes="(max-width: 1200px) 100vw, 1040px"
              className="mt-8 w-full rounded-[20px] object-cover"
            />
          ) : null}

          {/* Corpo em Lora: leitura longa, itálico verdadeiro, capitular na
              mesma família para a coluna ler como um só bloco. */}
          <div className="mt-8">
            {body?.length ? (
              <ArticleBody blocks={body} />
            ) : post.body?.length ? (
              <div className="coluna-de-leitura">
                {post.body.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`reading ${index === 0 ? "first-letter:float-left first-letter:pr-2 first-letter:font-reading first-letter:text-[3.2em] first-letter:font-semibold first-letter:leading-[0.86] first-letter:text-red" : "mt-6"}`}
                  >
                    {paragraph[locale]}
                  </p>
                ))}
              </div>
            ) : (
              <p className="reading coluna-de-leitura">{resumo}</p>
            )}
          </div>

          {/* As etiquetas: aquilo de que o artigo falou.

              Ainda não são links, e é de propósito — não há página por
              etiqueta, e um link que não leva a lado nenhum é pior do que
              nenhum. Passam a ser quando a pesquisa do blog existir; até lá são
              contexto para quem acabou de ler, e é por elas que os artigos
              relacionados aqui em baixo são escolhidos. */}
          {post.tags?.length ? (
            <div className="mt-12 flex flex-wrap items-baseline gap-x-2 gap-y-2 border-t border-line pt-8">
              <span className="eyebrow mr-1 text-fg-soft">{t("tags")}</span>
              {post.tags.map((etiqueta) => (
                <span
                  key={etiqueta.slug}
                  className="rounded-full border border-line px-3 py-1 text-xs text-fg-soft"
                >
                  {etiqueta.name[locale]}
                </span>
              ))}
            </div>
          ) : null}

          {/* A subscrição no fim do artigo: é aqui que a intenção está no
              máximo — alguém que acabou de ler tudo. A página de subscrição
              continua a existir, para quem chega por outro sítio. */}
          <div className="mt-12 max-w-[42ch] border-t border-line pt-8">
            <h2 className="editorial text-lg">{tSub("blogTitle")}</h2>
            <p className="mt-2 text-sm text-fg-soft">{tSub("blogLead")}</p>
            <div className="mt-6">
              <SubscribeForm copy={copyDaSubscricao(tSub)} lingua={locale} origem={`artigo:${slug}`} compacto superficie="papel" />
            </div>
          </div>

          {post.author.bio ? (
            <div className="mt-12 flex items-start gap-4 border-t border-line pt-8">
              {post.author.photo?.src ? (
                <Image
                  src={post.author.photo.src}
                  alt={post.author.photo.alt ?? post.author.name}
                  width={112}
                  height={112}
                  sizes="56px"
                  className="size-14 shrink-0 rounded-full object-cover"
                />
              ) : null}
              <div>
                <p className="text-md font-semibold text-fg">{post.author.name}</p>
                {post.author.role ? <p className="text-sm text-fg-soft">{post.author.role}</p> : null}
                <p className="mt-2 max-w-[60ch] text-sm text-fg-soft">{post.author.bio}</p>
              </div>
            </div>
          ) : null}

        </div>
      </div>
      </article>

      {/*
        O que se lê a seguir.

        Era um bloco dentro da coluna do artigo, com a mesma cor do que estava
        por cima e o rótulo «Relacionado» repetido três vezes — uma por título.
        Repetido não é um rótulo, é ruído: o rótulo é do grupo e diz-se uma vez.

        Passa a faixa de ponta a ponta, com superfície própria, porque é onde o
        artigo acaba e outra coisa começa. A cor é a lavanda da paleta e não o
        vermelho da casa: o vermelho é a cor com que a Jelly pede — está nas
        secções de acção, e já está aqui em cima na subscrição, que é o pedido
        verdadeiro desta página. Três ligações para outros artigos não são um
        pedido, e pintá-las de vermelho punha a cor mais forte da casa no sítio
        menos importante da página. A pastel separa sem gritar, e deixa o
        vermelho valer o que vale quando aparece.
      */}
      <section className="faixa-relacionados surface-accent-lavender">
        <div className="mx-auto max-w-[1200px] px-5 py-14 sm:px-8 lg:py-16">
          {/* O rótulo em tinta esbatida e não no vermelho do `eyebrow`: sobre
              qualquer pastel da paleta o vermelho dá 2,2 para 1 de contraste, e
              sobre o próprio vermelho da casa dá 1 para 1 — desaparece. */}
          <span className="eyebrow text-fg-soft">{t("related")}</span>
          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.slug}
                href={{ pathname: "/blog/[slug]", params: { slug: slugFor(item, locale) } }}
                className="group"
              >
                <h3 className="editorial text-lg transition-colors duration-200 group-hover:text-red">
                  {item.title[locale]}
                </h3>
              </Link>
            ))}
          </div>
          <Link
            href="/blog"
            className="mt-10 inline-block border-b border-fg pb-1 text-sm font-semibold transition-colors duration-200 hover:text-red"
          >
            ← {t("back")}
          </Link>
        </div>
      </section>
    </>
  );
}
