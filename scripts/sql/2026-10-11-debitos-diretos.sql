-- Autorizações de débito direto SEPA: a lista (debitos_diretos) e o tipo
-- «Débito direto» nos pedidos de assinatura. 17 instruções, uma por linha.
-- Correr duas vezes não faz mal. Se aparecer o botão «Commit», carregar nele
-- no fim.

alter type public.enum_assinaturas_tipo add value if not exists 'debito-direto';

do $$ begin create type public.enum_debitos_diretos_estado as enum ('rascunho', 'enviada', 'aberta', 'assinada', 'registada', 'expirada', 'revogada', 'substituida', 'cancelada'); exception when duplicate_object then null; end $$;

do $$ begin create type public.enum_debitos_diretos_tipo as enum ('nova', 'alteracao'); exception when duplicate_object then null; end $$;

create table if not exists public.debitos_diretos (id serial primary key, estado public.enum_debitos_diretos_estado default 'rascunho' not null, referencia character varying, tipo public.enum_debitos_diretos_tipo default 'nova' not null, empresa character varying not null, contacto_nome character varying not null, contacto_email character varying not null, mensagem character varying, nif character varying, iban character varying, recorrente boolean, morada character varying, signatario_nome character varying, signatario_cargo character varying, signatario_email character varying, enviada_em timestamp(3) with time zone, aberta_em timestamp(3) with time zone, assinada_em timestamp(3) with time zone, registada_em timestamp(3) with time zone, revogada_em timestamp(3) with time zone, validade timestamp(3) with time zone, ultimo_debito timestamp(3) with time zone, pedido_id integer, substituida_por_id integer, notas character varying, updated_at timestamp(3) with time zone default now() not null, created_at timestamp(3) with time zone default now() not null);

create index if not exists debitos_diretos_assinada_em_idx on public.debitos_diretos using btree (assinada_em);

create index if not exists debitos_diretos_created_at_idx on public.debitos_diretos using btree (created_at);

create index if not exists debitos_diretos_estado_idx on public.debitos_diretos using btree (estado);

create index if not exists debitos_diretos_nif_idx on public.debitos_diretos using btree (nif);

create index if not exists debitos_diretos_pedido_idx on public.debitos_diretos using btree (pedido_id);

create unique index if not exists debitos_diretos_referencia_idx on public.debitos_diretos using btree (referencia);

create index if not exists debitos_diretos_substituida_por_idx on public.debitos_diretos using btree (substituida_por_id);

create index if not exists debitos_diretos_updated_at_idx on public.debitos_diretos using btree (updated_at);

alter table public.payload_locked_documents_rels add column if not exists debitos_diretos_id integer;

create index if not exists payload_locked_documents_rels_debitos_diretos_id_idx on public.payload_locked_documents_rels using btree (debitos_diretos_id);

do $$ begin if not exists (select 1 from pg_constraint where conname = 'debitos_diretos_pedido_id_assinaturas_id_fk') then alter table public.debitos_diretos add constraint debitos_diretos_pedido_id_assinaturas_id_fk foreign key (pedido_id) references public.assinaturas(id) on delete set null; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'debitos_diretos_substituida_por_id_debitos_diretos_id_fk') then alter table public.debitos_diretos add constraint debitos_diretos_substituida_por_id_debitos_diretos_id_fk foreign key (substituida_por_id) references public.debitos_diretos(id) on delete set null; end if; end $$;

do $$ begin if not exists (select 1 from pg_constraint where conname = 'payload_locked_documents_rels_debitos_diretos_fk') then alter table public.payload_locked_documents_rels add constraint payload_locked_documents_rels_debitos_diretos_fk foreign key (debitos_diretos_id) references public.debitos_diretos(id) on delete cascade; end if; end $$;
