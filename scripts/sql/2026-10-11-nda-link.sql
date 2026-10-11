-- Link fixo do NDA (preenchido pelo próprio prestador) e pedido de assinatura
-- que começa pela escolha NDA / outro documento. 17 instruções, uma por linha.
-- Correr duas vezes não faz mal. Se aparecer o botão «Commit», carregar nele
-- no fim.

do $$ begin create type public.enum_assinaturas_via as enum ('painel', 'link'); exception when duplicate_object then null; end $$;

alter table public.assinaturas add column if not exists via public.enum_assinaturas_via default 'painel';

alter table public.assinaturas add column if not exists dados_do_prestador_nome character varying;

alter table public.assinaturas add column if not exists dados_do_prestador_email character varying;

alter table public.assinaturas add column if not exists dados_do_prestador_telefone character varying;

alter table public.assinaturas add column if not exists dados_do_prestador_nif character varying;

alter table public.assinaturas add column if not exists dados_do_prestador_documento character varying;

alter table public.assinaturas add column if not exists dados_do_prestador_morada character varying;

alter table public.assinaturas alter column titulo drop not null;

alter table public.assinaturas alter column tipo drop default;

alter table public.assinaturas alter column tipo drop not null;

alter table public.assinaturas alter column origem drop default;

alter table public.assinaturas_signatarios alter column nome drop not null;

alter table public.assinaturas_signatarios alter column email drop not null;

alter table public.prestadores add column if not exists dados_a_rever boolean default false;

create table if not exists public.nda_link (id serial primary key, ativo boolean default true, chave character varying, updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone);

update public.assinaturas set via = 'painel' where via is null;
