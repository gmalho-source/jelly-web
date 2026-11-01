import type { ArchivedProject } from "@/content/types";

type Lingua = "pt" | "en";

/**
 * A linha de apoio e as disciplinas de um projeto, na língua da página.
 *
 * O inglês só entra quando foi escrito; vazio, vale o português, como em todo
 * o resto do site. Só para mostrar: os filtros que escolhem projetos por
 * disciplina — o de Branding, o de Tecnologia — continuam a ler as
 * portuguesas, que são as que existem sempre.
 */
export function subtituloNaLingua(projeto: Pick<ArchivedProject, "subtitle" | "subtitleEn">, lingua: Lingua) {
  return (lingua === "en" && projeto.subtitleEn) || projeto.subtitle || "";
}

export function disciplinasNaLingua(projeto: Pick<ArchivedProject, "disciplines" | "disciplinesEn">, lingua: Lingua) {
  return lingua === "en" && projeto.disciplinesEn?.length ? projeto.disciplinesEn : projeto.disciplines;
}
