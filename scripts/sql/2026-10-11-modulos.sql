-- Módulos por utilizador: os perfis novos na lista dos utilizadores. 5
-- instruções, uma por linha. Correr duas vezes não faz mal. Se aparecer o botão
-- «Commit», carregar nele no fim. Os utilizadores atuais não mudam: os da
-- Administração continuam com tudo, e o «Conteúdo» passa a chamar-se «Blog e
-- Newsroom».

alter type public.enum_users_roles add value if not exists 'paginas' before 'recrutamento';

alter type public.enum_users_roles add value if not exists 'mensagens' before 'recrutamento';

alter type public.enum_users_roles add value if not exists 'prestadores' after 'recrutamento';

alter type public.enum_users_roles add value if not exists 'assinaturas' after 'prestadores';

alter type public.enum_users_roles add value if not exists 'debitos' after 'assinaturas';
