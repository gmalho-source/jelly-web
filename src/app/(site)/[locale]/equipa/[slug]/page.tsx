import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ViewTransition } from "react";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { getTeam } from "@/lib/cms";
import { coresDaEquipa, slugDaPessoa } from "@/lib/equipa";
import { alternates } from "@/lib/seo";
import { SairComEsc } from "./SairComEsc";

type Params = { locale: Locale; slug: string };

export async function generateStaticParams() {
  const team = await getTeam();
  return team.map((membro) => ({ slug: slugDaPessoa(membro.name) }));
}

/** A pessoa, a cor dela e quem está antes e depois na grelha. */
async function acha(slug: string, locale: Locale) {
  const team = await getTeam();
  const posicao = team.findIndex((membro) => slugDaPessoa(membro.name) === slug);
  if (posicao < 0) return null;

  const membro = team[posicao];
  const cores = coresDaEquipa(team.map((pessoa) => pessoa.name));
  const vizinha = (indice: number) => {
    const outra = team[(indice + team.length) % team.length];
    return { nome: outra.name, slug: slugDaPessoa(outra.name) };
  };

  return {
    nome: membro.name,
    funcao: membro.role?.[locale] || membro.role?.pt || undefined,
    apresentacao: membro.bio?.[locale] || membro.bio?.pt || undefined,
    retrato: membro.photoColor ?? membro.photo,
    linkedin: membro.linkedin,
    cor: cores.get(membro.name),
    // A grelha dá a volta: da última pessoa passa-se para a primeira. Numa
    // lista de vinte e uma, um beco sem saída no fim é pior do que uma volta.
    anterior: team.length > 1 ? vizinha(posicao - 1) : null,
    seguinte: team.length > 1 ? vizinha(posicao + 1) : null,
  };
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const pessoa = await acha(slug, locale);
  if (!pessoa) return {};

  const titulo = pessoa.funcao ? `${pessoa.nome} — ${pessoa.funcao}` : pessoa.nome;
  return {
    title: titulo,
    // A primeira frase da apresentação chega para a description: o resto é
    // história, e a história não cabe nos resultados de pesquisa.
    description: pessoa.apresentacao?.split("\n")[0]?.slice(0, 300),
    alternates: alternates(() => ({ pathname: "/equipa/[slug]" as const, params: { slug } }), locale),
    openGraph: pessoa.retrato ? { images: [{ url: pessoa.retrato.src }] } : undefined,
  };
}

/**
 * A página de uma pessoa da equipa, em ecrã cheio.
 *
 * Duas colunas do tamanho do ecrã: o retrato a cores assente na cor da pessoa,
 * e ao lado o nome, a função e a apresentação. Era um diálogo de novecentos
 * pixels, e um diálogo faz três coisas mal — não tem endereço para partilhar,
 * não tem entrada no Google, e obriga a fechar antes de ver a pessoa seguinte.
 *
 * A abertura é o retrato a voar: o mosaico da grelha e este retrato têm o mesmo
 * nome de transição, e por isso o browser leva um pelo outro — o preto e branco
 * sai do mosaico, atravessa o ecrã e chega aqui a cores. O fecho é o mesmo
 * caminho ao contrário, e é por isso que a saída volta pelo histórico: só
 * voltando à grelha de onde se veio o retrato encontra o mosaico dele.
 *
 * O texto não vem com o retrato: entra depois, linha a linha, para o retrato ser
 * a primeira coisa que assenta. Está em `.perfil-entra`, no globals.css.
 */
export default async function PessoaPage({ params }: { params: Promise<Params> }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const pessoa = await acha(slug, locale);
  if (!pessoa) notFound();

  const t = await getTranslations("equipa");

  // O ecrã cheio conta-se a partir da faixa escura do topo, que é a casa do
  // menu: o `main` do site empurra tudo 96px para baixo, e sem os descontar a
  // página ficava um ecrã mais 96 e obrigava a rolar para ver o fim dela.
  return (
    <article className="surface-paper grid lg:min-h-[calc(100svh-6rem)] lg:grid-cols-[minmax(0,46%)_minmax(0,1fr)]">
      <SairComEsc />

      {/* O retrato, assente na cor da pessoa. */}
      <div style={{ backgroundColor: pessoa.cor }} className="p-4 sm:p-6 lg:p-8">
        <ViewTransition name={`retrato-${slug}`} share="retrato" default="none">
          <div className="relative aspect-[4/5] overflow-clip rounded-[10px] bg-ink/10 sm:aspect-[3/2] lg:aspect-auto lg:h-full">
            {pessoa.retrato ? (
              <Image
                src={pessoa.retrato.src}
                alt={pessoa.retrato.alt ?? pessoa.nome}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 46vw"
                className="object-cover object-top"
              />
            ) : null}
          </div>
        </ViewTransition>
      </div>

      {/* O texto. */}
      <div className="flex flex-col px-5 pb-8 pt-8 sm:px-10 lg:px-14 lg:pb-10 lg:pt-10">
        <Link href="/equipa" className="link-quiet text-xs uppercase tracking-[0.14em] text-fg-soft">
          <span aria-hidden="true">←</span> {t("back")}
        </Link>

        <div className="perfil-entra my-auto max-w-[60ch] py-10">
          <p className="eyebrow">{pessoa.funcao ?? t("eyebrow")}</p>
          <h1 className="mt-4 text-[clamp(38px,4.4vw,68px)] leading-[1.02]">{pessoa.nome}</h1>
          <div className="mt-7 space-y-4 text-md leading-relaxed text-fg-soft">
            {(pessoa.apresentacao ?? t("noBio")).split("\n").map((paragrafo, indice) => (
              <p key={indice}>{paragrafo}</p>
            ))}
          </div>
          {pessoa.linkedin ? (
            <a
              href={pessoa.linkedin}
              target="_blank"
              rel="noreferrer"
              className="link-quiet mt-8 inline-block text-sm font-semibold text-red"
            >
              {t("linkedin")} <span aria-hidden="true">→</span>
            </a>
          ) : null}
        </div>

        {/* As pessoas do lado: da última passa-se à primeira, sem beco. */}
        <nav aria-label={t("eyebrow")} className="flex items-center justify-between gap-6 border-t border-line pt-5 text-sm">
          {pessoa.anterior ? (
            <Link
              href={{ pathname: "/equipa/[slug]", params: { slug: pessoa.anterior.slug } }}
              className="link-quiet text-fg-soft"
            >
              <span aria-hidden="true">←</span> {pessoa.anterior.nome}
            </Link>
          ) : (
            <span />
          )}

          {pessoa.seguinte ? (
            <Link
              href={{ pathname: "/equipa/[slug]", params: { slug: pessoa.seguinte.slug } }}
              className="link-quiet text-right text-fg-soft"
            >
              {pessoa.seguinte.nome} <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  );
}
