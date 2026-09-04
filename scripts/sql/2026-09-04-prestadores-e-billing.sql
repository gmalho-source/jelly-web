-- Os prestadores passam do Monday para o painel, e o estado curto do magic link
-- passa da memória do processo para a base de dados.
--
-- Prestadores: quem fatura à Jelly e entra em billing.jelly.pt. Só um
-- «qualificado» entra. Aqui há IBAN, NIF e morada — só quem tem sessão no
-- painel lê.
--
-- billing_tokens e billing_attempts: um link gasto não abre duas vezes, e um
-- email não pede dez links por minuto. Viviam em memória; na Vercel cada pedido
-- pode cair numa instância diferente, e por isso ficam aqui.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estas coleções.
-- Aditivo, e correr duas vezes não faz mal.

do $$ begin create type enum_prestadores_estado as enum ('qualificado', 'parado', 'desqualificado'); exception when duplicate_object then null; end $$;
do $$ begin create type enum_prestadores_pool as enum ('design', 'development', 'marketing', 'multimedia', 'video'); exception when duplicate_object then null; end $$;
do $$ begin create type enum_prestadores_tipo as enum ('singular', 'empresa'); exception when duplicate_object then null; end $$;
do $$ begin create type enum_prestadores_regime_fiscal as enum ('iva', 'isento', 'retencao'); exception when duplicate_object then null; end $$;
do $$ begin create type enum_prestadores_estado_civil as enum ('solteiro', 'casado', 'uniao', 'divorciado', 'viuvo'); exception when duplicate_object then null; end $$;

create table if not exists prestadores (
  id serial primary key,
  nome varchar not null,
  email varchar not null,
  estado enum_prestadores_estado not null default 'qualificado',
  pool enum_prestadores_pool,
  tipo enum_prestadores_tipo,
  monday_id varchar,
  email_notificacao varchar,
  rate_hora numeric,
  nif varchar,
  iban varchar,
  regime_fiscal enum_prestadores_regime_fiscal,
  telefone varchar,
  morada varchar,
  nacionalidade varchar,
  data_nascimento timestamp(3) with time zone,
  documento varchar,
  seguranca_social varchar,
  estado_civil enum_prestadores_estado_civil,
  dependentes numeric,
  notas varchar,
  updated_at timestamp(3) with time zone not null default now(),
  created_at timestamp(3) with time zone not null default now()
);
create unique index if not exists prestadores_email_idx on prestadores (email);
create index if not exists prestadores_monday_id_idx on prestadores (monday_id);
create index if not exists prestadores_updated_at_idx on prestadores (updated_at);
create index if not exists prestadores_created_at_idx on prestadores (created_at);

-- O painel tranca documentos enquanto alguém os edita.
alter table payload_locked_documents_rels
  add column if not exists prestadores_id integer references prestadores(id) on delete cascade;
create index if not exists payload_locked_documents_rels_prestadores_id_idx
  on payload_locked_documents_rels (prestadores_id);

create table if not exists billing_tokens (
  id serial primary key,
  jti varchar not null,
  expires_at timestamp(3) with time zone not null,
  updated_at timestamp(3) with time zone not null default now(),
  created_at timestamp(3) with time zone not null default now()
);
create unique index if not exists billing_tokens_jti_idx on billing_tokens (jti);
create index if not exists billing_tokens_expires_at_idx on billing_tokens (expires_at);
create index if not exists billing_tokens_updated_at_idx on billing_tokens (updated_at);
create index if not exists billing_tokens_created_at_idx on billing_tokens (created_at);

create table if not exists billing_attempts (
  id serial primary key,
  chave varchar not null,
  count numeric not null default 0,
  reset_at timestamp(3) with time zone not null,
  updated_at timestamp(3) with time zone not null default now(),
  created_at timestamp(3) with time zone not null default now()
);
create unique index if not exists billing_attempts_chave_idx on billing_attempts (chave);
create index if not exists billing_attempts_reset_at_idx on billing_attempts (reset_at);
create index if not exists billing_attempts_updated_at_idx on billing_attempts (updated_at);
create index if not exists billing_attempts_created_at_idx on billing_attempts (created_at);
