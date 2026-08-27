import { team } from "@/content/team";
import type { TeamMember } from "@/content/types";

/**
 * As regras de quando é que uma ficha da equipa está a precisar do ficheiro do
 * repositório.
 *
 * Vivem aqui e não no script nem no painel porque são os dois a usá-las, e as
 * regras têm de ser as mesmas: quem correr o script na linha de comandos e quem
 * carregar no botão do painel tem de obter o mesmo resultado.
 *
 * A regra que manda em todas: um campo com valor no painel nunca é tocado. Quem
 * o escreveu lá sabia mais do que este ficheiro.
 */

/** Um retrato à espera de subir: em que campo entra e onde está o ficheiro. */
export type RetratoEmFalta = { campo: "photo" | "photoColor"; src: string; alt: string; titulo: string };

export type Ficha = Record<string, unknown> | null | undefined;

const vazio = (valor: unknown) => !String(valor ?? "").trim();

function grupo(ficha: Ficha, nome: string) {
  const valor = (ficha?.[nome] ?? {}) as Record<string, unknown>;
  return { pt: valor.pt, en: valor.en };
}

/**
 * O que falta a uma ficha, campo a campo.
 *
 * A apresentação vai só em português: a inglesa faz-se no painel, com o botão de
 * traduzir, por quem a lê antes de gravar. Uma tradução automática gravada sem
 * ninguém a ver é a única coisa desta página que não devia acontecer sozinha.
 */
export function camposEmFalta(pessoa: TeamMember, ficha?: Ficha) {
  const dados: Record<string, unknown> = {};
  const retratos: RetratoEmFalta[] = [];

  const papel = grupo(ficha, "role");
  if (pessoa.role && vazio(papel.pt) && vazio(papel.en)) dados.role = pessoa.role;

  const apresentacao = grupo(ficha, "bio");
  if (pessoa.bio?.pt && vazio(apresentacao.pt) && vazio(apresentacao.en)) dados.bio = { pt: pessoa.bio.pt };

  if (pessoa.linkedin && vazio(ficha?.linkedin)) dados.linkedin = pessoa.linkedin;

  if (!ficha?.photo && pessoa.photo?.src) {
    retratos.push({
      campo: "photo",
      src: pessoa.photo.src,
      alt: pessoa.photo.alt ?? pessoa.name,
      titulo: `${pessoa.name} (preto e branco)`,
    });
  }
  if (!ficha?.photoColor && pessoa.photoColor?.src) {
    retratos.push({
      campo: "photoColor",
      src: pessoa.photoColor.src,
      alt: pessoa.photoColor.alt ?? pessoa.name,
      titulo: `${pessoa.name} (cor)`,
    });
  }

  return { dados, retratos };
}

/** Os nomes dos campos em falta, para dizer a quem está a olhar. */
export function nomesDoQueFalta(pessoa: TeamMember, ficha?: Ficha) {
  const { dados, retratos } = camposEmFalta(pessoa, ficha);
  return [...Object.keys(dados), ...retratos.map((retrato) => retrato.campo)];
}

/** As pessoas do ficheiro do repositório, por nome em minúsculas. */
export function pessoasDoFicheiro() {
  return new Map(team.map((pessoa) => [pessoa.name.trim().toLowerCase(), pessoa]));
}

export { team as equipaDoFicheiro };
