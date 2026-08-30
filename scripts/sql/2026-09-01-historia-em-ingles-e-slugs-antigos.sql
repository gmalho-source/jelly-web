-- Duas coisas: a história de um caso em inglês, e os endereços que uma peça já
-- teve.
--
-- Correr na Neon, no SQL Editor, ANTES do deploy que usa estes campos.
-- Aditivo, e correr duas vezes não faz mal.

-- ── A história em inglês ───────────────────────────────────────────────────
-- O inglês entra ao lado do português no mesmo bloco, e não numa segunda
-- história: a estrutura de um caso é a mesma nas duas línguas, e duas
-- estruturas a manter divergem no primeiro dia em que alguém acrescenta um
-- bloco só de um lado. Nada se mexe do que já lá está — o que existe é
-- português e continua onde está.
alter table projects_blocks_text add column if not exists heading_en varchar;
alter table projects_blocks_text add column if not exists body_en varchar;
alter table projects_blocks_link add column if not exists label_en varchar;

alter table _projects_v_blocks_text add column if not exists heading_en varchar;
alter table _projects_v_blocks_text add column if not exists body_en varchar;
alter table _projects_v_blocks_link add column if not exists label_en varchar;

-- ── Os endereços antigos ───────────────────────────────────────────────────
-- Mudar um slug no painel é mudar o endereço de uma página que já anda por aí.
-- O antigo fica guardado na própria ficha, e quem chegar por ele leva 308 para
-- o atual. Na ficha e não numa tabela de redirecionamentos: apagar a peça leva
-- os endereços dela atrás, e nunca fica um redirecionamento órfão.
--
-- Um campo de texto com muitos valores vive numa tabela `_texts`, com o `path`
-- a dizer de que campo é. Onde ela já existir, o `if not exists` não faz nada.
create table if not exists projects_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references projects(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists projects_texts_order_parent on projects_texts ("order", parent_id);

create table if not exists _projects_v_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references _projects_v(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists _projects_v_texts_order_parent on _projects_v_texts ("order", parent_id);

create table if not exists posts_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references posts(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists posts_texts_order_parent on posts_texts ("order", parent_id);

create table if not exists _posts_v_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references _posts_v(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists _posts_v_texts_order_parent on _posts_v_texts ("order", parent_id);

create table if not exists services_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references services(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists services_texts_order_parent on services_texts ("order", parent_id);

create table if not exists jobs_texts (
  id serial primary key,
  "order" integer not null,
  parent_id integer not null references jobs(id) on delete cascade,
  path varchar not null,
  text varchar
);
create index if not exists jobs_texts_order_parent on jobs_texts ("order", parent_id);
