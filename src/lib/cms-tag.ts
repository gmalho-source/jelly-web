/**
 * A etiqueta do cache de conteúdo, sozinha num ficheiro.
 *
 * É uma string, e uma string não precisava de módulo próprio — precisava disto:
 * os ganchos das coleções do Payload liam-na de `@/lib/cms`, e `@/lib/cms` puxa
 * o leitor do CMS, que puxa a configuração do Payload, que carrega as coleções,
 * que carregam os ganchos. Um círculo.
 *
 * Nas páginas o círculo não se via — são desenhadas na compilação, e aí a
 * configuração já está de pé. Via-se onde o círculo começava em execução: a
 * rota `/billing/entrar` entrava pelo leitor do CMS, ficava à espera da
 * configuração, e a configuração voltava a entrar no `cms.ts`, que lia uma
 * constante ainda por inicializar. `Cannot access 'h' before initialization`,
 * 500, e o prestador com um link bom na mão e uma porta fechada à frente.
 *
 * Um módulo folha — sem importações — não pode fechar círculo nenhum.
 */
export const CMS_TAG = "cms";
