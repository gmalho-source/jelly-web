-- O bloco «Separador» na história de um caso.
--
-- Espaço entre dois blocos, pequeno, médio ou grande, com ou sem uma linha a
-- meio. Os blocos já têm a sua margem, e na maior parte das histórias chega;
-- mas há mudanças de assunto que pedem mais ar, e isso é uma decisão de quem
-- escreve.
--
-- Cada tipo de bloco do Payload vive numa tabela sua, ligada ao projeto por
-- `_parent_id`: uma para os projetos e outra para as versões, porque os
-- projetos têm rascunhos e uma versão sem a tabela não grava. Os nomes das
-- tabelas, dos tipos, dos índices e das chaves são os que o Payload cria
-- sozinho numa base vazia — tirados de lá, e não escritos à mão.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy. Aditivo: não toca em nada do
-- que já lá está, e correr duas vezes não faz mal.

do $$ begin
  create type enum_projects_blocks_separador_tamanho as enum ('pequeno', 'medio', 'grande');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enum__projects_v_blocks_separador_tamanho as enum ('pequeno', 'medio', 'grande');
exception when duplicate_object then null; end $$;

create table if not exists projects_blocks_separador (
  _order integer not null,
  _parent_id integer not null,
  _path text not null,
  id character varying not null primary key,
  tamanho enum_projects_blocks_separador_tamanho default 'medio',
  linha boolean default false,
  block_name character varying
);

do $$ begin
  alter table projects_blocks_separador add constraint projects_blocks_separador_parent_id_fk
    foreign key (_parent_id) references projects(id) on delete cascade;
exception when duplicate_object then null; end $$;

create index if not exists projects_blocks_separador_order_idx on projects_blocks_separador (_order);
create index if not exists projects_blocks_separador_parent_id_idx on projects_blocks_separador (_parent_id);
create index if not exists projects_blocks_separador_path_idx on projects_blocks_separador (_path);

create table if not exists _projects_v_blocks_separador (
  _order integer not null,
  _parent_id integer not null,
  _path text not null,
  id serial primary key,
  tamanho enum__projects_v_blocks_separador_tamanho default 'medio',
  linha boolean default false,
  _uuid character varying,
  block_name character varying
);

do $$ begin
  alter table _projects_v_blocks_separador add constraint _projects_v_blocks_separador_parent_id_fk
    foreign key (_parent_id) references _projects_v(id) on delete cascade;
exception when duplicate_object then null; end $$;

create index if not exists _projects_v_blocks_separador_order_idx on _projects_v_blocks_separador (_order);
create index if not exists _projects_v_blocks_separador_parent_id_idx on _projects_v_blocks_separador (_parent_id);
create index if not exists _projects_v_blocks_separador_path_idx on _projects_v_blocks_separador (_path);
