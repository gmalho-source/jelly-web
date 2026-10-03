-- Onde aparece um artigo: no Blog ou no Newsroom.
--
-- O blog é a voz editorial da casa — opinião, método, o que vale durante anos;
-- o newsroom é a casa a falar de si — anúncios, eventos, imprensa. Até aqui os
-- dois partilhavam os mesmos artigos, e uma notícia aparecia nas duas listas.
-- Agora cada artigo tem um campo «Onde aparece», e os do newsroom vivem em
-- /newsroom/… (o endereço /blog/… redireciona para lá).
--
-- Uma coluna nos artigos e outra nas versões deles (os artigos têm rascunhos,
-- e uma versão sem a coluna não grava), cada uma com o seu tipo. Os nomes são
-- os que o Payload cria sozinho numa base vazia. Todos os artigos ficam no
-- blog, por omissão; os que o Newsroom já aponta passam para o newsroom — na
-- tabela e na versão mais recente, que é a que o editor abre.
--
-- Uma instrução por linha, menos de 40: o SQL Editor da Neon parte o script em
-- instruções e corre cerca de 40 de cada vez.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Se o editor mostrar o botão
-- «Commit», carregar nele no fim. Correr duas vezes não faz mal.

do $$ begin create type public.enum_posts_seccao as enum ('blog', 'newsroom'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum__posts_v_version_seccao as enum ('blog', 'newsroom'); exception when duplicate_object then null; end $$;

alter table public.posts add column if not exists seccao public.enum_posts_seccao default 'blog'::public.enum_posts_seccao;

alter table public._posts_v add column if not exists version_seccao public.enum__posts_v_version_seccao default 'blog'::public.enum__posts_v_version_seccao;

update public.posts set seccao = 'newsroom' where id in (select post_id from public.news where post_id is not null);

update public._posts_v set version_seccao = 'newsroom' where latest = true and parent_id in (select post_id from public.news where post_id is not null);
