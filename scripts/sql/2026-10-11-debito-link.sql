-- Link único dos débitos diretos: a chave do link e a marca «Pelo link» nas
-- autorizações. 3 instruções, uma por linha. Correr duas vezes não faz mal. Se
-- aparecer o botão «Commit», carregar nele no fim.

do $$ begin create type public.enum_debitos_diretos_via as enum ('painel', 'link'); exception when duplicate_object then null; end $$;

alter table public.debitos_diretos add column if not exists via public.enum_debitos_diretos_via default 'painel';

create table if not exists public.debito_link (id serial primary key, ativo boolean default true, chave character varying, updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone);
