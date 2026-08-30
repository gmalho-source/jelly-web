import type { CollectionBeforeChangeHook } from "payload";

/**
 * Um endereço que já existiu continua a existir.
 *
 * Mudar um slug no painel é mudar o endereço de uma página que já anda por aí:
 * em emails, em publicações, nos resultados do Google, no site de um cliente. O
 * antigo passava a dar 404 sem ninguém dar por isso — e um 404 não avisa quem o
 * causou, avisa quem clicou.
 *
 * Este gancho guarda o endereço antigo na própria ficha. A página encontra-se
 * por qualquer um dos seus endereços, e quando alguém chega por um antigo, o
 * site responde 308 para o certo — que é o que o Google entende como «mudou de
 * casa» em vez de «desapareceu».
 *
 * Guardar isto na ficha e não numa tabela de redirecionamentos é de propósito:
 * apagar a ficha leva os endereços dela atrás, e nunca fica um redirecionamento
 * órfão a apontar para uma página que já não existe.
 */
export const guardaSlugsAntigos: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  if (!originalDoc) return data;

  const antigos = new Set<string>(
    Array.isArray(originalDoc.oldSlugs) ? originalDoc.oldSlugs.map((slug: unknown) => String(slug)) : [],
  );

  // Os dois endereços: o português e o inglês. Mudar qualquer um deixa órfão o
  // que lá estava.
  for (const campo of ["slug", "slugEn"] as const) {
    const antes = String(originalDoc[campo] ?? "").trim();
    const agora = String(data[campo] ?? "").trim();
    if (antes && antes !== agora) antigos.add(antes);
  }

  // Um endereço que voltou a ser o atual deixa de ser antigo: senão a página
  // redirecionava-se a si própria, em ciclo.
  for (const campo of ["slug", "slugEn"] as const) {
    const agora = String(data[campo] ?? "").trim();
    if (agora) antigos.delete(agora);
  }

  return { ...data, oldSlugs: [...antigos] };
};
