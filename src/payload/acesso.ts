import type { Access, PayloadRequest } from "payload";

/**
 * Os módulos do painel, e quem entra em cada um.
 *
 * Cada utilizador tem uma lista de módulos (o campo `roles` da ficha, que no
 * painel se chama «Módulos»). Administração entra em tudo, incluindo nos
 * utilizadores. Os outros só veem no menu, e só conseguem ler e mudar pela
 * API, o que é do módulo deles.
 *
 * É aqui, e só aqui, que se decide. Uma coleção nova escolhe o seu módulo com
 * `doModulo(...)`; sem isso, o Payload deixa-a aberta a qualquer sessão — que
 * era o que acontecia com os prestadores e as mensagens.
 */
export const MODULOS = [
  { label: "Administração — tudo, incluindo utilizadores", value: "admin" },
  { label: "Blog e Newsroom", value: "editorial" },
  { label: "Páginas e trabalho", value: "paginas" },
  { label: "Mensagens do site", value: "mensagens" },
  { label: "Recrutamento", value: "recrutamento" },
  { label: "Prestadores", value: "prestadores" },
  { label: "Assinaturas", value: "assinaturas" },
  { label: "Débitos diretos", value: "debitos" },
] as const;

export type Modulo = (typeof MODULOS)[number]["value"];
export type ComModulos = { id?: string | number; roles?: string[] | null } | null | undefined;

/** Se o utilizador entra em algum destes módulos. Sem módulos pedidos, só a Administração. */
export function tem(user: ComModulos, ...modulos: Modulo[]): boolean {
  if (!user) return false;
  const meus = user.roles ?? [];
  return meus.includes("admin") || modulos.some((modulo) => meus.includes(modulo));
}

/** O mesmo, para um `req` de endpoint. */
export const podeNoPedido = (req: PayloadRequest, ...modulos: Modulo[]) => tem(req.user as ComModulos, ...modulos);

/** Regra de acesso: só quem tem um destes módulos. */
export const so =
  (...modulos: Modulo[]): Access =>
  ({ req }) =>
    tem(req.user as ComModulos, ...modulos);

/** Some do menu a quem não tem o módulo (a porta fecha-a o `access`). */
export const escondeDe =
  (...modulos: Modulo[]) =>
  ({ user }: { user: unknown }) =>
    !tem(user as ComModulos, ...modulos);

/**
 * O acesso de uma coleção de um módulo. `leituraPublica` para o que o site
 * mostra (artigos, páginas, imagens): ler continua aberto, escrever não.
 */
export const doModulo = (modulos: Modulo[], { leituraPublica = false } = {}) => ({
  read: leituraPublica ? () => true : so(...modulos),
  create: so(...modulos),
  update: so(...modulos),
  delete: so(...modulos),
});

/** A Biblioteca (imagens, vídeos) serve quem escreve artigos ou páginas. */
export const BIBLIOTECA: Modulo[] = ["editorial", "paginas"];
