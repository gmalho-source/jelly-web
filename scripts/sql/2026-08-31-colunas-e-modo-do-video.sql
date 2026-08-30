-- Duas coisas na história de um caso: blocos lado a lado, e o vídeo a saber se
-- é um fundo ou um filme.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos.
-- Aditivo, e correr duas vezes não faz mal.

-- ── O vídeo sabe o que é ───────────────────────────────────────────────────
-- Ambiente: corre sozinho, sem som, em ciclo, sem controlos — um fundo.
-- Filme: começa parado, com controlos e com som — uma peça que se vê.
do $$ begin
  create type enum_projects_blocks_video_modo as enum ('ambiente', 'filme');
exception when duplicate_object then null; end $$;

do $$ begin
  create type enum__projects_v_blocks_video_modo as enum ('ambiente', 'filme');
exception when duplicate_object then null; end $$;

alter table projects_blocks_video
  add column if not exists modo enum_projects_blocks_video_modo default 'ambiente';

alter table _projects_v_blocks_video
  add column if not exists modo enum__projects_v_blocks_video_modo default 'ambiente';

-- ── Blocos lado a lado ─────────────────────────────────────────────────────
-- Duas tabelas por árvore: o bloco, e as colunas dentro dele. O conteúdo de
-- cada coluna não precisa de tabelas novas — os blocos simples continuam nas
-- suas, e é o `_path` que diz onde cada um está («story.1.colunas.0.blocos»).
create table if not exists projects_blocks_colunas (
  _order integer not null,
  _parent_id integer not null references projects(id) on delete cascade,
  _path text not null,
  id varchar primary key,
  block_name varchar
);

create index if not exists projects_blocks_colunas_order_idx on projects_blocks_colunas (_order);
create index if not exists projects_blocks_colunas_parent_id_idx on projects_blocks_colunas (_parent_id);
create index if not exists projects_blocks_colunas_path_idx on projects_blocks_colunas (_path);

create table if not exists projects_blocks_colunas_colunas (
  _order integer not null,
  _parent_id varchar not null references projects_blocks_colunas(id) on delete cascade,
  id varchar primary key
);

create index if not exists projects_blocks_colunas_colunas_order_idx on projects_blocks_colunas_colunas (_order);
create index if not exists projects_blocks_colunas_colunas_parent_id_idx on projects_blocks_colunas_colunas (_parent_id);

-- E o mesmo para as versões, que é onde os rascunhos vivem.
create table if not exists _projects_v_blocks_colunas (
  _order integer not null,
  _parent_id integer not null references _projects_v(id) on delete cascade,
  _path text not null,
  id serial primary key,
  _uuid varchar,
  block_name varchar
);

create index if not exists _projects_v_blocks_colunas_order_idx on _projects_v_blocks_colunas (_order);
create index if not exists _projects_v_blocks_colunas_parent_id_idx on _projects_v_blocks_colunas (_parent_id);
create index if not exists _projects_v_blocks_colunas_path_idx on _projects_v_blocks_colunas (_path);

create table if not exists _projects_v_blocks_colunas_colunas (
  _order integer not null,
  _parent_id integer not null references _projects_v_blocks_colunas(id) on delete cascade,
  id serial primary key,
  _uuid varchar
);

create index if not exists _projects_v_blocks_colunas_colunas_order_idx on _projects_v_blocks_colunas_colunas (_order);
create index if not exists _projects_v_blocks_colunas_colunas_parent_id_idx on _projects_v_blocks_colunas_colunas (_parent_id);
