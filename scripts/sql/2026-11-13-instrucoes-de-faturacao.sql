-- Prestadores: o botão «Enviar instruções de faturação» escreve cada envio no
-- registo de acessos. São dois tipos novos de linha nesse registo.
-- 2 instruções, uma por linha. Correr duas vezes não faz mal. Se aparecer o
-- botão «Commit», carregar nele no fim. Não mexe em nada do que já lá está.

alter type public.enum_registo_faturacao_evento add value if not exists 'instrucoes';

alter type public.enum_registo_faturacao_evento add value if not exists 'instrucoes-falhou';
